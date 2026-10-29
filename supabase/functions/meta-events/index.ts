import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";
import { loadMetaConfig, requestContext, sendMetaEvent } from "../_shared/meta.ts";

// Eventos do site BioFlowzy para a API de Conversões do Meta (usuário logado).
//   { action: "track", event_name, event_id, event_source_url, custom_data, fbp, fbc, consent: true }
//   { action: "test" }  (só admin) envia um PageView de teste e devolve a resposta do Meta
// O navegador manda o mesmo event_id para o Pixel, e o Meta descarta a duplicata.
// O Purchase não passa por aqui: sai do servidor quando o pagamento é aprovado (_shared/meta.ts).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ALLOWED_EVENTS = ["CompleteRegistration", "InitiateCheckout", "AddPaymentInfo", "Lead", "ViewContent"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function cleanCustomData(raw: unknown) {
  const c = (raw ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  if (typeof c.value === "number" && Number.isFinite(c.value) && c.value >= 0 && c.value < 100000) out.value = c.value;
  if (c.currency === "BRL") out.currency = "BRL";
  for (const key of ["content_name", "content_type", "content_category", "status", "payment_type"]) {
    if (typeof c[key] === "string") out[key] = (c[key] as string).slice(0, 100);
  }
  if (Array.isArray(c.content_ids)) out.content_ids = c.content_ids.filter((x) => typeof x === "string").slice(0, 5).map((x) => (x as string).slice(0, 60));
  if (typeof c.num_items === "number") out.num_items = Math.min(10, Math.max(1, Math.floor(c.num_items)));
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));
  const cfg = await loadMetaConfig(admin);

  if (body?.action === "test") {
    const { data: me } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (me?.role !== "admin") return json({ error: "forbidden" }, 403);
    if (!cfg) return json({ ok: false, error: "Ative o Pixel e salve o Pixel ID e o token da API de Conversões." });
    if (!cfg.testEventCode) return json({ ok: false, error: "Informe o código de teste (Gerenciador de Eventos → Eventos de teste)." });
    const ctx = requestContext(req);
    const res = await sendMetaEvent(cfg, {
      eventName: "PageView",
      eventId: `test_${crypto.randomUUID()}`,
      eventSourceUrl: "https://bioflowzy.com/",
      user: { email: user.email, externalId: user.id, ip: ctx.ip, userAgent: ctx.userAgent },
    });
    if (!res.ok) return json({ ok: false, error: res.body?.error?.message ?? `Erro ${res.status} no Meta.` });
    return json({ ok: true, received: res.body?.events_received ?? 0 });
  }

  if (body?.action !== "track") return json({ error: "Ação inválida." }, 400);
  // Sem consentimento de marketing, nada é enviado
  if (body.consent !== true || !cfg) return json({ ok: true, skipped: true });

  const eventName = String(body.event_name ?? "");
  const eventId = String(body.event_id ?? "").slice(0, 100);
  if (!ALLOWED_EVENTS.includes(eventName) || !eventId) return json({ error: "Evento inválido." }, 400);

  const { data: priv } = await admin.from("profile_private").select("whatsapp").eq("profile_id", user.id).maybeSingle();
  const ctx = requestContext(req);
  const clean = (v: unknown, max = 300) => (typeof v === "string" && v ? v.slice(0, max) : null);

  const res = await sendMetaEvent(cfg, {
    eventName,
    eventId,
    eventSourceUrl: clean(body.event_source_url, 500),
    user: {
      email: user.email,
      phone: priv?.whatsapp,
      externalId: user.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      fbp: clean(body.fbp),
      fbc: clean(body.fbc),
    },
    customData: cleanCustomData(body.custom_data),
  });
  return json({ ok: res.ok });
});
