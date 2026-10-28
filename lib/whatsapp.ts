// WhatsApp da conta (cadastro, Configurações e Admin → Usuários). Guardado em profile_private.whatsapp
// só com dígitos e DDI; espelha public.normalize_whatsapp do banco.

export function normalizeWhatsapp(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (/^[1-9]\d{9,10}$/.test(d)) return '55' + d;
  if (/^[1-9]\d{11,14}$/.test(d)) return d;
  return '';
}

// Celular do Brasil com DDD: (11) 99999-8888 / (11) 9999-8888
export function maskWhatsapp(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// Mostra o número salvo (55 + DDD + número) no formato da máscara
export function formatWhatsapp(stored: string | null | undefined): string {
  if (!stored) return '';
  return stored.startsWith('55') && stored.length >= 12 ? maskWhatsapp(stored.slice(2)) : `+${stored}`;
}

export function whatsappLink(stored: string | null | undefined, text?: string): string | null {
  if (!stored) return null;
  return `https://wa.me/${stored}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
