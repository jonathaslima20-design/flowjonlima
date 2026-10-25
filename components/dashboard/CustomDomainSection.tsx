'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Copy, Check, Globe, Loader as Loader2, ExternalLink, Trash2, ShieldCheck, TriangleAlert as AlertTriangle } from 'lucide-react';

type DomainRow = {
  id: string;
  domain: string;
  verification_token: string;
  status: 'pending' | 'verified' | 'failed';
  verified: boolean;
  verified_at: string | null;
  last_checked_at: string | null;
  error_message: string | null;
};

const CNAME_TARGET = 'cname.bioflowzy.com';
const A_TARGET = '75.2.60.5';
const TXT_PREFIX = '_bioflowzy';
// Sufixos de dois níveis mais comuns, para separar o "host" do domínio registrado
const TWO_LEVEL_SUFFIXES = ['com.br', 'net.br', 'org.br', 'art.br', 'adv.br', 'eng.br', 'med.br', 'blog.br', 'app.br', 'dev.br', 'eco.br', 'tv.br', 'co.uk', 'com.pt', 'com.ar', 'com.mx'];

// Escritas passam pela edge function custom-domain (verifica DNS e cadastra no Netlify)
async function callDomainFunction(body: Record<string, unknown>): Promise<{ ok: boolean; data: any; error?: string }> {
  const { data, error } = await supabase.functions.invoke('custom-domain', { body });
  if (!error) return { ok: true, data };
  const response: Response | undefined = (error as any)?.context;
  let parsed: any = null;
  try { parsed = await response?.json(); } catch {}
  return { ok: false, data: parsed, error: parsed?.error || 'Não foi possível concluir. Tente novamente.' };
}

export function CustomDomainSection() {
  const [row, setRow] = useState<DomainRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from('custom_domains').select('*').eq('profile_id', u.user.id).maybeSingle();
      setRow((data as DomainRow | null) ?? null);
      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await callDomainFunction({ action: 'set', domain: input });
    setSaving(false);
    if (!res.ok) { setError(res.error!); return; }
    setRow(res.data.domain);
    setInput('');
  }

  async function verify() {
    setVerifying(true);
    setError(null);
    const res = await callDomainFunction({ action: 'verify' });
    setVerifying(false);
    if (res.data?.domain) setRow(res.data.domain);
    if (!res.ok) setError(res.error!);
  }

  async function remove() {
    if (!confirm('Remover o domínio personalizado? Sua página continuará disponível em bioflowzy.com.')) return;
    setRemoving(true);
    setError(null);
    const res = await callDomainFunction({ action: 'remove' });
    setRemoving(false);
    if (!res.ok) { setError(res.error!); return; }
    setRow(null);
  }

  function copy(value: string, key: string) {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  if (loading) return <div className="text-sm text-black/60">Carregando...</div>;

  if (!row) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-2">Seu domínio</label>
          <div className="flex gap-2 flex-wrap">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="links.seudominio.com"
              className="brutal-input px-3 py-2 flex-1 min-w-[220px]"
            />
            <button
              onClick={save}
              disabled={saving || !input.trim()}
              className="brutal-btn bg-bioyellow px-4 py-2 text-sm disabled:opacity-60"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
          <p className="text-[11px] text-black/60 mt-2">
            Prefira um subdomínio como <code>links.seudominio.com</code>: basta um registro CNAME.
          </p>
          {error && <p className="text-xs font-bold text-red-600 mt-2">{error}</p>}
        </div>
        <DomainGuide />
      </div>
    );
  }

  const host = subHost(row.domain);
  const isApex = host === '@';
  const txtHost = isApex ? TXT_PREFIX : `${TXT_PREFIX}.${host}`;
  const routeType = isApex ? 'A' : 'CNAME';
  const routeValue = isApex ? A_TARGET : CNAME_TARGET;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5" />
          <div>
            <p className="font-bold text-lg break-all">{row.domain}</p>
            <StatusBadge status={row.status} />
          </div>
        </div>
        <div className="flex gap-2">
          {row.verified && (
            <a
              href={`https://${row.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="brutal-btn bg-white px-3 py-2 text-xs gap-2"
            >
              <ExternalLink className="w-3 h-3" /> Visitar
            </a>
          )}
          <button onClick={remove} disabled={removing} className="brutal-btn bg-white px-3 py-2 text-xs gap-2 disabled:opacity-60">
            <Trash2 className="w-3 h-3" /> {removing ? 'Removendo...' : 'Remover'}
          </button>
        </div>
      </div>

      {row.error_message && row.status === 'failed' && !error && (
        <div className="brutal-border p-3 bg-red-50 flex gap-2 items-start">
          <AlertTriangle className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />
          <p className="text-xs text-red-800">{row.error_message}</p>
        </div>
      )}

      {!row.verified && (
        <>
          <div className="brutal-border p-4 bg-neutral-50 flex flex-col gap-4">
            <p className="text-xs text-black/70">
              No painel onde você comprou o domínio (Registro.br, Hostinger, GoDaddy, Cloudflare...), crie os dois registros abaixo:
            </p>
            <DnsRecord
              title="Passo 1 — Registro TXT (comprova que o domínio é seu)"
              type="TXT" host={txtHost} value={row.verification_token}
              copied={copied} onCopy={copy} id="txt"
            />
            <DnsRecord
              title={`Passo 2 — Registro ${routeType} (direciona o domínio para sua página)`}
              type={routeType} host={host} value={routeValue}
              copied={copied} onCopy={copy} id="route"
            />
            {isApex && (
              <p className="text-[11px] text-black/60 -mt-2">
                Apague outros registros A/AAAA em <code>@</code>. Se o provedor aceitar ALIAS/ANAME, pode apontar para <code>{CNAME_TARGET}</code>.
              </p>
            )}

            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-1">Passo 3 — Verificar</p>
              <p className="text-[11px] text-black/70 mb-2">
                O DNS costuma propagar em poucos minutos, mas pode levar até 24h.
              </p>
              <button
                onClick={verify}
                disabled={verifying}
                className="brutal-btn bg-black text-white px-4 py-2 text-xs gap-2 disabled:opacity-60"
              >
                {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                {verifying ? 'Verificando...' : 'Verificar agora'}
              </button>
              {error && <p className="text-xs font-bold text-red-600 mt-2">{error}</p>}
            </div>
          </div>
          <DomainGuide />
        </>
      )}

      {row.verified && (
        <div className="brutal-border p-4 bg-green-50 flex gap-2 items-start">
          <ShieldCheck className="w-4 h-4 mt-0.5 text-green-700 shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-900">Domínio verificado e ativo</p>
            <p className="text-xs text-green-900/80">
              Sua página responde em <strong>{row.domain}</strong>. O HTTPS pode levar alguns minutos para ficar pronto no primeiro acesso.
            </p>
          </div>
        </div>
      )}
      {row.verified && error && <p className="text-xs font-bold text-red-600">{error}</p>}
    </div>
  );
}

function DnsRecord({ title, type, host, value, copied, onCopy, id }: {
  title: string; type: string; host: string; value: string; id: string;
  copied: string | null; onCopy: (value: string, key: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide mb-1">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-2 items-center text-xs">
        <span className="font-bold">Tipo</span><code className="bg-white px-2 py-1 brutal-border">{type}</code><span />
        <span className="font-bold">Nome / Host</span>
        <code className="bg-white px-2 py-1 brutal-border break-all">{host}</code>
        <CopyButton value={host} k={`${id}-host`} copied={copied} onCopy={onCopy} />
        <span className="font-bold">Valor</span>
        <code className="bg-white px-2 py-1 brutal-border break-all">{value}</code>
        <CopyButton value={value} k={`${id}-value`} copied={copied} onCopy={onCopy} />
      </div>
    </div>
  );
}

function CopyButton({ value, k, copied, onCopy }: { value: string; k: string; copied: string | null; onCopy: (value: string, key: string) => void }) {
  return (
    <button onClick={() => onCopy(value, k)} className="brutal-btn bg-white px-2 py-1 text-[10px] gap-1">
      {copied === k ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copiar
    </button>
  );
}

function subHost(domain: string) {
  const parts = domain.split('.');
  const suffix = TWO_LEVEL_SUFFIXES.find((s) => domain.endsWith(`.${s}`));
  const registered = suffix ? suffix.split('.').length + 1 : 2;
  if (parts.length <= registered) return '@';
  return parts.slice(0, parts.length - registered).join('.');
}

function StatusBadge({ status }: { status: DomainRow['status'] }) {
  if (status === 'verified') {
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-green-500 text-white px-2 py-1 rounded">Verificado</span>;
  }
  if (status === 'failed') {
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-red-500 text-white px-2 py-1 rounded">Não verificado</span>;
  }
  return <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-neutral-800 text-white px-2 py-1 rounded">Pendente</span>;
}

function DomainGuide() {
  return (
    <div className="brutal-border p-4 bg-white">
      <p className="text-xs font-bold mb-2">Dicas</p>
      <ul className="text-xs text-black/70 list-disc ml-4 space-y-1">
        <li><strong>Subdomínio (recomendado):</strong> ex. <code>links.seudominio.com</code>, configurado com um CNAME para <code>{CNAME_TARGET}</code>.</li>
        <li><strong>Domínio raiz</strong> (<code>seudominio.com.br</code>): registro A apontando para <code>{A_TARGET}</code>.</li>
        <li><strong>Remova registros conflitantes</strong> no mesmo nome (outros CNAME, A ou AAAA).</li>
        <li><strong>HTTPS</strong> é ativado automaticamente depois da verificação.</li>
      </ul>
    </div>
  );
}
