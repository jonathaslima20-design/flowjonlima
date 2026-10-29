// API de Conversões do Meta (CAPI): envio de eventos pelo servidor, deduplicados com o Pixel pelo event_id.
// Config em Admin → Rastreamento (get_meta_config, só service_role). Dados pessoais vão com hash SHA-256.

import type { SupabaseClient } from "npm:@supabase/supabase-js@2.58.0";

const GRAPH_VERSION = "v23.0";

export type MetaConfig = { pixelId: string; token: string; testEventCode: string };

export type MetaUser = {
  email?: string | null;
  phone?: string | null;
  externalId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
};

export type MetaEvent = {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string | null;
  user: MetaUser;
  customData?: Record<string, unknown>;
};

export async function loadMetaConfig(admin: SupabaseClient): Promise<MetaConfig | null> {
  const { data } = await admin.rpc("get_meta_config");
  const cfg = (data ?? {}) as Record<string, unknown>;
  const pixelId = String(cfg.pixel_id ?? "");
  const token = String(cfg.token ?? "");
  if (!cfg.enabled || !/^\d{6,20}$/.test(pixelId) || !token) return null;
  return { pixelId, token, testEventCode: String(cfg.test_event_code ?? "") };
}

async function sha256(value: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function userData(u: MetaUser) {
  const out: Record<string, unknown> = {};
  const email = u.email?.trim().toLowerCase();
  const phone = u.phone?.replace(/\D/g, "");
  if (email) out.em = [await sha256(email)];
  if (phone) out.ph = [await sha256(phone)];
  if (u.externalId) out.external_id = [await sha256(u.externalId)];
  if (u.ip) out.client_ip_address = u.ip;
  if (u.userAgent) out.client_user_agent = u.userAgent;
  if (u.fbp) out.fbp = u.fbp;
  if (u.fbc) out.fbc = u.fbc;
  return out;
}

// Envia um evento; devolve a resposta do Meta (ou o erro) sem lançar exceção.
// Com código de teste configurado, os eventos vão para "Eventos de teste" do Gerenciador (apague-o depois).
export async function sendMetaEvent(cfg: MetaConfig, ev: MetaEvent) {
  const body: Record<string, unknown> = {
    data: [{
      event_name: ev.eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: ev.eventId,
      action_source: "website",
      event_source_url: ev.eventSourceUrl || undefined,
      user_data: await userData(ev.user),
      custom_data: ev.customData && Object.keys(ev.customData).length ? ev.customData : undefined,
    }],
  };
  if (cfg.testEventCode) body.test_event_code = cfg.testEventCode;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${cfg.pixelId}/events?access_token=${encodeURIComponent(cfg.token)}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    );
    const json = await res.json().catch(() => null);
    if (!res.ok) console.error("meta capi error", res.status, json?.error?.message);
    return { ok: res.ok, status: res.status, body: json };
  } catch (e) {
    console.error("meta capi fetch failed", e);
    return { ok: false, status: 0, body: null };
  }
}

// IP e navegador de quem fez a requisição (para o contexto do evento)
export function requestContext(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0].trim() || req.headers.get("cf-connecting-ip") || null;
  return { ip, userAgent: req.headers.get("user-agent") };
}

// Contexto do Meta salvo no pagamento (só existe se o visitante aceitou cookies de marketing)
export function paymentMetaContext(req: Request, meta: unknown) {
  const m = (meta ?? {}) as Record<string, unknown>;
  if (m.consent !== true) return null;
  const clean = (v: unknown, max = 300) => (typeof v === "string" && v ? v.slice(0, max) : null);
  return { ...requestContext(req), fbp: clean(m.fbp), fbc: clean(m.fbc), url: clean(m.url, 500) };
}

// Purchase pelo servidor quando o pagamento é aprovado (event_id igual ao do navegador: purchase_<id>)
export async function sendPurchase(admin: SupabaseClient, paymentId: string) {
  const { data: pay } = await admin
    .from("payments")
    .select("id, profile_id, plan_slug, period, amount_cents, meta_context")
    .eq("id", paymentId)
    .maybeSingle();
  const ctx = pay?.meta_context as Record<string, string | null> | null;
  if (!pay || !ctx) return;
  const cfg = await loadMetaConfig(admin);
  if (!cfg) return;

  const [{ data: authUser }, { data: priv }] = await Promise.all([
    admin.auth.admin.getUserById(pay.profile_id),
    admin.from("profile_private").select("whatsapp").eq("profile_id", pay.profile_id).maybeSingle(),
  ]);

  await sendMetaEvent(cfg, {
    eventName: "Purchase",
    eventId: `purchase_${pay.id}`,
    eventSourceUrl: ctx.url,
    user: {
      email: authUser?.user?.email,
      phone: priv?.whatsapp,
      externalId: pay.profile_id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      fbp: ctx.fbp,
      fbc: ctx.fbc,
    },
    customData: {
      value: pay.amount_cents / 100,
      currency: "BRL",
      content_ids: [`${pay.plan_slug}_${pay.period}`],
      content_name: `BioFlowzy ${pay.plan_slug} ${pay.period}`,
      content_type: "product",
      num_items: 1,
    },
  });
}
