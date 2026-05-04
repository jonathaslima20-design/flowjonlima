'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Search, LifeBuoy, ArrowRight } from 'lucide-react';
import { fetchHelpCategories, fetchHelpArticles, HelpCategory, HelpArticle, searchHelpArticles } from '@/lib/help';
import { HelpIcon } from '@/components/help/HelpIcon';
import { WhatsAppSupport } from '@/components/shared/WhatsAppSupport';

export default function HelpIndexPage() {
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HelpArticle[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [cats, arts] = await Promise.all([fetchHelpCategories(), fetchHelpArticles()]);
      setCategories(cats);
      setArticles(arts);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults(null); return; }
    const t = setTimeout(async () => {
      const r = await searchHelpArticles(q);
      setResults(r);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const articlesByCat = useMemo(() => {
    const m = new Map<string, HelpArticle[]>();
    for (const a of articles) {
      const arr = m.get(a.category_id) || [];
      arr.push(a);
      m.set(a.category_id, arr);
    }
    return m;
  }, [articles]);

  const catBySlug = useMemo(() => {
    const m = new Map<string, HelpCategory>();
    for (const c of categories) m.set(c.id, c);
    return m;
  }, [categories]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white brutal-border brutal-shadow p-6 md:p-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-10 h-10 bg-bioyellow brutal-border flex items-center justify-center">
            <LifeBuoy className="w-5 h-5" />
          </span>
          <h1 className="font-display text-3xl md:text-4xl">Central de Ajuda</h1>
        </div>
        <p className="text-black/70 max-w-2xl">
          Tutoriais, respostas rapidas e guias para voce aproveitar 100% da BioFlowzy.
        </p>

        <div className="mt-6 flex items-stretch brutal-border bg-white">
          <div className="px-3 flex items-center"><Search className="w-5 h-5" /></div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar: criar link, dominio, pixel, upgrade..."
            className="flex-1 min-w-0 px-2 py-3 outline-none text-sm"
          />
        </div>
      </div>

      {results && (
        <div className="mt-6 bg-white brutal-border p-6">
          <h2 className="font-display text-xl mb-4">Resultados para "{query}"</h2>
          {results.length === 0 ? (
            <p className="text-sm text-black/60">Nada encontrado. Tente outros termos.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {results.map((a) => {
                const cat = catBySlug.get(a.category_id);
                if (!cat) return null;
                return (
                  <li key={a.id}>
                    <Link
                      href={`/dashboard/help/${cat.slug}/${a.slug}`}
                      className="block brutal-border p-4 hover:bg-bioyellow/30 transition-colors"
                    >
                      <div className="text-xs font-bold uppercase text-black/60">{cat.title}</div>
                      <div className="font-display text-lg">{a.title}</div>
                      <div className="text-sm text-black/70 mt-1">{a.summary}</div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {!results && (
        <>
          <h2 className="font-display text-2xl mt-10 mb-4">Categorias</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0,1,2,3,4,5].map((i) => (
                <div key={i} className="brutal-border bg-white p-5 h-32 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((c) => {
                const count = articlesByCat.get(c.id)?.length || 0;
                return (
                  <Link
                    key={c.id}
                    href={`/dashboard/help/${c.slug}`}
                    className="brutal-border bg-white p-5 hover:brutal-shadow transition-all hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-9 h-9 bg-biolime brutal-border flex items-center justify-center">
                        <HelpIcon name={c.icon} className="w-4 h-4" />
                      </span>
                      <h3 className="font-display text-lg">{c.title}</h3>
                    </div>
                    <p className="text-sm text-black/70">{c.description}</p>
                    <div className="mt-3 text-xs font-bold flex items-center gap-1">
                      {count} {count === 1 ? 'artigo' : 'artigos'}
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <h2 className="font-display text-2xl mt-10 mb-4">Artigos em destaque</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.slice(0, 6).map((a) => {
              const cat = catBySlug.get(a.category_id);
              if (!cat) return null;
              return (
                <Link
                  key={a.id}
                  href={`/dashboard/help/${cat.slug}/${a.slug}`}
                  className="brutal-border bg-white p-5 hover:bg-bioyellow/20"
                >
                  <div className="text-xs font-bold uppercase text-black/60">{cat.title}</div>
                  <div className="font-display text-lg mt-1">{a.title}</div>
                  <div className="text-sm text-black/70 mt-1">{a.summary}</div>
                </Link>
              );
            })}
          </div>

          <div className="mt-10">
            <WhatsAppSupport />
          </div>
        </>
      )}
    </div>
  );
}
