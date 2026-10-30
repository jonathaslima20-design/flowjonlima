import { supabase } from './supabase';
import type { BillingPeriod, PaidPlanSlug } from './plans';
import { getMetaContext } from './meta-pixel';

export type CheckoutResult =
  | { ok: true }
  | { ok: false; notConfigured: boolean; message: string };

// Cria o pagamento na edge function mp-checkout e redireciona para o Checkout Pro
// extra: cupom de parceiro ou compra de licenças ({ kind: 'license', qty })
export async function startCheckout(
  plan: PaidPlanSlug,
  period: BillingPeriod,
  extra?: { coupon?: string | null; kind?: 'license'; qty?: number },
): Promise<CheckoutResult> {
  const { data, error } = await supabase.functions.invoke('mp-checkout', { body: { plan, period, ...extra, meta: getMetaContext() } });
  if (!error && data?.url) {
    window.location.href = data.url;
    return { ok: true };
  }
  const response: Response | undefined = (error as any)?.context;
  let message = 'Não foi possível iniciar o pagamento. Tente novamente.';
  try {
    const body = await response?.json();
    if (body?.error) message = body.error;
  } catch {}
  // 503 = secrets do Mercado Pago ainda não cadastrados; 404 = função não publicada
  const notConfigured = response?.status === 503 || response?.status === 404;
  return { ok: false, notConfigured, message };
}
