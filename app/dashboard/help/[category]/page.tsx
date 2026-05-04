'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import { fetchHelpCategories, fetchHelpCategoryBySlug, fetchHelpArticles, HelpCategory, HelpArticle } from '@/lib/help';
import { HelpIcon } from '@/components/help/HelpIcon';

export default function HelpCategoryPage() {
  const params = useParams<{ category: string }>();
  const router = useRouter();
  const slug = params?.category;
  const [category, setCategory] = useState<HelpCategory | null>(null);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [allCategories, setAllCategories] = useState<HelpCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const [cat, cats] = await Promise.all([fetchHelpCategoryBySlug(slug), fetchHelpCategories()]);
      if (!cat) { setNotFound(true); setLoading(false); return; }
      setCategory(cat);
      setAllCategories(cats);
      const arts = await fetchHelpArticles(cat.id);
      setArticles(arts);
      setLoading(false);
    })();
  }, [slug]);

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto bg-white brutal-border p-8">
        <h1 className="font-display text-2xl">Categoria nao encontrada</h1>
        <button onClick={() => router.push('/dashboard/help')} className="brutal-btn bg-bioyellow mt-4 px-4 py-2 font-bold">
          Voltar para Central de Ajuda
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_260px] gap-6">
      <div>
        <nav className="text-xs font-bold mb-4 flex items-center gap-1 text-black/70">
          <Link href="/dashboard/help" className="hover:underline">Central de Ajuda</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-black">{category?.title || '...'}</span>
        </nav>

        <div className="bg-white brutal-border brutal-shadow p-6 md:p-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 bg-biolime brutal-border flex items-center justify-center">
              {category && <HelpIcon name={category.icon} className="w-5 h-5" />}
            </span>
            <h1 className="font-display text-3xl">{category?.title || '...'}</h1>
          </div>
          <p className="text-black/70">{category?.description}</p>
        </div>

        <h2 className="font-display text-xl mt-8 mb-3">Artigos</h2>
        {loading ? (
          <div className="flex flex-col gap-3">
            {[0,1,2].map((i) => <div key={i} className="brutal-border bg-white h-20 animate-pulse" />)}
          </div>
        ) : articles.length === 0 ? (
          <div className="brutal-border bg-white p-6 text-sm text-black/70">
            Sem artigos nesta categoria ainda.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {articles.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/dashboard/help/${slug}/${a.slug}`}
                  className="block brutal-border bg-white p-5 hover:bg-bioyellow/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-display text-lg">{a.title}</div>
                      <div className="text-sm text-black/70 mt-1">{a.summary}</div>
                    </div>
                    <ArrowRight className="w-5 h-5 shrink-0" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/dashboard/help"
          className="inline-flex items-center gap-2 mt-8 text-sm font-bold hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
      </div>

      <aside className="hidden lg:block">
        <div className="brutal-border bg-white p-4 sticky top-6">
          <div className="font-bold text-sm mb-3">Outras categorias</div>
          <ul className="flex flex-col gap-1">
            {allCategories.filter((c) => c.slug !== slug).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/dashboard/help/${c.slug}`}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-biolime/30 rounded-sm"
                >
                  <HelpIcon name={c.icon} className="w-4 h-4" /> {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
