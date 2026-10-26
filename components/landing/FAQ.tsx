'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { FAQS } from './faq-data';

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
          {FAQS.map((f, i) => {
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
