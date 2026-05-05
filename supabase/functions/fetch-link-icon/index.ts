import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

type Detection = { icon: string; source: string };

async function detectIcon(targetUrl: string): Promise<Detection | null> {
  let u: URL;
  try {
    u = new URL(targetUrl);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(u.protocol)) return null;

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
    if (res.ok) {
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
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
