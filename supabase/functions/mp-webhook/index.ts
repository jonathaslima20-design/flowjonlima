import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

// Recebe notificações do Mercado Pago. A fonte da verdade é sempre a consulta do
// pagamento na API do Mercado Pago, então uma notificação forjada não libera plano.
// Chaves: Admin → Pagamentos (Vault, via get_payment_secrets) ou secrets MP_ACCESS_TOKEN / MP_WEBHOOK_SECRET.
// A assinatura secreta valida o x-signature.
// Deploy com verify_jwt = false (o Mercado Pago não envia JWT).

const KNOWN_STATUSES = ["pending", "approved", "authorized", "in_process", "in_mediation", "rejected", "cancelled", "refunded", "charged_back"];

function ok(msg = "ok") {
  return new Response(msg, { status: 200 });
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
async function validSignature(req: Request, dataIdFromUrl: string | null, secret: string): Promise<boolean> {
  const header = req.headers.get("x-signature");
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => p.trim().split("=", 2) as [string, string]),
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const requestId = req.headers.get("x-request-id");
  let manifest = "";
  if (dataIdFromUrl) manifest += `id:${dataIdFromUrl.toLowerCase()};`;
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${ts};`;

  return safeEqual(await hmacHex(secret, manifest), v1);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return ok();

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const { data: secrets } = await admin.rpc("get_payment_secrets");
  const vault = (secrets ?? {}) as Record<string, string>;
  const mpToken = vault.mp_access_token || Deno.env.get("MP_ACCESS_TOKEN");
  const webhookSecret = vault.mp_webhook_secret || Deno.env.get("MP_WEBHOOK_SECRET");
  if (!mpToken) return new Response("not configured", { status: 503 });

  const url = new URL(req.url);
  const body = await req.json().catch(() => ({} as Record<string, any>));
  const type = body?.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const dataIdFromUrl = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  const paymentId = String(body?.data?.id ?? dataIdFromUrl ?? "");

  if (type !== "payment" || !paymentId) return ok("ignored");

  if (webhookSecret && req.headers.get("x-signature")) {
    if (!(await validSignature(req, dataIdFromUrl, webhookSecret))) {
      console.warn("invalid x-signature", paymentId);
      return new Response("invalid signature", { status: 401 });
    }
  }

  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${mpToken}` },
  });
  if (mpRes.status === 404) return ok("payment not found");
  if (!mpRes.ok) {
    // 5xx faz o Mercado Pago reenviar a notificação depois
    console.error("mercadopago get payment failed", mpRes.status);
    return new Response("upstream error", { status: 502 });
  }
  const mp = await mpRes.json();

  const reference = mp.external_reference;
  if (!reference) return ok("no reference");

  const { data: payment } = await admin
    .from("payments")
    .select("id, amount_cents, status, plan_granted_until")
    .eq("id", reference)
    .maybeSingle();
  if (!payment) return ok("unknown reference");

  const status = KNOWN_STATUSES.includes(mp.status) ? mp.status : "pending";

  // Não rebaixa um pagamento já aprovado por causa de uma notificação atrasada
  if (payment.status !== "approved" || ["refunded", "charged_back"].includes(status)) {
    await admin.from("payments").update({
      status: status === "approved" ? payment.status : status,
      mp_payment_id: String(mp.id),
      mp_status_detail: mp.status_detail ?? null,
      updated_at: new Date().toISOString(),
    }).eq("id", payment.id);
  }

  if (status === "approved" && !payment.plan_granted_until) {
    const paidCents = Math.round(Number(mp.transaction_amount) * 100);
    if (mp.currency_id !== "BRL" || paidCents < payment.amount_cents) {
      console.error("amount mismatch", { reference, paidCents, expected: payment.amount_cents, currency: mp.currency_id });
      await admin.from("payments").update({ status: "error", mp_status_detail: "amount_mismatch" }).eq("id", payment.id);
      return ok("amount mismatch");
    }

    const { error } = await admin.rpc("grant_paid_plan", { p_payment_id: payment.id });
    if (error) {
      console.error("grant_paid_plan failed", error);
      return new Response("grant failed", { status: 500 });
    }
  }

  return ok();
});
