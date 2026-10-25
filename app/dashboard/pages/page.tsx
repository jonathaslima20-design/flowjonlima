'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Layers, Lock, LogOut, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useCurrentPage } from '@/lib/page-context';
import { usePlan } from '@/hooks/use-plan';
import { useUpgradeModal } from '@/components/dashboard/UpgradeModal';
import { PLANS } from '@/lib/plans';
import { PageTeam } from '@/components/dashboard/PageTeam';

const SITE_HOST = (process.env.NEXT_PUBLIC_SITE_URL || 'https://bioflowzy.com').replace(/^https?:\/\//, '').replace(/\/$/, '');

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
}

export default function PagesPage() {
  const router = useRouter();
  const { pages: allPages, pageId, accountId, setPageId, reloadPages } = useCurrentPage();
  const { accountPlan: plan, loading } = usePlan();
  const { open: openUpgrade } = useUpgradeModal();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  // O endereço acompanha o nome até a pessoa editá-lo
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [creating, setCreating] = useState(false);
  const [teamOpen, setTeamOpen] = useState<string | null>(null);

  const pages = allPages.filter(p => !p.shared);
  const sharedPages = allPages.filter(p => p.shared);
  const teamPlan = plan.limits.members !== 0;

  const limit = plan.limits.pages;
  const unlimited = limit < 0;
  const canCreate = unlimited || pages.length < limit;
  const multiPagePlan = unlimited || limit > 1;

  function edit(id: string) {
    setPageId(id);
    router.push('/dashboard');
  }

  async function create() {
    setCreating(true);
    const { data, error } = await supabase.rpc('create_page', { p_username: username, p_display_name: name });
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Página criada! Agora é só montar o conteúdo dela.');
    setUsername('');
    setName('');
    setUsernameTouched(false);
    await reloadPages();
    if (data) edit(data as string);
  }

  async function remove(id: string, handle: string) {
    if (!confirm(`Excluir a página /${handle}? Links, banners, vídeos, redes, estatísticas e contatos dela serão apagados.`)) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Página excluída.');
    if (pageId === id && accountId) setPageId(accountId);
    await reloadPages();
  }

  async function leave(id: string, handle: string) {
    if (!confirm(`Sair da página /${handle}? Você perde o acesso de edição.`)) return;
    const { error } = await supabase.from('page_members').delete().eq('page_id', id).eq('user_id', accountId!);
    if (error) { toast.error(error.message); return; }
    toast.success('Você saiu da página.');
    if (pageId === id && accountId) setPageId(accountId);
    await reloadPages();
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="font-display text-4xl">Páginas</h1>
        <p className="text-sm mt-1 text-black/70">
          Tenha uma página para cada negócio, marca ou campanha, cada uma com links, tema, analytics e contatos próprios.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        {pages.map(p => (
          <div key={p.id} className={`brutal-card p-4 flex items-center gap-4 flex-wrap ${p.id === pageId ? 'bg-bioyellow/40' : ''}`}>
            <div className="w-11 h-11 brutal-border bg-white overflow-hidden flex items-center justify-center shrink-0">
              {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : <Layers className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-[160px]">
              <p className="font-bold">
                {p.display_name || p.username}
                {!p.owner_id && <span className="ml-2 text-[10px] uppercase tracking-wide bg-black text-white px-2 py-0.5">Principal</span>}
                {p.id === pageId && <span className="ml-2 text-[10px] uppercase tracking-wide bg-white brutal-border px-2 py-0.5">Editando</span>}
              </p>
              <p className="text-xs text-black/60">{SITE_HOST}/{p.username}</p>
            </div>
            <div className="flex gap-2">
              <a href={`/${p.username}`} target="_blank" rel="noreferrer" className="brutal-btn bg-white px-3 py-2 text-xs gap-1">
                <ExternalLink className="w-3 h-3" /> Ver
              </a>
              <button onClick={() => edit(p.id)} className="brutal-btn bg-white px-3 py-2 text-xs gap-1">
                <Pencil className="w-3 h-3" /> Editar
              </button>
              {teamPlan && (
                <button onClick={() => setTeamOpen(teamOpen === p.id ? null : p.id)} className={`brutal-btn px-3 py-2 text-xs gap-1 ${teamOpen === p.id ? 'bg-black text-white' : 'bg-white'}`}>
                  <Users className="w-3 h-3" /> Equipe
                </button>
              )}
              {p.owner_id && (
                <button onClick={() => remove(p.id, p.username)} className="brutal-btn bg-white px-3 py-2 text-xs gap-1" aria-label={`Excluir /${p.username}`}>
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            {teamOpen === p.id && <PageTeam pageId={p.id} />}
          </div>
        ))}
        {!loading && (
          <p className="text-xs text-black/60">
            {unlimited ? `${pages.length} página(s)` : `${pages.length} de ${limit} página(s) do seu plano`}
          </p>
        )}
      </section>

      {sharedPages.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl">Compartilhadas com você</h2>
          {sharedPages.map(p => (
            <div key={p.id} className={`brutal-card p-4 flex items-center gap-4 flex-wrap ${p.id === pageId ? 'bg-bioyellow/40' : ''}`}>
              <div className="w-11 h-11 brutal-border bg-white overflow-hidden flex items-center justify-center shrink-0">
                {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : <Layers className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-[160px]">
                <p className="font-bold">
                  {p.display_name || p.username}
                  {p.id === pageId && <span className="ml-2 text-[10px] uppercase tracking-wide bg-white brutal-border px-2 py-0.5">Editando</span>}
                </p>
                <p className="text-xs text-black/60">{SITE_HOST}/{p.username}</p>
              </div>
              <div className="flex gap-2">
                <a href={`/${p.username}`} target="_blank" rel="noreferrer" className="brutal-btn bg-white px-3 py-2 text-xs gap-1">
                  <ExternalLink className="w-3 h-3" /> Ver
                </a>
                <button onClick={() => edit(p.id)} className="brutal-btn bg-white px-3 py-2 text-xs gap-1">
                  <Pencil className="w-3 h-3" /> Editar
                </button>
                <button onClick={() => leave(p.id, p.username)} className="brutal-btn bg-white px-3 py-2 text-xs gap-1">
                  <LogOut className="w-3 h-3" /> Sair
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {!loading && multiPagePlan && (
        <section className="brutal-card p-5">
          <h2 className="font-display text-xl mb-3">Nova página</h2>
          {canCreate ? (
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold flex flex-col gap-1">
                Nome da página
                <input
                  value={name}
                  onChange={e => { setName(e.target.value); if (!usernameTouched) setUsername(slugify(e.target.value)); }}
                  placeholder="Minha loja de verão"
                  maxLength={60}
                  className="brutal-input px-3 py-2 font-normal"
                />
              </label>
              <label className="text-xs font-bold flex flex-col gap-1">
                Endereço
                <div className="flex items-center brutal-border bg-white">
                  <span className="px-3 text-sm text-black/50 font-normal shrink-0">{SITE_HOST}/</span>
                  <input
                    value={username}
                    onChange={e => { setUsernameTouched(true); setUsername(slugify(e.target.value)); }}
                    placeholder="minhaloja-verao"
                    className="flex-1 min-w-0 px-2 py-2 font-normal outline-none"
                  />
                </div>
              </label>
              <button onClick={create} disabled={creating || username.length < 2} className="brutal-btn bg-bioyellow py-3 gap-2 disabled:opacity-50">
                <Plus className="w-4 h-4" /> {creating ? 'Criando...' : 'Criar página'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-black/70">Você já usa todas as páginas do seu plano. Exclua uma página para criar outra.</p>
          )}
        </section>
      )}

      {!loading && !multiPagePlan && (
        <section className="brutal-card p-6 bg-biolime flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Lock className="w-8 h-8 shrink-0" />
          <div className="flex-1">
            <h2 className="font-display text-xl">Várias páginas na mesma conta</h2>
            <p className="text-sm text-black/70 mt-1">
              Com o plano Business você cria até {PLANS.business.limits.pages} páginas e dá acesso de edição a até {PLANS.business.limits.members} pessoas, ideal para quem tem mais de um negócio ou cuida de clientes.
            </p>
          </div>
          {PLANS.business.available ? (
            <button onClick={openUpgrade} className="brutal-btn bg-black text-white px-4 py-2 text-xs">Conhecer o Business</button>
          ) : (
            <span className="brutal-border bg-white px-3 py-2 text-xs font-bold">Business em breve</span>
          )}
        </section>
      )}
    </div>
  );
}
