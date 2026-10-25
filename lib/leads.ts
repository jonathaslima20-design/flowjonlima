// O botão do formulário de contato é um link comum (assim aparece em qualquer tema)
// com este endereço; a página pública intercepta o clique e abre o formulário.
// Precisa começar com https:// por causa da CHECK constraint de links.url.
export const LEAD_FORM_URL = 'https://bioflowzy.com/#contato';

export function isLeadFormUrl(url: string | null | undefined): boolean {
  return url === LEAD_FORM_URL;
}
