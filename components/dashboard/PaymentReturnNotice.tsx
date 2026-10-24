'use client';

import { useEffect, useState } from 'react';
import { CircleCheck, Clock, X, CircleAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Kind = 'success' | 'pending' | 'failure';

const MESSAGES: Record<Kind, { title: string; text: string }> = {
  success: {
    title: 'Pagamento aprovado!',
    text: 'Estamos ativando seu plano, isso leva só alguns segundos.',
  },
  pending: {
    title: 'Pagamento em processamento',
    text: 'Assim que o Mercado Pago confirmar o pagamento (PIX ou boleto), seu plano é ativado automaticamente.',
  },
  failure: {
    title: 'O pagamento não foi concluído',
    text: 'Nenhuma cobrança foi feita. Você pode tentar novamente quando quiser.',
  },
};

// Mostra o resultado quando o Mercado Pago redireciona de volta para /dashboard?payment=...
export function PaymentReturnNotice() {
  const [kind, setKind] = useState<Kind | null>(null);
  const [text, setText] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get('payment') as Kind | null;
    if (!value || !(value in MESSAGES)) return;
    setKind(value);
    setText(MESSAGES[value].text);
    params.delete('payment');
    const qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));

    if (value !== 'success') return;

    // A liberação vem pelo webhook; espera o pagamento mais recente ficar aprovado
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts++;
      const { data } = await supabase
        .from('payments')
        .select('status')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.status === 'approved') {
        clearInterval(timer);
        window.location.reload();
      } else if (attempts >= 10) {
        clearInterval(timer);
        setText('Recebemos seu pagamento. Seu plano será ativado em alguns minutos — atualize a página em instantes.');
      }
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  if (!kind) return null;

  const Icon = kind === 'success' ? CircleCheck : kind === 'pending' ? Clock : CircleAlert;
  const bg = kind === 'success' ? 'bg-biolime' : kind === 'pending' ? 'bg-bioyellow' : 'bg-red-100';

  return (
    <div className={`${bg} brutal-border p-4 mb-6 flex items-start gap-3`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
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
