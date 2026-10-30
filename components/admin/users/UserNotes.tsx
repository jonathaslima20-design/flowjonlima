'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Tag, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Note = { id: string; body: string; created_at: string; author_id: string | null };

export const SUGGESTED_TAGS = ['vip', 'parceiro', 'influenciador', 'problema de pagamento', 'suporte frequente', 'risco de cancelar'];

// Etiquetas da conta (Admin → Usuários → detalhes); só admins veem
export function UserTags({ profileId }: { profileId: string }) {
  const [tags, setTags] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    supabase.from('admin_user_tags').select('tag').eq('profile_id', profileId).order('created_at')
      .then(({ data }) => setTags((data ?? []).map(r => r.tag)));
  }, [profileId]);

  async function add(raw: string) {
    const tag = raw.trim().toLowerCase().slice(0, 30);
    if (!tag || tags.includes(tag)) { setInput(''); return; }
    setAdding(true);
    const { error } = await supabase.from('admin_user_tags').insert({ profile_id: profileId, tag });
    setAdding(false);
    if (!error) { setTags(t => [...t, tag]); setInput(''); }
  }

  async function remove(tag: string) {
    setTags(t => t.filter(x => x !== tag));
    await supabase.from('admin_user_tags').delete().eq('profile_id', profileId).eq('tag', tag);
  }

  const suggestions = SUGGESTED_TAGS.filter(t => !tags.includes(t));

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.length === 0 && <span className="text-xs text-gray-400">Sem etiquetas.</span>}
        {tags.map(t => (
          <span key={t} className="inline-flex items-center gap-1 bg-bioyellow brutal-border px-2 py-0.5 text-xs font-bold">
            <Tag className="w-3 h-3" /> {t}
            <button onClick={() => remove(t)} aria-label={`Remover ${t}`} className="hover:text-biored"><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <form onSubmit={e => { e.preventDefault(); add(input); }} className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          maxLength={30}
          placeholder="Nova etiqueta"
          className="brutal-input px-2 py-1 text-xs flex-1 min-w-0"
        />
        <button disabled={adding || !input.trim()} className="brutal-btn bg-white px-2 py-1 text-xs disabled:opacity-40">
          {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
        </button>
      </form>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {suggestions.map(t => (
            <button key={t} onClick={() => add(t)} className="text-[11px] px-1.5 py-0.5 border border-dashed border-gray-400 text-gray-500 hover:border-black hover:text-black">
              + {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Notas internas sobre a conta (histórico de atendimento, combinados etc.)
export function UserNotes({ profileId, adminNames }: { profileId: string; adminNames: Record<string, string> }) {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('admin_user_notes').select('id, body, created_at, author_id').eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setNotes(data ?? []));
  }, [profileId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSaving(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error: err } = await supabase
      .from('admin_user_notes')
      .insert({ profile_id: profileId, body: text, author_id: user?.id })
      .select('id, body, created_at, author_id')
      .single();
    setSaving(false);
    if (err || !data) { setError(err?.message ?? 'Não foi possível salvar.'); return; }
    setNotes(n => [data, ...(n ?? [])]);
    setBody('');
  }

  async function remove(id: string) {
    if (!confirm('Apagar esta nota?')) return;
    setNotes(n => (n ?? []).filter(x => x.id !== id));
    await supabase.from('admin_user_notes').delete().eq('id', id);
  }

  return (
    <div>
      <form onSubmit={add} className="mb-5">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          maxLength={4000}
          rows={3}
          placeholder="Escreva uma nota interna (só admins veem). Ex.: pediu reembolso, combinado desconto na renovação…"
          className="brutal-input w-full px-3 py-2 text-sm mb-2"
        />
        {error && <p className="text-sm text-biored font-bold mb-2">{error}</p>}
        <button disabled={saving || !body.trim()} className="brutal-btn bg-black text-white px-4 py-2 text-sm disabled:opacity-40">
          {saving ? 'Salvando...' : 'Adicionar nota'}
        </button>
      </form>

      {notes === null ? (
        <p className="text-sm text-gray-400 animate-pulse">Carregando...</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-gray-400">Nenhuma nota ainda.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map(n => (
            <li key={n.id} className="brutal-border bg-white p-3">
              <p className="text-sm whitespace-pre-wrap break-words">{n.body}</p>
              <div className="flex items-center justify-between mt-2 text-[11px] text-gray-500">
                <span>
                  {n.author_id && adminNames[n.author_id] ? `@${adminNames[n.author_id]} · ` : ''}
                  {new Date(n.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
                <button onClick={() => remove(n.id)} aria-label="Apagar nota" className="hover:text-biored">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
