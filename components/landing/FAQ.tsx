'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

const faqs = [
  { q: 'Preciso de cartão de crédito?', a: 'Não. O plano Free é gratuito para sempre e não pede cartão. Você só informa pagamento quando decidir fazer upgrade.' },
  { q: 'Posso usar meu domínio?', a: 'Sim. Assinantes Pro podem conectar um domínio customizado diretamente pelo painel, em poucos minutos.' },
  { q: 'Como funciona o analytics?', a: 'Registramos cada clique em links, redes sociais e banners. Você acompanha tudo em tempo real com gráficos claros no dashboard.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim, sem multa, sem burocracia e sem ligação chata. Seus dados e sua página continuam acessíveis no plano Free.' },
  { q: 'Minha página fica no ar 24 horas por dia?', a: 'Sim. Sua bio link fica online o tempo todo, mesmo que você não esteja logado. Qualquer pessoa com o link consegue acessar normalmente.' },
  { q: 'Posso vender ou divulgar meus produtos pela bio?', a: 'Com certeza. Você pode adicionar links para sua loja, WhatsApp, checkout ou qualquer destino. Banners e botões de destaque ajudam a converter visitantes em clientes.' },
  { q: 'Como funciona o Indique e Ganhe?', a: 'Ao assinar o plano Pro, você recebe um link de indicação exclusivo. Cada vez que alguém se cadastrar e assinar pelo seu link, você ganha dinheiro de verdade — direto na sua conta. Quanto mais você indica, mais você fatura. Sua bio link pode virar uma fonte de renda passiva.' },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <div className="text-center">
          <span className="inline-block bg-black text-white px-3 py-1 text-xs font-bold">FAQ</span>
          <h2 className="font-display text-4xl md:text-5xl mt-4">Perguntas frequentes</h2>
        </div>
        <div className="mt-10 flex flex-col gap-4">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={`brutal-border brutal-shadow transition-colors ${isOpen ? 'bg-bioyellow' : 'bg-white'}`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left font-bold"
                >
                  <span>{f.q}</span>
                  <span className="w-8 h-8 bg-white brutal-border flex items-center justify-center shrink-0">
                    {isOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm border-t-2 border-black pt-3">{f.a}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
