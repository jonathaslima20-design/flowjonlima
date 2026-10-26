import { Quote, UserRound } from 'lucide-react';
import type { LandingTestimonial } from '@/lib/landing-content';

// Depoimentos cadastrados em Admin → Depoimentos; sem nenhum ativo, a seção não aparece
export function Testimonials({ items }: { items: LandingTestimonial[] }) {
  if (items.length === 0) return null;

  return (
    <section id="depoimentos" className="py-24 bg-white border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="max-w-2xl">
          <span className="inline-block bg-black text-white px-3 py-1 text-xs font-bold">DEPOIMENTOS</span>
          <h2 className="font-display text-4xl md:text-5xl mt-4">Quem usa, recomenda.</h2>
        </div>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(t => (
            <figure key={t.id} className="brutal-card p-6 bg-white flex flex-col">
              <Quote className="w-8 h-8 text-bioblue" />
              <blockquote className="mt-4 text-base leading-relaxed flex-1">{t.quote}</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="w-11 h-11 brutal-border bg-bioyellow overflow-hidden flex items-center justify-center shrink-0">
                  {t.avatar_url ? <img src={t.avatar_url} alt="" className="w-full h-full object-cover" /> : <UserRound className="w-5 h-5" />}
                </span>
                <span className="min-w-0">
                  <span className="block font-bold truncate">{t.name}</span>
                  {t.role && <span className="block text-xs text-black/60 truncate">{t.role}</span>}
                  {t.page_url && (
                    <a href={t.page_url} target="_blank" rel="noopener noreferrer" className="block text-xs text-bioblue underline truncate">
                      {t.page_url.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
