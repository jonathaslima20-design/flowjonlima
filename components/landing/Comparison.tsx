import { Check, Minus } from 'lucide-react';

// Comparativo genérico: nunca citar concorrentes pelo nome
const ROWS: { feature: string; us: string; others: string }[] = [
  { feature: 'Preço em reais e pagamento via PIX', us: 'Sim', others: 'Geralmente em dólar, com cartão internacional' },
  { feature: 'Plano grátis com links ilimitados', us: 'Sim', others: 'Costuma ter limites' },
  { feature: 'Sem renovação automática', us: 'Você paga só o período escolhido', others: 'Assinatura recorrente' },
  { feature: 'Domínio próprio', us: 'No Pro', others: 'Geralmente só nos planos mais caros' },
  { feature: 'Meta Pixel e Google Analytics', us: 'No Pro', others: 'Geralmente só nos planos mais caros' },
  { feature: 'Formulário para captar contatos', us: 'No Pro', others: 'Nem sempre disponível' },
  { feature: 'Origem das visitas e QR code', us: 'Sim', others: 'Nem sempre disponível' },
  { feature: 'Páginas de clientes com acesso de equipe', us: 'No Business', others: 'Raramente' },
  { feature: 'Suporte em português', us: 'Sim', others: 'Geralmente em inglês' },
];

export function Comparison() {
  return (
    <section id="comparativo" className="py-24 bg-white border-b-2 border-black">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="max-w-2xl">
          <span className="inline-block bg-black text-white px-3 py-1 text-xs font-bold">COMPARATIVO</span>
          <h2 className="font-display text-4xl md:text-5xl mt-4">Por que escolher a BioFlowzy?</h2>
          <p className="mt-4 text-base text-black/70">Feita no Brasil, para quem vende e atende pelo Instagram e pelo WhatsApp.</p>
        </div>

        <div className="mt-12 brutal-card bg-white overflow-hidden">
          <div className="grid grid-cols-[1.3fr_1fr_1fr] bg-black text-white text-xs sm:text-sm font-bold">
            <div className="p-3 sm:p-4">Recurso</div>
            <div className="p-3 sm:p-4 bg-bioyellow text-black border-x-2 border-black">BioFlowzy</div>
            <div className="p-3 sm:p-4">Outras ferramentas</div>
          </div>
          {ROWS.map((r, i) => (
            <div key={r.feature} className={`grid grid-cols-[1.3fr_1fr_1fr] text-xs sm:text-sm border-t-2 border-black ${i % 2 ? 'bg-neutral-50' : 'bg-white'}`}>
              <div className="p-3 sm:p-4 font-bold">{r.feature}</div>
              <div className="p-3 sm:p-4 bg-bioyellow/30 border-x-2 border-black flex items-start gap-2 font-bold">
                <Check className="w-4 h-4 shrink-0 mt-0.5 text-green-700" strokeWidth={3} />
                <span>{r.us}</span>
              </div>
              <div className="p-3 sm:p-4 flex items-start gap-2 text-black/70">
                <Minus className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{r.others}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
