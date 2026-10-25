// Destino após login/cadastro vindo de ?next= (só caminhos internos, ex.: /convite/abc)
export function getNextPath(): string | null {
  if (typeof window === 'undefined') return null;
  const next = new URLSearchParams(window.location.search).get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
}
