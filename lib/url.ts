const SAFE_SCHEME = /^(https?:\/\/|mailto:|tel:)/i;
const ANY_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const DANGEROUS_SCHEME = /^(javascript|data|vbscript|file):/i;

// Espelha as CHECK constraints de links/banners: aceita http(s), mailto e tel;
// sem esquema, assume https. Retorna null para esquemas não permitidos.
export function toSafeUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (SAFE_SCHEME.test(v)) return v;
  if (ANY_SCHEME.test(v)) return null;
  return `https://${v}`;
}

// Espelha a constraint de social_links, que aceita texto livre (ex.: localização)
export function isDangerousUrl(raw: string): boolean {
  return DANGEROUS_SCHEME.test(raw.replace(/[\s\u0000-\u001f]/g, ''));
}
