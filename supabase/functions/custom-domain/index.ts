import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

// Domínio próprio: cadastra, verifica o DNS e adiciona/remove o domínio no site do Netlify.
// Body: { action: "set", domain } | { action: "verify" } | { action: "remove" }
// Secrets: NETLIFY_API_TOKEN e NETLIFY_SITE_ID (sem eles a verificação responde 503).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CNAME_TARGET = "cname.bioflowzy.com";
const NETLIFY_LB_IP = "75.2.60.5";
const TXT_PREFIX = "_bioflowzy";
const DOMAIN_RE = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
const VERIFY_COOLDOWN_MS = 10_000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeDomain(input: string) {
  return input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/[/?#].*$/, "").replace(/\.$/, "");
}

function isPlatformDomain(d: string) {
  return d === "bioflowzy.com" || d.endsWith(".bioflowzy.com") || d.endsWith(".netlify.app");
}

// DNS via HTTPS (Cloudflare): não depende do resolver do runtime e ignora caches locais
async function resolve(name: string, type: "TXT" | "CNAME" | "A"): Promise<string[]> {
  const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`, {
    headers: { Accept: "application/dns-json" },
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => null);
  const code = { TXT: 16, CNAME: 5, A: 1 }[type];
  return (data?.Answer ?? [])
    .filter((a: { type: number }) => a.type === code)
    .map((a: { data: string }) => a.data.replace(/^"|"$/g, "").replace(/"\s*"/g, "").replace(/\.$/, "").toLowerCase());
}

async function checkDns(domain: string, token: string): Promise<string | null> {
  const txt = await resolve(`${TXT_PREFIX}.${domain}`, "TXT");
  if (!txt.some((v) => v.includes(token))) {
    return `Não encontramos o registro TXT ${TXT_PREFIX} com o código de verificação. Se acabou de criar, aguarde alguns minutos.`;
  }

  const cnames = await resolve(domain, "CNAME");
  if (cnames.some((c) => c === CNAME_TARGET || c.endsWith(".netlify.app"))) return null;

  // Domínio raiz (registro A) ou CNAME flattening: aceita o IP do Netlify ou o mesmo IP do alvo
  const ips = await resolve(domain, "A");
  const accepted = new Set([NETLIFY_LB_IP, ...(await resolve(CNAME_TARGET, "A"))]);
  if (ips.some((ip) => accepted.has(ip))) return null;

  const found = [...cnames, ...ips].join(", ") || "nenhum registro";
  return `O domínio ainda não aponta para o BioFlowzy (encontrado: ${found}). Confira o registro CNAME/A.`;
}

type Netlify = { token: string; siteId: string };

async function netlifyAliases(nf: Netlify, change: (aliases: string[]) => string[]) {
  const base = `https://api.netlify.com/api/v1/sites/${nf.siteId}`;
  const headers = { Authorization: `Bearer ${nf.token}`, "Content-Type": "application/json" };
  const siteRes = await fetch(base, { headers });
  if (!siteRes.ok) throw new Error(`netlify get site ${siteRes.status}`);
  const site = await siteRes.json();
  const current: string[] = site.domain_aliases ?? [];
  const next = change(current);
  if (next.length === current.length && next.every((d) => current.includes(d))) return;
  const patch = await fetch(base, { method: "PATCH", headers, body: JSON.stringify({ domain_aliases: next }) });
  if (!patch.ok) throw new Error(`netlify patch site ${patch.status} ${await patch.text()}`);
}

// Pede ao Netlify para incluir o domínio novo no certificado HTTPS (melhor esforço)
async function provisionSsl(nf: Netlify) {
  await fetch(`https://api.netlify.com/api/v1/sites/${nf.siteId}/ssl`, {
    method: "POST",
    headers: { Authorization: `Bearer ${nf.token}` },
  }).catch(() => null);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const nfToken = Deno.env.get("NETLIFY_API_TOKEN");
  const nfSite = Deno.env.get("NETLIFY_SITE_ID");
  const nf: Netlify | null = nfToken && nfSite ? { token: nfToken, siteId: nfSite } : null;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "Faça login novamente." }, 401);

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? "");

  const { data: row } = await admin.from("custom_domains").select("*").eq("profile_id", user.id).maybeSingle();

  async function detachFromNetlify(domain: string) {
    if (!nf) throw new Error("netlify not configured");
    await netlifyAliases(nf, (aliases) => aliases.filter((d) => d !== domain));
  }

  if (action === "remove") {
    if (!row) return json({ ok: true });
    if (row.netlify_added) {
      try {
        await detachFromNetlify(row.domain);
      } catch (e) {
        console.error("netlify remove failed", e);
        return json({ error: "Não foi possível remover o domínio agora. Tente novamente em instantes." }, 502);
      }
    }
    await admin.from("custom_domains").delete().eq("profile_id", user.id);
    return json({ ok: true });
  }

  // Cadastrar e verificar exigem plano com domínio próprio e conta ativa
  const { data: profile } = await admin.from("profiles").select("suspended_at").eq("id", user.id).maybeSingle();
  if (!profile) return json({ error: "Perfil não encontrado." }, 404);
  if (profile.suspended_at) return json({ error: "Conta suspensa." }, 403);
  const { data: allowed } = await admin.rpc("plan_limit", { p_profile_id: user.id, p_key: "custom_domain" });
  if (allowed !== true) return json({ error: "Domínio próprio está disponível no plano Pro." }, 403);

  if (action === "set") {
    const domain = normalizeDomain(String(body?.domain ?? ""));
    if (!DOMAIN_RE.test(domain) || domain.length > 253 || isPlatformDomain(domain)) {
      return json({ error: "Domínio inválido. Use o formato links.seudominio.com ou seudominio.com.br." }, 400);
    }
    if (row?.domain === domain) return json({ domain: row });

    const { data: taken } = await admin.from("custom_domains").select("profile_id").eq("domain", domain).maybeSingle();
    if (taken) return json({ error: "Este domínio já está em uso por outra conta." }, 409);

    if (row?.netlify_added) {
      try {
        await detachFromNetlify(row.domain);
      } catch (e) {
        console.error("netlify detach failed", e);
        return json({ error: "Não foi possível trocar o domínio agora. Tente novamente em instantes." }, 502);
      }
    }
    await admin.from("custom_domains").delete().eq("profile_id", user.id);
    const { data: created, error } = await admin
      .from("custom_domains")
      .insert({ profile_id: user.id, domain })
      .select("*")
      .single();
    if (error) {
      console.error("insert domain failed", error);
      return json({ error: "Não foi possível salvar o domínio." }, 400);
    }
    return json({ domain: created });
  }

  if (action === "verify") {
    if (!row) return json({ error: "Nenhum domínio cadastrado." }, 404);
    if (row.last_checked_at && Date.now() - new Date(row.last_checked_at).getTime() < VERIFY_COOLDOWN_MS) {
      return json({ error: "Aguarde alguns segundos antes de verificar de novo." }, 429);
    }
    const now = new Date().toISOString();

    const dnsError = await checkDns(row.domain, row.verification_token);
    if (dnsError) {
      const { data: failed } = await admin.from("custom_domains")
        .update({ status: "failed", verified: false, error_message: dnsError, last_checked_at: now })
        .eq("profile_id", user.id).select("*").single();
      return json({ error: dnsError, domain: failed }, 400);
    }

    if (!nf) {
      await admin.from("custom_domains").update({ last_checked_at: now }).eq("profile_id", user.id);
      return json({ error: "DNS correto! A ativação de domínios ainda não foi liberada pela equipe. Tente novamente mais tarde." }, 503);
    }

    try {
      await netlifyAliases(nf, (aliases) => (aliases.includes(row.domain) ? aliases : [...aliases, row.domain]));
    } catch (e) {
      console.error("netlify add failed", e);
      await admin.from("custom_domains").update({ last_checked_at: now }).eq("profile_id", user.id);
      return json({ error: "DNS correto, mas não conseguimos ativar o domínio agora. Tente novamente em instantes." }, 502);
    }
    await provisionSsl(nf);

    const { data: verified } = await admin.from("custom_domains")
      .update({ status: "verified", verified: true, verified_at: now, last_checked_at: now, error_message: null, netlify_added: true })
      .eq("profile_id", user.id).select("*").single();
    return json({ ok: true, domain: verified });
  }

  return json({ error: "Ação inválida." }, 400);
});
