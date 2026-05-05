import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

async function detectIcon(targetUrl: string): Promise<string | null> {
  let u: URL;
  try {
    u = new URL(targetUrl);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(u.protocol)) return null;

  let html = "";
  try {
    const res = await fetch(u.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BioflowzyBot/1.0; +https://bioflowzy.com)",
        "Accept": "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("text/html") || ct.includes("xml")) {
        html = (await res.text()).slice(0, 200_000);
      }
    }
  } catch {
    // swallow
  }

  const baseUrl = u.toString();

  if (html) {
    const og = pickMeta(html, [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    ]);
    if (og) {
      const resolved = abs(baseUrl, og);
      if (resolved) return resolved;
    }

    const tw = pickMeta(html, [
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    ]);
    if (tw) {
      const resolved = abs(baseUrl, tw);
      if (resolved) return resolved;
    }

    const apple = pickMeta(html, [
      /<link[^>]+rel=["']apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon[^"']*["']/i,
    ]);
    if (apple) {
      const resolved = abs(baseUrl, apple);
      if (resolved) return resolved;
    }

    const icon = pickMeta(html, [
      /<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut icon|icon)["']/i,
    ]);
    if (icon) {
      const resolved = abs(baseUrl, icon);
      if (resolved) return resolved;
    }
  }

  const favicon = `${u.origin}/favicon.ico`;
  try {
    const headRes = await fetch(favicon, { method: "HEAD", signal: AbortSignal.timeout(3000) });
    if (headRes.ok) return favicon;
  } catch {
    // fallthrough
  }

  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(u.hostname)}&sz=128`;
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

    const icon = await detectIcon(url);
    return new Response(JSON.stringify({ icon }), {
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
