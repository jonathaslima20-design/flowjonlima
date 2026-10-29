'use client';

import { useEffect, useState } from 'react';
import { CircleCheck, Clock, X, CircleAlert, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { planEventData, trackPurchase } from '@/lib/meta-pixel';

type Kind = 'checking' | 'success' | 'pending' | 'failure';

const MESSAGES: Record<Kind, { title: string; text: string }> = {
  checking: {
    title: 'Conferindo seu pagamento…',
    text: 'Estamos consultando o Mercado Pago.',
  },
  success: {
    title: 'Pagamento aprovado!',
    text: 'Estamos ativando seu plano, isso leva só alguns segundos.',
  },
  pending: {
    title: 'Pagamento aguardando confirmação',
    text: 'Se ainda não pagou, conclua o PIX ou o boleto gerado no Mercado Pago. Assim que o pagamento for confirmado, seu plano é ativado automaticamente.',
  },
  failure: {
    title: 'O pagamento não foi concluído',
    text: 'Nenhuma cobrança foi feita. Você pode tentar novamente quando quiser.',
  },
};

const PENDING = ['pending', 'in_process', 'authorized', 'in_mediation'];

// Mostra o resultado quando o Mercado Pago redireciona de volta para /dashboard?payment=...
// O endereço de retorno não prova nada (o botão "voltar" do Mercado Pago usa o de sucesso mesmo com PIX em aberto),
// então a mensagem segue o status do pagamento no banco, atualizado pelo webhook.
export function PaymentReturnNotice() {
  const [kind, setKind] = useState<Kind | null>(null);
  const [text, setText] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get('payment');
    if (!value) return;
    // Parâmetros que o Mercado Pago acrescenta no retorno
    const reference = params.get('external_reference');
    const mpStatus = params.get('collection_status') || params.get('status');
    for (const key of ['payment', 'collection_id', 'collection_status', 'payment_id', 'status', 'external_reference', 'payment_type', 'merchant_order_id', 'preference_id', 'site_id', 'processing_mode', 'merchant_account_id']) {
      params.delete(key);
    }
    const qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));

    const show = (k: Kind, t?: string) => { setKind(k); setText(t ?? MESSAGES[k].text); };
    show('checking');

    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    async function check() {
      attempts++;
      const base = supabase.from('payments').select('id, status, mp_payment_id, plan_slug, period, amount_cents');
      const { data } = await (reference
        ? base.eq('id', reference).maybeSingle()
        : base.order('created_at', { ascending: false }).limit(1).maybeSingle());
      if (cancelled) return;
      const status = data?.status;

      if (status === 'approved' && data) {
        show('success');
        trackPurchase(data.id, planEventData(data.plan_slug, data.period, data.amount_cents));
        timer = setTimeout(() => window.location.reload(), 1500);
        return;
      }
      // O Mercado Pago disse que aprovou, mas o webhook ainda não chegou: espera um pouco
      if (mpStatus === 'approved') {
        if (attempts < 10) { show('success'); timer = setTimeout(check, 3000); return; }
        show('success', 'Recebemos seu pagamento. Seu plano será ativado em alguns minutos — atualize a página em instantes.');
        return;
      }
      if ((status && PENDING.includes(status) && (data?.mp_payment_id || mpStatus)) || (mpStatus && PENDING.includes(mpStatus))) {
        show('pending');
        return;
      }
      show('failure');
    }

    check();
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  if (!kind) return null;

  const Icon = kind === 'checking' ? Loader2 : kind === 'success' ? CircleCheck : kind === 'pending' ? Clock : CircleAlert;
  const bg = kind === 'success' ? 'bg-biolime' : kind === 'failure' ? 'bg-red-100' : kind === 'pending' ? 'bg-bioyellow' : 'bg-white';

  return (
    <div className={`${bg} brutal-border p-4 mb-6 flex items-start gap-3`}>
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${kind === 'checking' ? 'animate-spin' : ''}`} />
      <div className="flex-1">
        <p className="font-bold">{MESSAGES[kind].title}</p>
        <p className="text-sm">{text}</p>
      </div>
      <button onClick={() => setKind(null)} aria-label="Fechar" className="shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
