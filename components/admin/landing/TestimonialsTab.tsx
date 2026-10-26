'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MediaUploader } from '@/components/admin/MediaUploader';
import { Field } from '@/components/admin/DemoPageEditor';
import { fetchTestimonials, type LandingTestimonial } from '@/lib/landing-content';
import { toSafeUrl } from '@/lib/url';

export function TestimonialsTab() {
  const [items, setItems] = useState<LandingTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    (async () => {
      setItems(await fetchTestimonials(true));
      setLoading(false);
    })();
  }, []);

  function flashToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  }

  function patch(id: string, p: Partial<LandingTestimonial>) {
    setItems(list => list.map(t => (t.id === id ? { ...t, ...p } : t)));
  }

  async function add() {
    const { data, error } = await supabase.from('landing_testimonials').insert({
      name: 'Nome do cliente',
      quote: 'Escreva aqui o depoimento.',
      position: items.length ? Math.max(...items.map(t => t.position)) + 1 : 0,
      is_active: false,
    }).select('*').single();
    if (error || !data) { flashToast('Erro: ' + (error?.message ?? 'não foi possível criar')); return; }
    setItems(list => [...list, data as LandingTestimonial]);
    flashToast('Depoimento criado (oculto até você ativar)');
  }

  async function save(t: LandingTestimonial) {
    const pageUrl = t.page_url?.trim() ? toSafeUrl(t.page_url) : null;
    if (t.page_url?.trim() && !pageUrl) { flashToast('Link da página inválido'); return; }
    setSavingId(t.id);
    const { error } = await supabase.from('landing_testimonials').update({
      name: t.name.trim(),
      role: t.role.trim(),
      quote: t.quote.trim(),
      avatar_url: t.avatar_url?.trim() || null,
      page_url: pageUrl,
      is_active: t.is_active,
    }).eq('id', t.id);
    setSavingId(null);
    if (error) { flashToast('Erro: ' + error.message); return; }
    patch(t.id, { page_url: pageUrl });
    flashToast('Depoimento salvo');
  }

  async function toggle(t: LandingTestimonial) {
    const { error } = await supabase.from('landing_testimonials').update({ is_active: !t.is_active }).eq('id', t.id);
    if (error) { flashToast('Erro: ' + error.message); return; }
    patch(t.id, { is_active: !t.is_active });
  }

  async function remove(t: LandingTestimonial) {
    if (!confirm(`Excluir o depoimento de ${t.name}?`)) return;
    const { error } = await supabase.from('landing_testimonials').delete().eq('id', t.id);
    if (error) { flashToast('Erro: ' + error.message); return; }
    setItems(list => list.filter(x => x.id !== t.id));
  }

  async function move(t: LandingTestimonial, dir: -1 | 1) {
    const idx = items.findIndex(x => x.id === t.id);
    const other = items[idx + dir];
    if (!other) return;
    const next = [...items];
    next[idx] = { ...other, position: t.position };
    next[idx + dir] = { ...t, position: other.position };
    setItems(next);
    await Promise.all([
      supabase.from('landing_testimonials').update({ position: other.position }).eq('id', t.id),
      supabase.from('landing_testimonials').update({ position: t.position }).eq('id', other.id),
    ]);
  }

  if (loading) return <div className="p-6 font-bold">Carregando depoimentos...</div>;

  const activeCount = items.filter(t => t.is_active).length;

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl">Depoimentos</h2>
          <p className="text-sm text-black/70 mt-1 max-w-2xl">
            Aparecem na página inicial. Use apenas depoimentos reais e com autorização. Sem nenhum ativo, a seção fica escondida.
          </p>
        </div>
        <button onClick={add} className="brutal-btn bg-bioyellow px-4 py-2 font-bold text-sm gap-2">
          <Plus className="w-4 h-4" /> Novo depoimento
        </button>
      </div>

      {toast && <div className="mb-4 inline-block brutal-card px-4 py-2 bg-biolime font-bold">{toast}</div>}

      <p className="text-xs font-bold mb-3">{activeCount} ativo(s) de {items.length}</p>

      <div className="flex flex-col gap-4">
        {items.length === 0 && <div className="brutal-card p-6 text-sm">Nenhum depoimento cadastrado ainda.</div>}
        {items.map((t, i) => (
          <div key={t.id} className={`brutal-card p-4 ${t.is_active ? 'bg-white' : 'bg-neutral-100'}`}>
            <div className="flex items-center justify-end gap-1 mb-2">
              {!t.is_active && <span className="mr-auto text-[10px] font-bold uppercase text-black/50">Oculto</span>}
              <button onClick={() => move(t, -1)} disabled={i === 0} aria-label="Subir" className="p-1 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
              <button onClick={() => move(t, 1)} disabled={i === items.length - 1} aria-label="Descer" className="p-1 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
              <button onClick={() => toggle(t)} aria-label={t.is_active ? 'Ocultar' : 'Mostrar'} className="p-1">
                {t.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button onClick={() => remove(t)} aria-label="Excluir" className="p-1 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="grid sm:grid-cols-[auto_1fr] gap-4">
              <MediaUploader
                kind="image"
                value={t.avatar_url ?? undefined}
                pathPrefix="testimonials/avatar"
                onUploaded={url => patch(t.id, { avatar_url: url })}
                onRemove={() => patch(t.id, { avatar_url: null })}
              />
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Nome">
                  <input value={t.name} maxLength={60} onChange={e => patch(t.id, { name: e.target.value })} className="brutal-input py-2 px-3 text-sm w-full" />
                </Field>
                <Field label="Profissão / negócio">
                  <input value={t.role} maxLength={80} placeholder="Dona da Loja X" onChange={e => patch(t.id, { role: e.target.value })} className="brutal-input py-2 px-3 text-sm w-full" />
                </Field>
                <Field label="Depoimento" full>
                  <textarea value={t.quote} maxLength={400} rows={3} onChange={e => patch(t.id, { quote: e.target.value })} className="brutal-input py-2 px-3 text-sm w-full font-normal resize-y" />
                </Field>
                <Field label="Link da página (opcional)" full>
                  <input value={t.page_url ?? ''} placeholder="https://bioflowzy.com/cliente" onChange={e => patch(t.id, { page_url: e.target.value })} className="brutal-input py-2 px-3 text-sm w-full" />
                </Field>
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <button onClick={() => save(t)} disabled={savingId === t.id} className="brutal-btn bg-black text-white px-4 py-2 text-xs gap-2 disabled:opacity-60">
                <Save className="w-3 h-3" /> {savingId === t.id ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
