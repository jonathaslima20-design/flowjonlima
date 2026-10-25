'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, Link2, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://bioflowzy.com').replace(/\/$/, '');

type Member = {
  id: string;
  created_at: string;
  member: { username: string; display_name: string | null; avatar_url: string | null } | null;
};
type Invite = { id: string; token: string; expires_at: string };

const inviteUrl = (token: string) => `${SITE_URL}/convite/${token}`;

// Pessoas com acesso de edição a uma página e convites pendentes (só o dono vê)
export function PageTeam({ pageId }: { pageId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const [{ data: m }, { data: i }] = await Promise.all([
      supabase
        .from('page_members')
        .select('id, created_at, member:profiles!page_members_user_id_fkey(username, display_name, avatar_url)')
        .eq('page_id', pageId)
        .order('created_at'),
      supabase
        .from('page_invites')
        .select('id, token, expires_at')
        .eq('page_id', pageId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at'),
    ]);
    setMembers((m ?? []) as unknown as Member[]);
    setInvites((i ?? []) as Invite[]);
    setLoading(false);
  }, [pageId]);

  useEffect(() => { void load(); }, [load]);

  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(inviteUrl(token));
      toast.success('Link copiado! Envie para a pessoa por WhatsApp ou e-mail.');
    } catch {
      toast.error('Não foi possível copiar. Selecione o link e copie manualmente.');
    }
  }

  async function createInvite() {
    setCreating(true);
    const { data, error } = await supabase.rpc('create_page_invite', { p_page_id: pageId });
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    await load();
    if (data) await copy(data as string);
  }

  async function removeMember(m: Member) {
    if (!confirm(`Remover o acesso de @${m.member?.username ?? 'usuário'} a esta página?`)) return;
    const { error } = await supabase.from('page_members').delete().eq('id', m.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Acesso removido.');
    await load();
  }

  async function revokeInvite(inv: Invite) {
    const { error } = await supabase.from('page_invites').delete().eq('id', inv.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Convite cancelado.');
    await load();
  }

  if (loading) return <p className="text-xs text-black/60">Carregando equipe...</p>;

  return (
    <div className="flex flex-col gap-3 border-t-2 border-black/10 pt-3 mt-1 w-full">
      <p className="text-xs text-black/70">
        Quem tiver acesso edita links, aparência e vê analytics e contatos desta página. Plano, pagamento, domínio e exclusão continuam só com você.
      </p>

      {members.length === 0 && invites.length === 0 && (
        <p className="text-xs font-bold text-black/50">Ninguém além de você tem acesso.</p>
      )}

      {members.map(m => (
        <div key={m.id} className="flex items-center gap-3">
          <span className="w-8 h-8 brutal-border bg-white overflow-hidden flex items-center justify-center shrink-0">
            {m.member?.avatar_url ? <img src={m.member.avatar_url} alt="" className="w-full h-full object-cover" /> : <UserRound className="w-4 h-4" />}
          </span>
          <span className="flex-1 text-sm">
            <b>{m.member?.display_name || m.member?.username}</b>{' '}
            <span className="text-black/50">@{m.member?.username}</span>
          </span>
          <button onClick={() => removeMember(m)} className="brutal-btn bg-white px-2 py-1 text-[10px] gap-1">
            <Trash2 className="w-3 h-3" /> Remover
          </button>
        </div>
      ))}

      {invites.map(inv => (
        <div key={inv.id} className="flex items-center gap-3 flex-wrap">
          <span className="w-8 h-8 brutal-border bg-neutral-100 flex items-center justify-center shrink-0">
            <Link2 className="w-4 h-4" />
          </span>
          <span className="flex-1 text-xs min-w-[160px]">
            Convite pendente · expira em {new Date(inv.expires_at).toLocaleDateString('pt-BR')}
          </span>
          <button onClick={() => copy(inv.token)} className="brutal-btn bg-white px-2 py-1 text-[10px] gap-1">
            <Copy className="w-3 h-3" /> Copiar link
          </button>
          <button onClick={() => revokeInvite(inv)} className="brutal-btn bg-white px-2 py-1 text-[10px] gap-1">
            <Trash2 className="w-3 h-3" /> Cancelar
          </button>
        </div>
      ))}

      <button onClick={createInvite} disabled={creating} className="brutal-btn bg-bioyellow px-3 py-2 text-xs gap-2 self-start disabled:opacity-50">
        <Link2 className="w-3 h-3" /> {creating ? 'Gerando...' : 'Gerar link de convite'}
      </button>
    </div>
  );
}
