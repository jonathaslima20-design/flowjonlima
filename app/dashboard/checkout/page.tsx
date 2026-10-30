'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, CircleCheck, Clock, Copy, CreditCard, Loader2, QrCode, ShieldCheck, CircleAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { PLANS, PERIOD_LABELS, brl, type BillingPeriod, type PaidPlanSlug } from '@/lib/plans';
import { startCheckout } from '@/lib/checkout';
import { getMetaContext, planEventData, trackMeta, trackPurchase } from '@/lib/meta-pixel';
import { WhatsAppSupport } from '@/components/shared/WhatsAppSupport';

// Checkout transparente: PIX (QR code na tela) e cartão (Card Payment Brick do Mercado Pago),
// pela edge function mp-payment. A liberação do plano vem do webhook (ou na hora, no cartão aprovado).

type Method = 'pix' | 'card';
type Config = { enabled: boolean; publicKey: string | null };
type Pix = { paymentId: string; qrCode: string | null; qrCodeBase64: string | null; ticketUrl: string | null; expiresAt: string | null };
type Result = { kind: 'approved' | 'pending'; text: string };
// Preço calculado no banco (checkout_quote / license_quote): desconto do parceiro ou licenças no atacado
type Quote = {
  list_cents: number; amount_cents: number; discount_cents: number; discount_pct: number;
  partner_name?: string | null; coupon_code?: string | null; coupon_error?: string | null; error?: string; quantity?: number;
};
type Extra = { coupon?: string | null; kind?: 'license'; qty?: number } | undefined;

const PAID: PaidPlanSlug[] = ['pro', 'business'];
const PERIODS: BillingPeriod[] = ['quarterly', 'annual'];

const CARD_ERRORS: Record<string, string> = {
  cc_rejected_insufficient_amount: 'Saldo ou limite insuficiente.',
  cc_rejected_bad_filled_security_code: 'Código de segurança inválido.',
  cc_rejected_bad_filled_date: 'Data de validade inválida.',
  cc_rejected_bad_filled_card_number: 'Número do cartão inválido.',
  cc_rejected_bad_filled_other: 'Confira os dados do cartão.',
  cc_rejected_call_for_authorize: 'O banco pediu autorização: ligue para o emissor do cartão e tente de novo.',
  cc_rejected_card_disabled: 'Cartão inativo. Ative-o com o banco ou use outro cartão.',
  cc_rejected_duplicated_payment: 'Pagamento duplicado: você já fez um pagamento com esse valor agora há pouco.',
  cc_rejected_high_risk: 'Pagamento recusado por segurança. Tente o PIX ou outro cartão.',
  cc_rejected_max_attempts: 'Limite de tentativas atingido. Use outro cartão ou o PIX.',
  cc_rejected_blacklist: 'Pagamento recusado. Use outro cartão ou o PIX.',
};

declare global {
  interface Window { MercadoPago?: any }
}

function loadMpSdk(): Promise<void> {
  if (window.MercadoPago) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('mp-sdk') as HTMLScriptElement | null;
    const script = existing ?? document.createElement('script');
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('sdk')));
    if (!existing) {
      script.id = 'mp-sdk';
      script.src = 'https://sdk.mercadopago.com/js/v2';
      document.body.appendChild(script);
    }
  });
}

function maskDocument(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 11) {
    return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
}

async function callPayment(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('mp-payment', { body });
  if (!error) return { data, error: null as string | null };
  let message = 'Não foi possível concluir. Tente novamente.';
  try {
    const parsed = await (error as any)?.context?.json();
    if (parsed?.error) message = parsed.error;
  } catch {}
  return { data: null, error: message };
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="font-bold">Carregando...</div>}>
      <Checkout />
    </Suspense>
  );
}

function Checkout() {
  const params = useSearchParams();
  const plan = (PAID.includes(params.get('plan') as PaidPlanSlug) ? params.get('plan') : 'pro') as PaidPlanSlug;
  const period = (PERIODS.includes(params.get('period') as BillingPeriod) ? params.get('period') : 'quarterly') as BillingPeriod;
  // Parceiro comprando licenças no atacado: ?kind=license&qty=10
  const isLicense = params.get('kind') === 'license';
  const qty = Math.max(1, Math.min(500, Math.floor(Number(params.get('qty')) || 0)));
  const { userId, email } = useAuth();

  const [config, setConfig] = useState<Config | null>(null);
  const [price, setPrice] = useState(PLANS[plan].prices[period]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<string | null>(null);
  const [couponOpen, setCouponOpen] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const [method, setMethod] = useState<Method>('pix');
  const [result, setResult] = useState<Result | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    callPayment({ action: 'config' }).then(({ data }) => setConfig(data ?? { enabled: false, publicKey: null }));
    supabase.from('plans').select('price_cents, price_annual_cents, button_url').eq('slug', plan).maybeSingle().then(({ data }) => {
      if (!data) return;
      const cents = period === 'annual' ? data.price_annual_cents : data.price_cents;
      if (cents) setPrice(cents);
      setFallbackUrl(data.button_url?.startsWith('https://') ? data.button_url : null);
    });
  }, [plan, period]);

  // Preço final no banco: desconto do parceiro (cupom ou link) ou licenças com desconto de atacado
  useEffect(() => {
    const req = isLicense
      ? supabase.rpc('license_quote', { p_plan: plan, p_period: period, p_qty: qty })
      : supabase.rpc('checkout_quote', { p_plan: plan, p_period: period, p_coupon: coupon ?? undefined });
    req.then(({ data }) => setQuote((data as unknown as Quote) ?? null));
  }, [plan, period, coupon, isLicense, qty]);

  const couponError = coupon ? quote?.coupon_error : null;
  const finalPrice = quote && !quote.error && !couponError ? quote.amount_cents : price;
  // Memorizado: o formulário do cartão é recriado quando muda
  const extra = useMemo<Extra>(
    () => (isLicense ? { kind: 'license', qty } : coupon && !couponError ? { coupon } : undefined),
    [isLicense, qty, coupon, couponError],
  );

  function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    setCoupon(code || null);
  }

  async function payOnMercadoPago() {
    setRedirecting(true);
    const res = await startCheckout(plan, period, extra);
    if (!res.ok) setRedirecting(false);
  }

  // Meta: início do checkout (uma vez por plano/período)
  const initiated = useRef('');
  useEffect(() => {
    const key = plan + '_' + period;
    if (initiated.current === key) return;
    initiated.current = key;
    trackMeta('InitiateCheckout', planEventData(plan, period, PLANS[plan].prices[period]), { capi: true });
  }, [plan, period]);

  const pixApproved = useCallback((paymentId: string) => {
    trackPurchase(paymentId, planEventData(plan, period, finalPrice));
    setResult({
      kind: 'approved',
      text: isLicense ? 'Suas licenças já estão disponíveis no Painel do Parceiro.' : 'Seu plano já está ativo. Aproveite todos os recursos!',
    });
  }, [plan, period, finalPrice, isLicense]);
  const def = PLANS[plan];
  const hasDiscount = !!quote && !quote.error && !couponError && quote.discount_cents > 0;

  return (
    <div className="max-w-xl mx-auto">
      <Link href={isLicense ? '/dashboard/parceiro?tab=licencas' : '/dashboard'} className="inline-flex items-center gap-1.5 text-sm font-bold mb-4 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <div className={`brutal-card p-5 mb-5 ${plan === 'pro' ? 'bg-bioyellow' : 'bg-biolime'}`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-2xl leading-tight">{isLicense ? `${qty} licenças ${def.name}` : `Plano ${def.name}`}</p>
            <p className="text-sm font-bold text-black/70">
              {isLicense
                ? `Pacote ${PERIOD_LABELS[period].adjective} para seus clientes · ${quote?.discount_pct ?? 0}% de desconto de atacado`
                : `Pacote ${PERIOD_LABELS[period].adjective} · equivale a ${brl(Math.round(finalPrice / (period === 'annual' ? 12 : 3)))}/mês`}
            </p>
          </div>
          <div className="text-right">
            {hasDiscount && <p className="text-sm font-bold line-through text-black/50">{brl(quote!.list_cents)}</p>}
            <p className="font-display text-3xl whitespace-nowrap">{brl(finalPrice)}</p>
          </div>
        </div>
        {isLicense && quote?.error && <p className="mt-3 text-sm font-bold text-biored">{quote.error}</p>}
        {!isLicense && hasDiscount && (
          <p className="mt-3 text-sm font-bold inline-flex items-center gap-1.5 bg-white brutal-border px-2 py-1">
            <Check className="w-4 h-4" /> {quote!.discount_pct}% de desconto{quote!.partner_name ? ` de ${quote!.partner_name}` : ''} no primeiro pagamento
          </p>
        )}
      </div>

      {!isLicense && !result && (
        <div className="mb-5 -mt-2">
          {couponOpen || coupon ? (
            <form onSubmit={applyCoupon} className="flex gap-2">
              <input
                value={couponInput}
                onChange={e => setCouponInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="Cupom de parceiro"
                maxLength={20}
                className="flex-1 min-w-0 brutal-input px-3 py-2 text-sm font-bold uppercase"
              />
              <button className="brutal-btn bg-black text-white px-4 py-2 text-sm">Aplicar</button>
            </form>
          ) : (
            <button onClick={() => setCouponOpen(true)} className="text-xs font-bold underline">Tem um cupom de parceiro?</button>
          )}
          {couponError && <p className="mt-2 text-sm font-bold text-biored inline-flex items-center gap-1.5"><CircleAlert className="w-4 h-4" /> {couponError}</p>}
        </div>
      )}

      <div className="brutal-card bg-white p-5 md:p-6">
        {isLicense && quote?.error ? (
          <p className="text-sm font-bold text-center py-4">Ajuste a quantidade no Painel do Parceiro para continuar.</p>
        ) : result ? (
          <ResultView result={result} />
        ) : !config ? (
          <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : !config.enabled ? (
          <div className="text-center py-4">
            <p className="font-bold mb-1">O pagamento dentro do painel ainda não está disponível.</p>
            {fallbackUrl ? (
              <>
                <p className="text-sm text-black/60 mb-4">Você pode pagar pelo link do Mercado Pago.</p>
                <a href={fallbackUrl} target="_blank" rel="noopener noreferrer" className="brutal-btn bg-black text-white px-5 py-3 inline-flex">Pagar pelo Mercado Pago</a>
              </>
            ) : (
              <p className="text-sm text-black/60">Fale com a gente para assinar.</p>
            )}
            <div className="mt-6"><WhatsAppSupport /></div>
          </div>
        ) : (
          <>
            <h2 className="font-display text-xl">Forma de pagamento</h2>
            <p className="text-sm text-black/60 mb-4">Escolha como deseja pagar</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {([['pix', 'PIX', QrCode], ['card', 'Cartão', CreditCard]] as [Method, string, typeof QrCode][]).map(([m, label, Icon]) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`brutal-border py-3 font-bold inline-flex items-center justify-center gap-2 transition-colors ${method === m ? 'bg-black text-white' : 'bg-white hover:bg-bioyellow'}`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>

            {method === 'pix' ? (
              <PixForm plan={plan} period={period} extra={extra} userId={userId} email={email} onApproved={pixApproved} />
            ) : config.publicKey ? (
              <CardForm
                publicKey={config.publicKey}
                plan={plan}
                period={period}
                extra={extra}
                amount={finalPrice}
                email={email}
                onResult={setResult}
              />
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-black/70 mb-4">Para pagar com cartão, você vai para a página segura do Mercado Pago e volta para cá depois.</p>
                <button onClick={payOnMercadoPago} disabled={redirecting} className="brutal-btn bg-black text-white px-5 py-3 gap-2 disabled:opacity-60">
                  {redirecting && <Loader2 className="w-4 h-4 animate-spin" />} Pagar com cartão no Mercado Pago
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-4 text-center space-y-2">
        <p className="text-xs text-black/60 inline-flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" /> Pagamento seguro processado pelo Mercado Pago · sem renovação automática
        </p>
        {config?.enabled && !result && (
          <p className="text-xs">
            <button onClick={payOnMercadoPago} disabled={redirecting} className="font-bold underline disabled:opacity-60">
              Prefere boleto? Pague pelo site do Mercado Pago
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

function PixForm({ plan, period, extra, userId, email, onApproved }: {
  plan: PaidPlanSlug; period: BillingPeriod; extra: Extra; userId: string | null; email: string | null; onApproved: (paymentId: string) => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [doc, setDoc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pix, setPix] = useState<Pix | null>(null);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Sugere o nome a partir do perfil
  useEffect(() => {
    if (!userId) return;
    supabase.from('profiles').select('display_name').eq('id', userId).maybeSingle().then(({ data }) => {
      const parts = (data?.display_name ?? '').trim().split(/\s+/).filter(Boolean);
      if (!parts.length) return;
      setFirstName(f => f || parts[0]);
      setLastName(l => l || parts.slice(1).join(' '));
    });
  }, [userId]);

  // Espera o webhook marcar o pagamento como aprovado
  useEffect(() => {
    if (!pix) return;
    const poll = setInterval(async () => {
      const { data } = await supabase.from('payments').select('status').eq('id', pix.paymentId).maybeSingle();
      if (data?.status === 'approved') { clearInterval(poll); onApproved(pix.paymentId); }
    }, 4000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(poll); clearInterval(tick); };
  }, [pix, onApproved]);

  async function generate() {
    setError('');
    const digits = doc.replace(/\D/g, '');
    if (!firstName.trim()) { setError('Informe seu nome.'); return; }
    if (digits.length !== 11 && digits.length !== 14) { setError('Informe um CPF ou CNPJ válido.'); return; }
    setLoading(true);
    const { data, error } = await callPayment({
      action: 'pix', plan, period, ...extra, meta: getMetaContext(),
      payer: { first_name: firstName, last_name: lastName, document: digits },
    });
    setLoading(false);
    if (error || !data?.qrCode) { setError(error ?? 'Não foi possível gerar o PIX.'); return; }
    setPix(data);
    trackMeta('AddPaymentInfo', { ...planEventData(plan, period, PLANS[plan].prices[period]), payment_type: 'pix' }, { capi: true });
  }

  function copy() {
    if (!pix?.qrCode) return;
    navigator.clipboard.writeText(pix.qrCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  if (pix) {
    const left = pix.expiresAt ? Math.max(0, new Date(pix.expiresAt).getTime() - now) : null;
    const expired = left === 0;
    const mm = left !== null ? String(Math.floor(left / 60000)).padStart(2, '0') : '';
    const ss = left !== null ? String(Math.floor((left % 60000) / 1000)).padStart(2, '0') : '';
    return (
      <div className="text-center">
        <span className="w-12 h-12 bg-biolime brutal-border inline-flex items-center justify-center mb-2"><QrCode className="w-6 h-6" /></span>
        <p className="font-display text-xl">{expired ? 'Código expirado' : 'QR Code gerado!'}</p>
        <p className="text-sm text-black/60 mb-4">{expired ? 'Gere um novo código para pagar.' : 'Escaneie o QR Code ou copie o código para pagar no app do seu banco.'}</p>
        {!expired && (
          <>
            {pix.qrCodeBase64 && (
              <div className="inline-block brutal-border bg-white p-3 mb-4">
                <img src={`data:image/png;base64,${pix.qrCodeBase64}`} alt="QR Code PIX" className="w-52 h-52" />
              </div>
            )}
            <div className="text-left">
              <label className="text-xs font-bold uppercase tracking-wider">PIX copia e cola</label>
              <div className="flex gap-2 mt-1">
                <input readOnly value={pix.qrCode ?? ''} onFocus={e => e.target.select()} className="flex-1 min-w-0 brutal-input px-3 py-2 text-xs font-mono bg-gray-50" />
                <button onClick={copy} className={`brutal-btn px-3 py-2 gap-1.5 text-sm ${copied ? 'bg-biolime' : 'bg-bioyellow'}`}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
            <p className="mt-4 text-sm font-bold inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Aguardando confirmação do pagamento…
            </p>
            {left !== null && <p className="text-xs text-black/60 mt-1 inline-flex items-center gap-1 w-full justify-center"><Clock className="w-3.5 h-3.5" /> Expira em {mm}:{ss}</p>}
            <p className="text-xs text-black/60 mt-3">Após o pagamento, seu plano é ativado automaticamente em poucos segundos. Pode deixar esta página aberta.</p>
          </>
        )}
        {expired && (
          <button onClick={() => setPix(null)} className="brutal-btn bg-black text-white px-5 py-3">Gerar novo código</button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Nome *">
          <input value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name" className="w-full brutal-input px-3 py-2.5 text-sm" />
        </Field>
        <Field label="Sobrenome">
          <input value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="family-name" className="w-full brutal-input px-3 py-2.5 text-sm" />
        </Field>
      </div>
      <Field label="E-mail">
        <input value={email ?? ''} readOnly className="w-full brutal-input px-3 py-2.5 text-sm bg-gray-50 text-black/70" />
      </Field>
      <Field label="CPF/CNPJ *">
        <input value={doc} onChange={e => setDoc(maskDocument(e.target.value))} inputMode="numeric" placeholder="000.000.000-00" className="w-full brutal-input px-3 py-2.5 text-sm" />
      </Field>
      {error && <p className="text-sm font-bold text-biored inline-flex items-center gap-1.5"><CircleAlert className="w-4 h-4" /> {error}</p>}
      <button onClick={generate} disabled={loading} className="brutal-btn w-full bg-black text-white py-3.5 gap-2 disabled:opacity-60">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
        {loading ? 'Gerando...' : 'Gerar QR Code PIX'}
      </button>
      <p className="text-center text-xs text-black/60">O pagamento via PIX é confirmado na hora.</p>
    </div>
  );
}

function CardForm({ publicKey, plan, period, extra, amount, email, onResult }: {
  publicKey: string; plan: PaidPlanSlug; period: BillingPeriod; extra: Extra; amount: number; email: string | null; onResult: (r: Result) => void;
}) {
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [error, setError] = useState('');
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const submit = useCallback(async (formData: any) => {
    setError('');
    trackMeta('AddPaymentInfo', { ...planEventData(plan, period, amount), payment_type: 'card' }, { capi: true });
    const { data, error } = await callPayment({ action: 'card', plan, period, ...extra, card: formData, meta: getMetaContext() });
    if (error) { setError(error); throw new Error(error); }
    if (data.status === 'approved') {
      trackPurchase(data.paymentId, planEventData(plan, period, amount));
      onResultRef.current({ kind: 'approved', text: 'Pagamento aprovado e plano ativado. Aproveite todos os recursos!' });
    } else if (data.status === 'in_process' || data.status === 'pending' || data.status === 'authorized') {
      onResultRef.current({ kind: 'pending', text: 'O Mercado Pago está analisando o pagamento. Assim que for aprovado, seu plano é ativado automaticamente e você recebe a confirmação por e-mail.' });
    } else {
      const message = CARD_ERRORS[data.statusDetail] ?? 'Pagamento recusado. Confira os dados ou tente outro cartão.';
      setError(message);
      throw new Error(message);
    }
  }, [plan, period, amount, extra]);

  useEffect(() => {
    let controller: any;
    let cancelled = false;
    loadMpSdk().then(async () => {
      if (cancelled) return;
      const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
      controller = await mp.bricks().create('cardPayment', 'card-brick', {
        initialization: { amount: amount / 100, payer: { email: email ?? undefined } },
        customization: {
          paymentMethods: { maxInstallments: 12 },
          visual: {
            style: {
              customVariables: {
                baseColor: '#000000',
                buttonTextColor: '#FFFFFF',
                borderRadiusSmall: '0px',
                borderRadiusMedium: '0px',
                borderRadiusLarge: '0px',
                borderRadiusFull: '0px',
                formBackgroundColor: '#FFFFFF',
              },
            },
          },
        },
        callbacks: {
          onReady: () => { if (!cancelled) setState('ready'); },
          onSubmit: (formData: any) => submit(formData),
          onError: (err: any) => { console.error('card brick', err); },
        },
      });
      if (cancelled) controller?.unmount();
    }).catch(() => { if (!cancelled) setState('failed'); });
    return () => { cancelled = true; controller?.unmount?.(); };
  }, [publicKey, amount, email, submit]);

  return (
    <div>
      {state === 'loading' && <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>}
      {state === 'failed' && <p className="text-sm font-bold text-biored">Não foi possível carregar o formulário do cartão. Recarregue a página ou use o PIX.</p>}
      <div id="card-brick" />
      {error && <p className="mt-3 text-sm font-bold text-biored inline-flex items-center gap-1.5"><CircleAlert className="w-4 h-4 shrink-0" /> {error}</p>}
    </div>
  );
}

function ResultView({ result }: { result: Result }) {
  const approved = result.kind === 'approved';
  return (
    <div className="text-center py-4">
      <span className={`w-14 h-14 brutal-border inline-flex items-center justify-center mb-3 ${approved ? 'bg-biolime' : 'bg-bioyellow'}`}>
        {approved ? <CircleCheck className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
      </span>
      <p className="font-display text-2xl">{approved ? 'Plano ativado!' : 'Pagamento em análise'}</p>
      <p className="text-sm text-black/70 mt-1 mb-5">{result.text}</p>
      {/* Recarrega o painel para ler o plano novo */}
      <button onClick={() => { window.location.href = '/dashboard'; }} className="brutal-btn bg-black text-white px-5 py-3 inline-flex">Ir para o painel</button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
