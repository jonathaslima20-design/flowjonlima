'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import {
  fetchHelpArticle, fetchHelpArticles, fetchHelpCategoryBySlug,
  HelpArticle, HelpCategory,
} from '@/lib/help';
import { HelpIcon } from '@/components/help/HelpIcon';

function renderBody(body: string) {
  const lines = body.split('\n');
  const blocks: JSX.Element[] = [];
  let listBuffer: string[] = [];
  let numberedBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="list-disc pl-5 my-3 space-y-1 text-[15px]">
          {listBuffer.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      );
      listBuffer = [];
    }
  };
  const flushNumbered = () => {
    if (numberedBuffer.length) {
      blocks.push(
        <ol key={`ol-${blocks.length}`} className="list-decimal pl-5 my-3 space-y-1 text-[15px]">
          {numberedBuffer.map((l, i) => <li key={i}>{l}</li>)}
        </ol>
      );
      numberedBuffer = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushList(); flushNumbered(); continue; }
    if (/^\s*-\s+/.test(line)) { flushNumbered(); listBuffer.push(line.replace(/^\s*-\s+/, '')); continue; }
    const numMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);
    if (numMatch) { flushList(); numberedBuffer.push(numMatch[2]); continue; }
    flushList(); flushNumbered();
    blocks.push(<p key={`p-${blocks.length}`} className="my-3 text-[15px] leading-relaxed">{line}</p>);
  }
  flushList(); flushNumbered();
  return blocks;
}

export default function HelpArticlePage() {
  const params = useParams<{ category: string; article: string }>();
  const router = useRouter();
  const [category, setCategory] = useState<HelpCategory | null>(null);
  const [article, setArticle] = useState<HelpArticle | null>(null);
  const [related, setRelated] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!params?.category || !params?.article) return;
    (async () => {
      setLoading(true);
      const cat = await fetchHelpCategoryBySlug(params.category);
      if (!cat) { setNotFound(true); setLoading(false); return; }
      setCategory(cat);
      const art = await fetchHelpArticle(cat.id, params.article);
      if (!art) { setNotFound(true); setLoading(false); return; }
      setArticle(art);
      const all = await fetchHelpArticles(cat.id);
      setRelated(all.filter((a) => a.id !== art.id).slice(0, 5));
      setLoading(false);
    })();
  }, [params?.category, params?.article]);

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto bg-white brutal-border p-8">
        <h1 className="font-display text-2xl">Artigo nao encontrado</h1>
        <button onClick={() => router.push('/dashboard/help')} className="brutal-btn bg-bioyellow mt-4 px-4 py-2 font-bold">
          Voltar para Central de Ajuda
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <nav className="text-xs font-bold mb-4 flex items-center gap-1 text-black/70">
        <Link href="/dashboard/help" className="hover:underline">Central de Ajuda</Link>
        <ChevronRight className="w-3 h-3" />
        {category && (
          <Link href={`/dashboard/help/${category.slug}`} className="hover:underline">{category.title}</Link>
        )}
        <ChevronRight className="w-3 h-3" />
        <span className="text-black truncate max-w-[40ch]">{article?.title || '...'}</span>
      </nav>

      <article className="bg-white brutal-border brutal-shadow p-6 md:p-10">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-8 w-2/3 bg-neutral-200" />
            <div className="h-4 w-1/2 bg-neutral-200 mt-4" />
            <div className="h-4 w-full bg-neutral-200 mt-6" />
            <div className="h-4 w-full bg-neutral-200 mt-2" />
            <div className="h-4 w-5/6 bg-neutral-200 mt-2" />
          </div>
        ) : article ? (
          <>
            {category && (
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-black/60 mb-2">
                <HelpIcon name={category.icon} className="w-4 h-4" /> {category.title}
              </div>
            )}
            <h1 className="font-display text-3xl md:text-4xl">{article.title}</h1>
            {article.summary && (
              <p className="text-black/70 mt-3 text-lg">{article.summary}</p>
            )}
            <div className="mt-6">{renderBody(article.body)}</div>
          </>
        ) : null}
      </article>

      {related.length > 0 && category && (
        <div className="mt-8">
          <h2 className="font-display text-xl mb-3">Continue lendo</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {related.map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/help/${category.slug}/${a.slug}`}
                className="brutal-border bg-white p-4 hover:bg-bioyellow/20 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-display text-base">{a.title}</div>
                  <div className="text-xs text-black/70 mt-1">{a.summary}</div>
                </div>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <Link
        href={category ? `/dashboard/help/${category.slug}` : '/dashboard/help'}
        className="inline-flex items-center gap-2 mt-8 text-sm font-bold hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>
    </div>
  );
}
