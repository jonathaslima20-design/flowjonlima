// Texto relativo do último acesso (Admin → Usuários): "agora", "há 5 min", "há 3 h", "ontem", "há 4 dias"...
export function lastSeenLabel(v: string | null | undefined): string {
  if (!v) return 'nunca';
  const mins = Math.floor((Date.now() - new Date(v).getTime()) / 60000);
  if (mins < 5) return 'agora';
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days} dias`;
  if (days < 365) return `há ${Math.floor(days / 30)} ${days < 60 ? 'mês' : 'meses'}`;
  const years = Math.floor(days / 365);
  return `há ${years} ${years === 1 ? 'ano' : 'anos'}`;
}
