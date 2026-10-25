import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

// Cria um pagamento pendente e uma preferência do Checkout Pro do Mercado Pago.
// Secrets: MP_ACCESS_TOKEN (obrigatório), SITE_URL (opcional).

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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const mpToken = Deno.env.get("MP_ACCESS_TOKEN");
  const siteUrl = (Deno.env.get("SITE_URL") || "https://bioflowzy.com").replace(/\/$/, "");

  if (!mpToken) return json({ error: "Pagamentos ainda não configurados." }, 503);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "Faça login para assinar." }, 401);

  const body = await req.json().catch(() => ({}));
  const plan = String(body?.plan ?? "");
  const period = String(body?.period ?? "");
  if (!PAID_PLANS.includes(plan)) return json({ error: "Plano inválido." }, 400);
  const periodInfo = PERIODS[period];
  if (!periodInfo) return json({ error: "Período inválido." }, 400);

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data: profile } = await admin
    .from("profiles")
    .select("suspended_at")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return json({ error: "Perfil não encontrado." }, 404);
  if (profile.suspended_at) return json({ error: "Conta suspensa." }, 403);

  // O preço vem do banco, nunca do navegador
  const { data: planRow } = await admin
    .from("plans")
    .select("name, price_cents, price_annual_cents, is_active")
    .eq("slug", plan)
    .maybeSingle();
  const amount = planRow?.[periodInfo.column];
  if (!planRow?.is_active || !amount || amount <= 0) {
    return json({ error: "Plano indisponível no momento." }, 400);
  }

  const { data: payment, error: payErr } = await admin
    .from("payments")
    .insert({ profile_id: user.id, plan_slug: plan, period, amount_cents: amount })
    .select("id")
    .single();
  if (payErr || !payment) {
    console.error("insert payment failed", payErr);
    return json({ error: "Não foi possível iniciar o pagamento." }, 500);
  }

  const prefRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mpToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": payment.id,
    },
    body: JSON.stringify({
      items: [{
        id: `${plan}_${period}`,
        title: `BioFlowzy ${planRow.name} ${periodInfo.label}`,
        quantity: 1,
        unit_price: amount / 100,
        currency_id: "BRL",
      }],
      payer: user.email ? { email: user.email } : undefined,
      external_reference: payment.id,
      notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
      back_urls: {
        success: `${siteUrl}/dashboard?payment=success`,
        pending: `${siteUrl}/dashboard?payment=pending`,
        failure: `${siteUrl}/dashboard?payment=failure`,
      },
      auto_return: "approved",
      statement_descriptor: "BIOFLOWZY",
    }),
  });

  const pref = await prefRes.json().catch(() => null);
  if (!prefRes.ok || !pref?.init_point) {
    console.error("mercadopago preference failed", prefRes.status, pref);
    await admin.from("payments").update({ status: "error", updated_at: new Date().toISOString() }).eq("id", payment.id);
    return json({ error: "Não foi possível iniciar o pagamento." }, 502);
  }

  await admin.from("payments").update({ mp_preference_id: pref.id }).eq("id", payment.id);

  return json({ url: pref.init_point });
});
