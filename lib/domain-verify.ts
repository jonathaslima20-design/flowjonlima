import { promises as dns } from 'dns';

export const CNAME_TARGET = 'cname.bioflowzy.com';
export const TXT_PREFIX = '_bioflowzy';

const RESERVED = ['bioflowzy.com', 'www.bioflowzy.com', 'netlify.app', 'bioflowzy.netlify.app'];
const DOMAIN_RE = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

export function normalizeDomain(input: string): string {
  return input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
}

export function isValidDomain(d: string): boolean {
  if (!DOMAIN_RE.test(d)) return false;
  if (RESERVED.includes(d)) return false;
  if (d.endsWith('.bioflowzy.com') || d.endsWith('.netlify.app')) return false;
  return true;
}

export async function verifyTxt(domain: string, token: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const records = await dns.resolveTxt(`${TXT_PREFIX}.${domain}`);
    const flat = records.map((r) => r.join(''));
    if (flat.some((v) => v.includes(token))) return { ok: true };
    return { ok: false, error: `Registro TXT em _bioflowzy.${domain} nao contem o token esperado.` };
  } catch (e: any) {
    return { ok: false, error: `Nao foi possivel encontrar o registro TXT em _bioflowzy.${domain}.` };
  }
}

export async function verifyCname(domain: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const records = await dns.resolveCname(domain);
    if (records.some((r) => r.toLowerCase().replace(/\.$/, '') === CNAME_TARGET)) return { ok: true };
    return { ok: false, error: `O CNAME de ${domain} nao aponta para ${CNAME_TARGET}. Encontrado: ${records.join(', ') || 'nenhum'}.` };
  } catch {
    return { ok: false, error: `Nao foi possivel ler o CNAME de ${domain}. Verifique se o registro foi adicionado.` };
  }
}
