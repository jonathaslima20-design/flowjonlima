'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, Copy, Eye, EyeOff, KeyRound, PlugZap, Trash2 } from 'lucide-react';

// Chaves do Mercado Pago guardadas no Vault do Supabase. O valor nunca volta para o navegador:
// a tela só mostra se a chave existe e os últimos caracteres.

type SecretName = 'mp_access_token' | 'mp_public_key' | 'mp_webhook_secret';
type Status = { name: SecretName; is_set: boolean; hint: string | null; updated_at: string | null };

const FIELDS: { name: SecretName; label: string; placeholder: string; help: string }[] = [
  {
    name: 'mp_access_token',
    label: 'Access Token de produção',
    placeholder: 'APP_USR-...',
    help: 'Mercado Pago Developers → Suas integrações → sua aplicação → Credenciais de produção.',
  },
  {
    name: 'mp_public_key',
    label: 'Public Key de produção',
    placeholder: 'APP_USR-...',
    help: 'Na mesma tela das credenciais. Libera o pagamento com cartão dentro do painel; sem ela, o checkout mostra só o PIX.',
  },
  {
    name: 'mp_webhook_secret',
    label: 'Assinatura secreta do webhook',
    placeholder: 'Cole a assinatura secreta',
    help: 'Na mesma aplicação: Webhooks → Configurar notificações (evento Pagamentos). Confirma que o aviso veio do Mercado Pago.',
  },
];

const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/mp-webhook`;

export function PaymentKeysCard() {
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<SecretName | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('admin_payment_secrets_status');
    setStatus(Object.fromEntries(((data as Status[]) ?? []).map(s => [s.name, s])));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(name: SecretName, value: string) {
    setSaving(name);
    setMessage(null);
    const { error } = await supabase.rpc('admin_set_payment_secret', { p_name: name, p_value: value });
    setSaving(null);
    if (error) { setMessage({ ok: false, text: error.message }); return; }
    setValues(v => ({ ...v, [name]: '' }));
    setMessage({ ok: true, text: value.trim() ? 'Chave salva.' : 'Chave removida.' });
    load();
  }

  async function check() {
    setChecking(true);
    setMessage(null);
    const { data, error } = await supabase.functions.invoke('mp-checkout', { body: { action: 'check' } });
    setChecking(false);
    if (error || !data) { setMessage({ ok: false, text: 'Não foi possível testar agora.' }); return; }
    setMessage(data.ok
      ? { ok: true, text: `Conectado à conta ${data.account || 'do Mercado Pago'}${data.test ? ' (credencial de teste)' : ''}.` }
      : { ok: false, text: data.error });
  }

  function copyWebhook() {
    navigator.clipboard.writeText(WEBHOOK_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const tokenSet = !!status.mp_access_token?.is_set;

  return (
    <div className="brutal-card p-5 mb-6 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-xl flex items-center gap-2"><KeyRound className="w-5 h-5" /> Chaves do Mercado Pago</h2>
          <p className="text-xs text-gray-500 mt-1">
            Ficam criptografadas no banco e não são exibidas depois de salvas. Sem o Access Token, o checkout oferece os links de pagamento cadastrados em Planos.
          </p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 border ${tokenSet ? 'bg-green-100 text-green-800 border-green-300' : 'bg-bioyellow border-black'}`}>
          {tokenSet ? 'CHECKOUT ATIVO' : 'NÃO CONFIGURADO'}
        </span>
      </div>

      <div className="space-y-4">
        {FIELDS.map(f => {
          const st = status[f.name];
          const value = values[f.name] ?? '';
          return (
            <div key={f.name}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <label className="text-xs font-bold uppercase tracking-wider">{f.label}</label>
                <span className="text-[11px] text-gray-500">
                  {st?.is_set
                    ? <>Salva: <span className="font-mono">{st.hint}</span>{st.updated_at && ` · ${new Date(st.updated_at).toLocaleDateString('pt-BR')}`}</>
                    : 'Não configurada'}
                </span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={show[f.name] ? 'text' : 'password'}
                    value={value}
                    onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))}
                    placeholder={st?.is_set ? 'Cole uma nova chave para substituir' : f.placeholder}
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full brutal-input px-3 py-2 pr-9 text-sm font-mono"
                  />
                  <button type="button" onClick={() => setShow(s => ({ ...s, [f.name]: !s[f.name] }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" aria-label="Mostrar ou ocultar">
                    {show[f.name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button onClick={() => save(f.name, value)} disabled={!value.trim() || saving === f.name}
                  className="brutal-btn bg-biolime px-4 py-2 text-sm disabled:opacity-50">
                  {saving === f.name ? 'Salvando...' : 'Salvar'}
                </button>
                {st?.is_set && (
                  <button onClick={() => { if (confirm(`Remover ${f.label.toLowerCase()}?`)) save(f.name, ''); }}
                    disabled={saving === f.name} className="brutal-btn bg-white px-3 py-2" aria-label="Remover">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">{f.help}</p>
            </div>
          );
        })}

        <div>
          <label className="text-xs font-bold uppercase tracking-wider">URL do webhook (cole no Mercado Pago)</label>
          <div className="flex gap-2 mt-1">
            <input readOnly value={WEBHOOK_URL} className="flex-1 brutal-input px-3 py-2 text-xs font-mono bg-gray-50" onFocus={e => e.target.select()} />
            <button onClick={copyWebhook} className="brutal-btn bg-white px-3 py-2" aria-label="Copiar URL">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button onClick={check} disabled={!tokenSet || checking} className="brutal-btn bg-white px-4 py-2 text-sm gap-2 disabled:opacity-50">
            <PlugZap className="w-4 h-4" /> {checking ? 'Testando...' : 'Testar conexão'}
          </button>
          {message && (
            <span className={`text-sm font-bold ${message.ok ? 'text-green-700' : 'text-red-600'}`}>{message.text}</span>
          )}
        </div>
      </div>
    </div>
  );
}
