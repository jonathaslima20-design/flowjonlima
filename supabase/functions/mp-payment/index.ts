import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";
import { paymentMetaContext, sendPurchase } from "../_shared/meta.ts";

// Checkout transparente (dentro do painel) pela API de Pagamentos do Mercado Pago.
// Ações (usuário logado):
//   { action: "config" }                                  → { enabled, publicKey }
//   { action: "pix",  plan, period, payer }               → cria PIX e devolve QR code / copia e cola
//   { action: "card", plan, period, card }                → paga com o token gerado pelo Card Payment Brick
// O preço vem do banco. A liberação do plano segue pelo mp-webhook; no cartão aprovado na hora,
// chama grant_paid_plan aqui mesmo (é idempotente).
// Chaves: Admin → Pagamentos (Vault, via get_payment_secrets) ou secrets MP_ACCESS_TOKEN / MP_PUBLIC_KEY.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PAID_PLANS = ["pro", "business"];
const PERIODS: Record<string, { label: string; column: "price_cents" | "price_annual_cents" }> = {
  quarterly: { label: "Trimestral", column: "price_cents" },
  annual: { label: "Anual", column: "price_annual_cents" },
};
const KNOWN_STATUSES = ["pending", "approved", "authorized", "in_process", "in_mediation", "rejected", "cancelled", "refunded", "charged_back"];
const PIX_MINUTES = 60;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function onlyDigits(v: unknown) {
  return String(v ?? "").replace(/\D/g, "");
}

function identification(raw: unknown) {
  const number = onlyDigits(raw);
  if (number.length === 11) return { type: "CPF", number };
  if (number.length === 14) return { type: "CNPJ", number };
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  const { data: secrets } = await admin.rpc("get_payment_secrets");
  const vault = (secrets ?? {}) as Record<string, string>;
  const mpToken = vault.mp_access_token || Deno.env.get("MP_ACCESS_TOKEN");
  const publicKey = vault.mp_public_key || Deno.env.get("MP_PUBLIC_KEY") || null;

  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "Faça login para assinar." }, 401);

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? "");

  if (action === "config") {
    return json({ enabled: !!mpToken, publicKey: mpToken ? publicKey : null });
  }
  if (action !== "pix" && action !== "card") return json({ error: "Ação inválida." }, 400);
  if (!mpToken) return json({ error: "Pagamentos ainda não configurados." }, 503);

  const plan = String(body?.plan ?? "");
  const period = String(body?.period ?? "");
  if (!PAID_PLANS.includes(plan)) return json({ error: "Plano inválido." }, 400);
  const periodInfo = PERIODS[period];
  if (!periodInfo) return json({ error: "Período inválido." }, 400);

  const { data: profile } = await admin.from("profiles").select("suspended_at").eq("id", user.id).maybeSingle();
  if (!profile) return json({ error: "Perfil não encontrado." }, 404);
  if (profile.suspended_at) return json({ error: "Conta suspensa." }, 403);

  const { data: planRow } = await admin
    .from("plans")
    .select("name, price_cents, price_annual_cents, is_active")
    .eq("slug", plan)
    .maybeSingle();
  const amount = planRow?.[periodInfo.column];
  if (!planRow?.is_active || !amount || amount <= 0) return json({ error: "Plano indisponível no momento." }, 400);

  // Monta o pagamento antes de gravar, para não deixar linha pendente por erro de formulário
  let mpBody: Record<string, unknown>;
  if (action === "pix") {
    const payer = body?.payer ?? {};
    const firstName = String(payer.first_name ?? "").trim().slice(0, 60);
    const lastName = String(payer.last_name ?? "").trim().slice(0, 60);
    const ident = identification(payer.document);
    if (!firstName) return json({ error: "Informe seu nome." }, 400);
    if (!ident) return json({ error: "Informe um CPF ou CNPJ válido." }, 400);
    mpBody = {
      payment_method_id: "pix",
      date_of_expiration: new Date(Date.now() + PIX_MINUTES * 60_000).toISOString().replace("Z", "-00:00"),
      payer: { email: user.email, first_name: firstName, last_name: lastName || undefined, identification: ident },
    };
  } else {
    const card = body?.card ?? {};
    const token = String(card.token ?? "");
    const methodId = String(card.payment_method_id ?? "");
    const installments = Math.min(12, Math.max(1, Math.floor(Number(card.installments) || 1)));
    const ident = identification(card.payer?.identification?.number);
    if (!token || !methodId) return json({ error: "Dados do cartão incompletos." }, 400);
    if (!ident) return json({ error: "Informe um CPF ou CNPJ válido." }, 400);
    mpBody = {
      token,
      payment_method_id: methodId,
      issuer_id: card.issuer_id ? String(card.issuer_id) : undefined,
      installments,
      payer: { email: String(card.payer?.email || user.email), identification: ident },
    };
  }

  const { data: payment, error: payErr } = await admin
    .from("payments")
    .insert({ profile_id: user.id, plan_slug: plan, period, amount_cents: amount, meta_context: paymentMetaContext(req, body?.meta) })
    .select("id")
    .single();
  if (payErr || !payment) {
    console.error("insert payment failed", payErr);
    return json({ error: "Não foi possível iniciar o pagamento." }, 500);
  }

  const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mpToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": payment.id,
    },
    body: JSON.stringify({
      ...mpBody,
      transaction_amount: amount / 100,
      description: `BioFlowzy ${planRow.name} ${periodInfo.label}`,
      statement_descriptor: "BIOFLOWZY",
      external_reference: payment.id,
      notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
    }),
  });
  const mp = await mpRes.json().catch(() => null);

  if (!mpRes.ok || !mp?.id) {
    console.error("mercadopago payment failed", mpRes.status, mp);
    await admin.from("payments").update({
      status: "error",
      mp_status_detail: String(mp?.cause?.[0]?.code ?? mp?.message ?? "create_failed").slice(0, 200),
      updated_at: new Date().toISOString(),
    }).eq("id", payment.id);
    const invalidDoc = JSON.stringify(mp ?? {}).includes("identification");
    return json({ error: invalidDoc ? "CPF ou CNPJ inválido." : "Não foi possível criar o pagamento. Confira os dados e tente novamente." }, 502);
  }

  const status = KNOWN_STATUSES.includes(mp.status) ? mp.status : "pending";
  await admin.from("payments").update({
    status: status === "approved" ? "pending" : status,
    mp_payment_id: String(mp.id),
    mp_status_detail: mp.status_detail ?? null,
    updated_at: new Date().toISOString(),
  }).eq("id", payment.id);

  if (action === "pix") {
    const tx = mp.point_of_interaction?.transaction_data ?? {};
    return json({
      paymentId: payment.id,
      status,
      qrCode: tx.qr_code ?? null,
      qrCodeBase64: tx.qr_code_base64 ?? null,
      ticketUrl: tx.ticket_url ?? null,
      expiresAt: mp.date_of_expiration ?? null,
    });
  }

  if (status === "approved") {
    const paidCents = Math.round(Number(mp.transaction_amount) * 100);
    if (mp.currency_id === "BRL" && paidCents >= amount) {
      const { error } = await admin.rpc("grant_paid_plan", { p_payment_id: payment.id });
      if (error) console.error("grant_paid_plan failed", error);
      else await sendPurchase(admin, payment.id);
    }
  }

  return json({ paymentId: payment.id, status, statusDetail: mp.status_detail ?? null });
});
