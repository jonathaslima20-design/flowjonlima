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
const TXT_HOST_PREFIX = '_bioflowzy';

export function CustomDomainSection() {
  const [row, setRow] = useState<DomainRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { void load(); }, []);

  async function authHeader(): Promise<Record<string, string>> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
  }

  async function load() {
    setLoading(true);
    const headers = await authHeader();
    const res = await fetch('/api/domains', { headers });
    const json = await res.json();
    setRow(json.domain ?? null);
    setInput('');
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const headers = { 'Content-Type': 'application/json', ...(await authHeader()) };
    const res = await fetch('/api/domains', { method: 'POST', headers, body: JSON.stringify({ domain: input }) });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error || 'Falha ao salvar.'); return; }
    setRow(json.domain);
  }

  async function verify() {
    setVerifying(true);
    setError(null);
    const headers = await authHeader();
    const res = await fetch('/api/domains/verify', { method: 'POST', headers });
    const json = await res.json();
    setVerifying(false);
    if (!res.ok) {
      setError(json.error || 'Falha na verificacao.');
      await load();
      return;
    }
    setRow(json.domain);
  }

  async function remove() {
    if (!confirm('Remover o dominio personalizado? Seu perfil voltara a responder apenas pelo subdominio Bioflowzy.')) return;
    const headers = await authHeader();
    await fetch('/api/domains', { method: 'DELETE', headers });
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
          <label className="block text-xs font-bold uppercase tracking-wide mb-2">Seu dominio</label>
          <div className="flex gap-2 flex-wrap">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="links.seudominio.com"
              className="brutal-input px-3 py-2 flex-1 min-w-[220px]"
            />
            <button
              onClick={save}
              disabled={saving || !input}
              className="brutal-btn bg-bioyellow px-4 py-2 text-sm disabled:opacity-60"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
          <p className="text-[11px] text-black/60 mt-2">
            Prefira um subdominio como <code>links.seudominio.com</code> — e mais simples de configurar via CNAME.
          </p>
          {error && <p className="text-xs font-bold text-red-600 mt-2">{error}</p>}
        </div>
        <DomainGuide />
      </div>
    );
  }

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
          <button onClick={remove} className="brutal-btn bg-white px-3 py-2 text-xs gap-2">
            <Trash2 className="w-3 h-3" /> Remover
          </button>
        </div>
      </div>

      {row.error_message && row.status === 'failed' && (
        <div className="brutal-border p-3 bg-red-50 flex gap-2 items-start">
          <AlertTriangle className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />
          <p className="text-xs text-red-800">{row.error_message}</p>
        </div>
      )}

      {!row.verified && (
        <>
          <div className="brutal-border p-4 bg-neutral-50 flex flex-col gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-1">Passo 1 — Registro TXT (comprova que o dominio e seu)</p>
              <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-2 items-center text-xs">
                <span className="font-bold">Tipo</span><code className="bg-white px-2 py-1 brutal-border">TXT</code><span />
                <span className="font-bold">Host</span>
                <code className="bg-white px-2 py-1 brutal-border break-all">{TXT_HOST_PREFIX}</code>
                <button onClick={() => copy(TXT_HOST_PREFIX, 'txt-host')} className="brutal-btn bg-white px-2 py-1 text-[10px] gap-1">
                  {copied === 'txt-host' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copiar
                </button>
                <span className="font-bold">Valor</span>
                <code className="bg-white px-2 py-1 brutal-border break-all">{row.verification_token}</code>
                <button onClick={() => copy(row.verification_token, 'txt-value')} className="brutal-btn bg-white px-2 py-1 text-[10px] gap-1">
                  {copied === 'txt-value' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copiar
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-1">Passo 2 — Registro CNAME (direciona o dominio)</p>
              <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-2 items-center text-xs">
                <span className="font-bold">Tipo</span><code className="bg-white px-2 py-1 brutal-border">CNAME</code><span />
                <span className="font-bold">Host</span>
                <code className="bg-white px-2 py-1 brutal-border break-all">{subHost(row.domain)}</code>
                <span />
                <span className="font-bold">Valor</span>
                <code className="bg-white px-2 py-1 brutal-border break-all">{CNAME_TARGET}</code>
                <button onClick={() => copy(CNAME_TARGET, 'cname-value')} className="brutal-btn bg-white px-2 py-1 text-[10px] gap-1">
                  {copied === 'cname-value' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copiar
                </button>
              </div>
              <p className="text-[11px] text-black/60 mt-2">
                Usando dominio raiz ({'"'}@{'"'})? Alguns provedores precisam de ALIAS/ANAME no lugar de CNAME.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-1">Passo 3 — Verificar</p>
              <p className="text-[11px] text-black/70 mb-2">
                A propagacao do DNS geralmente leva poucos minutos, podendo demorar ate 24h.
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
            <p className="text-sm font-bold text-green-900">Dominio verificado e ativo</p>
            <p className="text-xs text-green-900/80">
              Seu perfil responde em <strong>{row.domain}</strong>. Pode levar alguns minutos para o HTTPS ficar disponivel no primeiro acesso.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function subHost(domain: string) {
  const parts = domain.split('.');
  if (parts.length <= 2) return '@';
  return parts.slice(0, parts.length - 2).join('.');
}

function StatusBadge({ status }: { status: DomainRow['status'] }) {
  if (status === 'verified') {
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-green-500 text-white px-2 py-1 rounded">Verificado</span>;
  }
  if (status === 'failed') {
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-red-500 text-white px-2 py-1 rounded">Falhou</span>;
  }
  return <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-neutral-800 text-white px-2 py-1 rounded">Pendente</span>;
}

function DomainGuide() {
  return (
    <div className="brutal-border p-4 bg-white">
      <p className="text-xs font-bold mb-2">Como configurar no seu provedor</p>
      <ul className="text-xs text-black/70 list-disc ml-4 space-y-1">
        <li><strong>Subdominio recomendado:</strong> crie apenas um CNAME. E o caminho mais rapido e compativel.</li>
        <li><strong>Dominio raiz (sem www):</strong> se seu provedor suportar ALIAS/ANAME ou CNAME flattening (Cloudflare, Registro.br), aponte para <code>cname.bioflowzy.com</code>.</li>
        <li><strong>Remova registros conflitantes</strong> (A, AAAA) no host que voce esta configurando.</li>
        <li><strong>HTTPS</strong> e provisionado automaticamente apos a verificacao.</li>
      </ul>
    </div>
  );
}
