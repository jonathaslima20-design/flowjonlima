import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

// Exige usuário logado: sem isso a função vira um proxy aberto para buscar qualquer URL.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function abs(base: string, path: string): string {
  try {
    return new URL(path, base).toString();
  } catch {
    return "";
  }
}

function pickMeta(html: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return null;
}

function s2Fallback(hostname: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`;
}

// Bloqueia destinos internos/privados (localhost, IPs privados, metadata de cloud)
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (!h.includes(".") && !h.includes(":")) return true;
  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  if (h.includes(":")) {
    return h === "::1" || h === "::" || h.startsWith("fc") || h.startsWith("fd") ||
      h.startsWith("fe80") || h.startsWith("::ffff:");
  }
  return false;
}

type Detection = { icon: string; source: string };

async function detectIcon(targetUrl: string): Promise<Detection | null> {
  let u: URL;
  try {
    u = new URL(targetUrl);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(u.protocol) || isBlockedHost(u.hostname)) return null;

  const browserHeaders: Record<string, string> = {
    "User-Agent": BROWSER_UA,
    "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  };

  let html = "";
  let finalUrl = u.toString();
  try {
    const res = await fetch(u.toString(), {
      headers: browserHeaders,
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    finalUrl = res.url || finalUrl;
    // Um redirect para destino interno não deve ter o conteúdo lido
    if (res.ok && !isBlockedHost(new URL(finalUrl).hostname)) {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("text/html") || ct.includes("xml") || ct === "") {
        html = (await res.text()).slice(0, 300_000);
      }
    }
  } catch {
    // continue to fallbacks
  }

  if (html) {
    const og = pickMeta(html, [
      /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
    ]);
    if (og) {
      const resolved = abs(finalUrl, og);
      if (resolved) return { icon: resolved, source: "og" };
    }

    const tw = pickMeta(html, [
      /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
    ]);
    if (tw) {
      const resolved = abs(finalUrl, tw);
      if (resolved) return { icon: resolved, source: "twitter" };
    }

    const apple = pickMeta(html, [
      /<link[^>]+rel=["'](?:apple-touch-icon|apple-touch-icon-precomposed)[^"']*["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:apple-touch-icon|apple-touch-icon-precomposed)[^"']*["']/i,
    ]);
    if (apple) {
      const resolved = abs(finalUrl, apple);
      if (resolved) return { icon: resolved, source: "apple" };
    }

    const icon = pickMeta(html, [
      /<link[^>]+rel=["'](?:shortcut icon|icon|mask-icon|fluid-icon)["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut icon|icon|mask-icon|fluid-icon)["']/i,
    ]);
    if (icon) {
      const resolved = abs(finalUrl, icon);
      if (resolved) return { icon: resolved, source: "icon" };
    }
  }

  const favicon = `${u.origin}/favicon.ico`;
  try {
    const headRes = await fetch(favicon, {
      method: "HEAD",
      headers: { "User-Agent": BROWSER_UA },
      signal: AbortSignal.timeout(4000),
    });
    if (headRes.ok) return { icon: favicon, source: "favicon" };
  } catch {
    // fallthrough
  }

  return { icon: s2Fallback(u.hostname), source: "s2" };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    let url = "";
    if (req.method === "GET") {
      const u = new URL(req.url);
      url = u.searchParams.get("url") || "";
    } else {
      const body = await req.json().catch(() => ({}));
      url = body?.url || "";
    }
    if (!url) {
      return new Response(JSON.stringify({ error: "missing url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await detectIcon(url);
    if (!result) {
      return new Response(
        JSON.stringify({ icon: null, source: null, error: "invalid url" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
