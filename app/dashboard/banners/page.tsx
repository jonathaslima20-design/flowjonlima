'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GripVertical, Plus, Trash2, Upload, Image as ImageIcon, Info } from 'lucide-react';
import { usePlan } from '@/hooks/use-plan';
import { LimitBadge, UpgradeBanner } from '@/components/dashboard/LimitBadge';
import { isUnlimited } from '@/lib/plans';

type Banner = {
  id: string;
  image_url: string;
  link_url: string;
  size: 'sm' | 'md' | 'lg';
  position: number;
  is_active: boolean;
};

const SIZES: Array<{ value: Banner['size']; label: string; hint: string; dims: string }> = [
  { value: 'sm', label: 'Pequeno', hint: 'Faixa fina, ideal para separadores ou logos.',   dims: 'proporção 6:1' },
  { value: 'md', label: 'Médio',   hint: 'Tamanho padrão, bom para banners promocionais.', dims: 'proporção 3:1' },
  { value: 'lg', label: 'Grande',  hint: 'Destaque máximo, ideal para hero banners.',      dims: 'proporção 5:2' },
];

const PREVIEW_HEIGHT: Record<Banner['size'], string> = {
  sm: 'aspect-[6/1]',
  md: 'aspect-[3/1]',
  lg: 'aspect-[5/2]',
};

export default function BannersPage() {
  const [profileId, setProfileId] = useState('');
  const [banners, setBanners] = useState<Banner[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const { limitOf, reload: reloadPlan } = usePlan();
  const limit = limitOf('banners');
  const atLimit = !isUnlimited(limit) && banners.length >= limit;

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setProfileId(u.user.id);
      const { data } = await supabase.from('banners').select('*').eq('profile_id', u.user.id).order('position');
      setBanners((data as Banner[]) ?? []);
    })();
  }, []);

  async function addBanner() {
    if (atLimit) return;
    const { data } = await supabase.from('banners').insert({
      profile_id: profileId, image_url: '', link_url: '', size: 'md', position: banners.length,
    }).select().single();
    if (data) {
      setBanners([...banners, data as Banner]);
      reloadPlan();
    }
  }

  async function update(id: string, patch: Partial<Banner>) {
    setBanners(banners.map(b => b.id === id ? { ...b, ...patch } : b));
    await supabase.from('banners').update(patch).eq('id', id);
  }

  async function onFile(id: string, file: File) {
    if (!file.type.startsWith('image/')) return alert('Envie um arquivo de imagem.');
    if (file.size > 3 * 1024 * 1024) return alert('Máximo 3MB.');
    setUploading(id);
    const ext = file.name.split('.').pop() || 'png';
    const path = `${profileId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('banners').upload(path, file, { upsert: false, contentType: file.type });
    if (error) { setUploading(null); alert('Falha no upload: ' + error.message); return; }
    const { data: pub } = supabase.storage.from('banners').getPublicUrl(path);
    const current = banners.find(b => b.id === id);
    if (current?.image_url) {
      const oldPath = extractPath(current.image_url);
      if (oldPath) await supabase.storage.from('banners').remove([oldPath]);
    }
    await update(id, { image_url: pub.publicUrl });
    setUploading(null);
  }

  function extractPath(url: string): string | null {
    const m = url.match(/\/storage\/v1\/object\/public\/banners\/(.+)$/);
    return m ? m[1] : null;
  }

  async function remove(id: string) {
    const b = banners.find(x => x.id === id);
    setBanners(banners.filter(x => x.id !== id));
    if (b?.image_url) {
      const p = extractPath(b.image_url);
      if (p) await supabase.storage.from('banners').remove([p]);
    }
    await supabase.from('banners').delete().eq('id', id);
  }

  async function onDrop(targetId: string) {
    if (!dragging || dragging === targetId) return;
    const ids = banners.map(b => b.id);
    const from = ids.indexOf(dragging);
    const to = ids.indexOf(targetId);
    const reordered = [...banners];
    const [m] = reordered.splice(from, 1);
    reordered.splice(to, 0, m);
    const updated = reordered.map((b, i) => ({ ...b, position: i }));
    setBanners(updated);
    setDragging(null);
    await Promise.all(updated.map(b => supabase.from('banners').update({ position: b.position }).eq('id', b.id)));
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl">Banners</h1>
            <LimitBadge current={banners.length} limit={limit} />
          </div>
          <p className="text-sm font-bold text-black/60 mt-1">Faça upload de imagens, defina destino e tamanho.</p>
        </div>
        <button onClick={addBanner} disabled={atLimit} title={atLimit ? 'Limite do plano Free atingido' : ''} className="brutal-btn bg-bioyellow px-4 py-2 gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          <Plus className="w-4 h-4" /> Novo banner
        </button>
      </div>

      {atLimit && <div className="mb-4"><UpgradeBanner resource="banners" /></div>}

      <div className="flex flex-col gap-4">
        {banners.length === 0 && (
          <div className="brutal-card p-8 text-center">
            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
            <p className="font-bold">Nenhum banner ainda.</p>
          </div>
        )}
        {banners.map(b => {
          const sizeInfo = SIZES.find(s => s.value === b.size) ?? SIZES[1];
          const previewHeight = PREVIEW_HEIGHT[b.size] ?? PREVIEW_HEIGHT.md;
          return (
            <div
              key={b.id}
              draggable
              onDragStart={() => setDragging(b.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(b.id)}
              className="brutal-card p-4"
            >
              <div className="flex items-start gap-3">
                <GripVertical className="w-5 h-5 mt-3 cursor-grab text-black/60" />
                <div className="flex-1 flex flex-col gap-2">
                  {b.image_url ? (
                    <div className={`brutal-border overflow-hidden transition-all duration-200 ${previewHeight}`}>
                      <img src={b.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className={`brutal-border flex items-center justify-center bg-white transition-all duration-200 ${previewHeight}`}>
                      <span className="text-xs font-bold text-black/50">Sem imagem</span>
                    </div>
                  )}
                  <input
                    ref={el => (fileInputs.current[b.id] = el)}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) onFile(b.id, f); }}
                  />
                  <button
                    onClick={() => fileInputs.current[b.id]?.click()}
                    disabled={uploading === b.id}
                    className="brutal-btn bg-white px-3 py-2 text-sm gap-2 disabled:opacity-60"
                  >
                    <Upload className="w-4 h-4" /> {uploading === b.id ? 'Enviando...' : b.image_url ? 'Trocar imagem' : 'Enviar imagem'}
                  </button>
                  <input
                    value={b.link_url}
                    onChange={e => update(b.id, { link_url: e.target.value })}
                    className="brutal-input px-3 py-2 text-sm"
                    placeholder="Link de destino (opcional)"
                  />
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex gap-1">
                        {SIZES.map(s => (
                          <button
                            key={s.value}
                            onClick={() => update(b.id, { size: s.value })}
                            className={`brutal-border px-3 py-1 text-xs font-bold ${b.size === s.value ? 'bg-bioblue text-white' : 'bg-white'}`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                      <label className="flex items-center gap-2 text-xs font-bold">
                        <input type="checkbox" checked={b.is_active} onChange={e => update(b.id, { is_active: e.target.checked })} />
                        Ativo
                      </label>
                    </div>
                    <div className="flex items-start gap-2 bg-black/5 brutal-border px-3 py-2">
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-black/50" />
                      <p className="text-xs text-black/60 leading-snug">
                        <span className="font-bold text-black/80">{sizeInfo.label} — {sizeInfo.dims}.</span>{' '}
                        {sizeInfo.hint}
                      </p>
                    </div>
                  </div>
                </div>
                <button onClick={() => remove(b.id)} className="brutal-btn bg-white w-9 h-9">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
