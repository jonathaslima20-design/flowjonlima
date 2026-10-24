import { supabase } from './supabase';

export type PaidPlan = 'pro_monthly' | 'pro_annual';

export type CheckoutResult =
  | { ok: true }
  | { ok: false; notConfigured: boolean; message: string };

// Cria o pagamento na edge function mp-checkout e redireciona para o Checkout Pro
export async function startCheckout(plan: PaidPlan): Promise<CheckoutResult> {
  const { data, error } = await supabase.functions.invoke('mp-checkout', { body: { plan } });
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
