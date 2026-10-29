'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, Eye, EyeOff, Loader2, Radio, Send, Trash2 } from 'lucide-react';

// Meta Pixel e API de Conversões do site BioFlowzy.
// Pixel ID e verificação de domínio: admin_settings.meta_pixel (leitura pública, usada pelo layout).
// Código de teste: admin_settings.meta_capi (só admin). Token da CAPI: Vault (meta_capi_token).

type PixelSetting = { pixel_id: string; enabled: boolean; domain_verification: string };
type TokenStatus = { is_set: boolean; hint: string | null; updated_at: string | null };

const EVENTS: [string, string, string][] = [
  ['PageView', 'Cada página do site (landing, cadastro, painel)', 'Pixel'],
  ['ViewContent', 'Abriu a tela de planos (modal de upgrade)', 'Pixel'],
  ['CompleteRegistration', 'Criou a conta', 'Pixel + CAPI'],
  ['InitiateCheckout', 'Abriu o checkout de um plano', 'Pixel + CAPI'],
  ['AddPaymentInfo', 'Gerou o PIX ou enviou o cartão', 'Pixel + CAPI'],
  ['Purchase', 'Pagamento aprovado (PIX, cartão ou Checkout Pro), com valor em BRL', 'Pixel + CAPI'],
];

export default function AdminTrackingPage() {
  const [pixel, setPixel] = useState<PixelSetting>({ pixel_id: '', enabled: false, domain_verification: '' });
  const [testCode, setTestCode] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    const [{ data: settings }, { data: secrets }] = await Promise.all([
      supabase.from('admin_settings').select('key, value').in('key', ['meta_pixel', 'meta_capi']),
      supabase.rpc('admin_payment_secrets_status'),
    ]);
    const byKey = Object.fromEntries((settings ?? []).map(r => [r.key, (r.value ?? {}) as Record<string, any>]));
    const p = byKey.meta_pixel ?? {};
    setPixel({ pixel_id: p.pixel_id ?? '', enabled: !!p.enabled, domain_verification: p.domain_verification ?? '' });
    setTestCode(byKey.meta_capi?.test_event_code ?? '');
    const t = (secrets ?? []).find(s => s.name === 'meta_capi_token');
    setTokenStatus(t ? { is_set: t.is_set, hint: t.hint, updated_at: t.updated_at } : null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function flash(ok: boolean, text: string) {
    setMessage({ ok, text });
    if (ok) setTimeout(() => setMessage(null), 4000);
  }

  async function savePixel() {
    const id = pixel.pixel_id.trim();
    if (id && !/^\d{6,20}$/.test(id)) { flash(false, 'O Pixel ID tem só números (ex.: 123456789012345).'); return; }
    if (pixel.enabled && !id) { flash(false, 'Informe o Pixel ID para ativar.'); return; }
    const code = pixel.domain_verification.trim();
    if (code && !/^[a-z0-9]{10,64}$/i.test(code)) { flash(false, 'Código de verificação de domínio inválido: cole só o valor de "content".'); return; }
    setSaving('pixel');
    const { error } = await supabase.from('admin_settings').upsert({
      key: 'meta_pixel',
      value: { pixel_id: id, enabled: pixel.enabled, domain_verification: code },
      updated_at: new Date().toISOString(),
    });
    setSaving(null);
    if (error) { flash(false, error.message); return; }
    flash(true, 'Pixel salvo. O site passa a usar a nova configuração em até 5 minutos.');
  }

  async function saveTestCode() {
    setSaving('test');
    const { error } = await supabase.from('admin_settings').upsert({
      key: 'meta_capi',
      value: { test_event_code: testCode.trim().slice(0, 40) },
      updated_at: new Date().toISOString(),
    });
    setSaving(null);
    if (error) { flash(false, error.message); return; }
    flash(true, testCode.trim() ? 'Código de teste salvo: os eventos da CAPI vão para "Eventos de teste".' : 'Código de teste removido: eventos voltam a contar normalmente.');
  }

  async function saveToken(value: string) {
    setSaving('token');
    const { error } = await supabase.rpc('admin_set_payment_secret', { p_name: 'meta_capi_token', p_value: value });
    setSaving(null);
    if (error) { flash(false, error.message); return; }
    setToken('');
    flash(true, value.trim() ? 'Token salvo.' : 'Token removido.');
    load();
  }

  async function sendTest() {
    setTesting(true);
    setMessage(null);
    const { data, error } = await supabase.functions.invoke('meta-events', { body: { action: 'test' } });
    setTesting(false);
    if (error || !data) { flash(false, 'Não foi possível testar agora.'); return; }
    flash(!!data.ok, data.ok ? `O Meta recebeu ${data.received} evento. Confira em Gerenciador de Eventos → Eventos de teste.` : data.error);
  }

  if (loading) return <div className="p-8 font-bold text-gray-400 animate-pulse">Carregando...</div>;

  const active = pixel.enabled && /^\d{6,20}$/.test(pixel.pixel_id);

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl mb-1">Rastreamento</h1>
        <p className="text-gray-500 text-sm">Meta Pixel e API de Conversões do site BioFlowzy, para medir anúncios e conversões. Não afeta o Pixel que cada usuário configura na própria página.</p>
      </div>

      {message && (
        <div className={`brutal-border p-3 mb-5 text-sm font-bold ${message.ok ? 'bg-biolime' : 'bg-red-100 text-red-700'}`}>{message.text}</div>
      )}

      {/* Pixel */}
      <section className="brutal-card bg-white p-5 mb-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-xl">Meta Pixel</h2>
            <p className="text-xs text-gray-500 mt-1">Carrega nas páginas do site (landing, cadastro, painel e checkout) só para quem aceitar os cookies de marketing. O painel admin não é rastreado.</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 border ${active ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
            {active ? 'ATIVO' : 'DESATIVADO'}
          </span>
        </div>
        <div className="grid gap-4">
          <Field label="Pixel ID (ID do conjunto de dados)" help="Gerenciador de Eventos → seu conjunto de dados → Configurações. Só números.">
            <input value={pixel.pixel_id} onChange={e => setPixel({ ...pixel, pixel_id: e.target.value.replace(/\D/g, '') })} inputMode="numeric" placeholder="123456789012345" className="w-full brutal-input px-3 py-2 text-sm font-mono" />
          </Field>
          <Field label="Verificação de domínio (opcional)" help='Gerenciador de Negócios → Segurança da marca → Domínios → "Marcação de metatag". Cole só o valor de content (ex.: abc123xyz…).'>
            <input value={pixel.domain_verification} onChange={e => setPixel({ ...pixel, domain_verification: e.target.value.trim() })} placeholder="código da metatag facebook-domain-verification" className="w-full brutal-input px-3 py-2 text-sm font-mono" />
          </Field>
          <label className="inline-flex items-center gap-3 cursor-pointer w-fit">
            <input type="checkbox" checked={pixel.enabled} onChange={e => setPixel({ ...pixel, enabled: e.target.checked })} className="w-4 h-4 accent-black" />
            <span className="text-sm font-bold">Ativar Pixel e API de Conversões</span>
          </label>
          <div>
            <button onClick={savePixel} disabled={saving === 'pixel'} className="brutal-btn bg-biolime px-5 py-2 text-sm disabled:opacity-50">
              {saving === 'pixel' ? 'Salvando...' : 'Salvar Pixel'}
            </button>
          </div>
        </div>
      </section>

      {/* CAPI */}
      <section className="brutal-card bg-white p-5 mb-5">
        <h2 className="font-display text-xl">API de Conversões (CAPI)</h2>
        <p className="text-xs text-gray-500 mt-1 mb-4">Envia as conversões também pelo servidor, com e-mail, WhatsApp e ID do usuário criptografados (SHA-256). Recupera conversões que bloqueadores de anúncio escondem do Pixel. O Meta junta os dois envios pelo ID do evento.</p>
        <div className="grid gap-4">
          <Field
            label="Token de acesso"
            help="Gerenciador de Eventos → conjunto de dados → Configurações → API de Conversões → Gerar token de acesso. Fica criptografado e não é exibido depois de salvo."
            right={tokenStatus?.is_set
              ? <>Salvo: <span className="font-mono">{tokenStatus.hint}</span>{tokenStatus.updated_at && ` · ${new Date(tokenStatus.updated_at).toLocaleDateString('pt-BR')}`}</>
              : 'Não configurado'}
          >
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={e => setToken(e.target.value.trim())}
                  placeholder={tokenStatus?.is_set ? 'Cole um novo token para substituir' : 'EAAG...'}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full brutal-input px-3 py-2 pr-9 text-sm font-mono"
                />
                <button type="button" onClick={() => setShowToken(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" aria-label="Mostrar ou ocultar">
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button onClick={() => saveToken(token)} disabled={!token || saving === 'token'} className="brutal-btn bg-biolime px-4 py-2 text-sm disabled:opacity-50">
                {saving === 'token' ? 'Salvando...' : 'Salvar'}
              </button>
              {tokenStatus?.is_set && (
                <button onClick={() => { if (confirm('Remover o token da API de Conversões?')) saveToken(''); }} className="brutal-btn bg-white px-3 py-2" aria-label="Remover token">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </Field>

          <Field label="Código de teste (opcional)" help='Gerenciador de Eventos → Eventos de teste → "Testar eventos do servidor" (ex.: TEST12345). Enquanto estiver salvo, os eventos da CAPI aparecem só em Eventos de teste: apague quando terminar de testar.'>
            <div className="flex gap-2">
              <input value={testCode} onChange={e => setTestCode(e.target.value.trim())} placeholder="TEST12345" className="flex-1 brutal-input px-3 py-2 text-sm font-mono" />
              <button onClick={saveTestCode} disabled={saving === 'test'} className="brutal-btn bg-white px-4 py-2 text-sm disabled:opacity-50">
                {saving === 'test' ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </Field>

          <div>
            <button onClick={sendTest} disabled={testing} className="brutal-btn bg-black text-white px-5 py-2 text-sm gap-2 disabled:opacity-50">
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Enviar evento de teste
            </button>
            <p className="text-[11px] text-gray-500 mt-1">Envia um PageView pelo servidor usando o código de teste.</p>
          </div>
        </div>
      </section>

      {/* Eventos */}
      <section className="brutal-card bg-white p-5">
        <h2 className="font-display text-xl flex items-center gap-2"><Radio className="w-5 h-5" /> Eventos enviados</h2>
        <p className="text-xs text-gray-500 mt-1 mb-4">Use Purchase para otimizar campanhas de venda e CompleteRegistration para campanhas de cadastro. Nada é enviado para quem recusar os cookies de marketing.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-black text-left">
                <th className="py-2 pr-3 font-display text-xs uppercase">Evento</th>
                <th className="py-2 pr-3 font-display text-xs uppercase">Quando</th>
                <th className="py-2 font-display text-xs uppercase">Envio</th>
              </tr>
            </thead>
            <tbody>
              {EVENTS.map(([name, when, via]) => (
                <tr key={name} className="border-b border-gray-100">
                  <td className="py-2 pr-3 font-mono text-xs font-bold whitespace-nowrap">{name}</td>
                  <td className="py-2 pr-3 text-xs">{when}</td>
                  <td className="py-2 text-xs whitespace-nowrap inline-flex items-center gap-1">
                    {via.includes('CAPI') && <Check className="w-3 h-3 text-green-600" />}{via}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Field({ label, help, right, children }: { label: string; help: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <label className="text-xs font-bold uppercase tracking-wider">{label}</label>
        {right && <span className="text-[11px] text-gray-500">{right}</span>}
      </div>
      {children}
      <p className="text-[11px] text-gray-500 mt-1">{help}</p>
    </div>
  );
}
