import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.58.0";

// Relatório mensal por e-mail (Business), enviado pelo Resend.
// Body: { mode: "cron", token } (pg_cron, dias 1 e 2 de cada mês) | { mode: "test" } (usuário logado, para si mesmo)
// Secrets: RESEND_API_KEY (obrigatório), REPORT_FROM (ex.: "BioFlowzy <relatorios@bioflowzy.com>"), SITE_URL.
// Deploy com verify_jwt = false: o cron não tem JWT; o modo "test" confere o usuário aqui.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BATCH_SIZE = 40;
const TEST_COOLDOWN_MS = 10 * 60 * 1000;

type Page = {
  username: string;
  display_name: string | null;
  views: number;
  prev_views: number;
  clicks: number;
  prev_clicks: number;
  leads: number;
  top_links: { title: string; clicks: number }[];
  top_sources: { name: string; count: number }[];
};
type Recipient = { profile_id: string; email: string; display_name: string | null; username: string };

const SOURCE_LABELS: Record<string, string> = {
  direto: "Direto", instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", youtube: "YouTube",
  x: "X (Twitter)", linkedin: "LinkedIn", threads: "Threads", whatsapp: "WhatsApp", telegram: "Telegram",
  pinterest: "Pinterest", google: "Google", bing: "Bing", qrcode: "QR code",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// Primeiro dia do mês anterior, no horário de Brasília (AAAA-MM-01)
function previousMonth(): string {
  const now = new Date(Date.now() - 3 * 3600 * 1000);
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return d.toISOString().slice(0, 10);
}

function monthLabel(period: string) {
  const [y, m] = period.split("-").map(Number);
  const name = new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("pt-BR", { month: "long", timeZone: "UTC" });
  return `${name} de ${y}`;
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function trend(cur: number, prev: number) {
  if (!prev) return cur ? '<span style="color:#15803d">novo</span>' : "";
  const pct = Math.round(((cur - prev) / prev) * 100);
  if (pct === 0) return '<span style="color:#666">estável</span>';
  return pct > 0 ? `<span style="color:#15803d">▲ ${pct}%</span>` : `<span style="color:#b91c1c">▼ ${Math.abs(pct)}%</span>`;
}

function stat(label: string, value: number, extra = "") {
  return `<td style="padding:10px;border:2px solid #000;background:#fff;text-align:center;width:33%">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#555">${label}</div>
    <div style="font-size:26px;font-weight:800;margin:4px 0">${value.toLocaleString("pt-BR")}</div>
    <div style="font-size:12px">${extra}</div></td>`;
}

function renderPage(p: Page, siteUrl: string) {
  const ctr = p.views ? Math.round((p.clicks / p.views) * 1000) / 10 : 0;
  const links = p.top_links.length
    ? p.top_links.map((l) => `<li>${esc(l.title)}: <b>${l.clicks}</b> clique${l.clicks === 1 ? "" : "s"}</li>`).join("")
    : "<li>Nenhum clique em links no mês.</li>";
  const sources = p.top_sources.length
    ? p.top_sources.map((s) => `${esc(SOURCE_LABELS[s.name] ?? s.name)} (${s.count})`).join(" · ")
    : "Sem visitas no mês.";
  return `
  <div style="margin:0 0 24px">
    <h2 style="font-size:18px;margin:0 0 8px">${esc(p.display_name || p.username)}
      <a href="${siteUrl}/${encodeURIComponent(p.username)}" style="font-size:12px;color:#2563eb;font-weight:400">${siteUrl.replace(/^https?:\/\//, "")}/${esc(p.username)}</a></h2>
    <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:separate;border-spacing:6px 0">
      <tr>${stat("Visitas", p.views, trend(p.views, p.prev_views))}${stat("Cliques", p.clicks, trend(p.clicks, p.prev_clicks))}${stat("Contatos", p.leads, `taxa de cliques ${ctr.toLocaleString("pt-BR")}%`)}</tr>
    </table>
    <p style="font-size:13px;margin:12px 0 4px"><b>Links mais clicados</b></p>
    <ul style="font-size:13px;margin:0;padding-left:18px">${links}</ul>
    <p style="font-size:13px;margin:12px 0 0"><b>De onde vieram as visitas:</b> ${sources}</p>
  </div>`;
}

function renderEmail(name: string, period: string, pages: Page[], siteUrl: string, test: boolean) {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f0;font-family:Arial,Helvetica,sans-serif;color:#111">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:#facc15;border:2px solid #000;padding:16px 20px;margin-bottom:20px">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase">${test ? "Teste · " : ""}Relatório mensal BioFlowzy</div>
      <div style="font-size:22px;font-weight:800;margin-top:4px">Seu resumo de ${monthLabel(period)}</div>
    </div>
    <p style="font-size:14px">Olá, ${esc(name)}! Veja como suas páginas foram no mês passado (comparação com o mês anterior).</p>
    ${pages.map((p) => renderPage(p, siteUrl)).join("")}
    <p style="text-align:center;margin:28px 0">
      <a href="${siteUrl}/dashboard/analytics" style="background:#000;color:#fff;padding:12px 20px;text-decoration:none;font-weight:700;border:2px solid #000">Ver analytics completo</a>
    </p>
    <p style="font-size:11px;color:#666;text-align:center">Você recebe este e-mail por ter o plano Business. Para parar de receber, desligue o relatório em Configurações no painel.</p>
  </div></body></html>`;
}

async function sendReport(admin: SupabaseClient, r: Recipient, period: string, test: boolean) {
  const apiKey = Deno.env.get("RESEND_API_KEY")!;
  const from = Deno.env.get("REPORT_FROM") || "BioFlowzy <relatorios@bioflowzy.com>";
  const siteUrl = (Deno.env.get("SITE_URL") || "https://bioflowzy.com").replace(/\/$/, "");

  const { data, error } = await admin.rpc("monthly_report_data", { p_account: r.profile_id, p_period: period });
  if (error) throw new Error(`dados: ${error.message}`);
  const pages = (data ?? []) as Page[];

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [r.email],
      subject: `${test ? "[Teste] " : ""}Seu relatório BioFlowzy de ${monthLabel(period)}`,
      html: renderEmail(r.display_name || r.username, period, pages, siteUrl, test),
    }),
  });
  if (!res.ok) throw new Error(`resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

async function runBatch(admin: SupabaseClient, period: string) {
  const { data, error } = await admin.rpc("monthly_report_recipients", { p_period: period, p_limit: BATCH_SIZE });
  if (error) { console.error("recipients failed", error); return; }
  for (const r of (data ?? []) as Recipient[]) {
    try {
      await sendReport(admin, r, period, false);
      await admin.from("monthly_report_log").insert({ profile_id: r.profile_id, period_start: period, status: "sent" });
    } catch (e) {
      console.error("report failed", r.profile_id, e);
      await admin.from("monthly_report_log").insert({ profile_id: r.profile_id, period_start: period, status: "error", error: String(e).slice(0, 500) });
    }
    // Plano grátis do Resend aceita 2 envios por segundo
    await new Promise((ok) => setTimeout(ok, 600));
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const body = await req.json().catch(() => ({}));

  if (body?.mode === "cron") {
    const { data: ok } = await admin.rpc("verify_report_cron_token", { p_token: String(body?.token ?? "") });
    if (ok !== true) return json({ error: "unauthorized" }, 401);
    if (!Deno.env.get("RESEND_API_KEY")) {
      console.warn("monthly-report: RESEND_API_KEY ausente, nada enviado");
      return json({ skipped: "not configured" }, 503);
    }
    // Responde logo ao pg_cron e envia em segundo plano
    EdgeRuntime.waitUntil(runBatch(admin, previousMonth()));
    return json({ ok: true }, 202);
  }

  if (body?.mode === "test") {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user?.email) return json({ error: "Faça login novamente." }, 401);
    if (!Deno.env.get("RESEND_API_KEY")) {
      return json({ error: "O envio de e-mails ainda não foi configurado." }, 503);
    }

    const { data: profile } = await admin.from("profiles")
      .select("id, username, display_name, owner_id, suspended_at").eq("id", user.id).maybeSingle();
    if (!profile || profile.owner_id || profile.suspended_at) return json({ error: "Conta indisponível." }, 403);
    const { data: allowed } = await admin.rpc("plan_limit", { p_profile_id: user.id, p_key: "monthly_report" });
    if (allowed !== true) return json({ error: "O relatório mensal faz parte do plano Business." }, 403);

    const { data: last } = await admin.from("monthly_report_log").select("created_at")
      .eq("profile_id", user.id).eq("status", "test").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (last && Date.now() - new Date(last.created_at).getTime() < TEST_COOLDOWN_MS) {
      return json({ error: "Você já pediu um teste há pouco. Tente de novo em alguns minutos." }, 429);
    }

    const period = previousMonth();
    try {
      await sendReport(admin, { profile_id: user.id, email: user.email, display_name: profile.display_name, username: profile.username }, period, true);
    } catch (e) {
      console.error("test report failed", e);
      return json({ error: "Não foi possível enviar o e-mail agora." }, 502);
    }
    await admin.from("monthly_report_log").insert({ profile_id: user.id, period_start: period, status: "test" });
    return json({ ok: true, email: user.email });
  }

  return json({ error: "invalid mode" }, 400);
});
