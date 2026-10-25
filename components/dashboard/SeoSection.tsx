'use client';

import { useEffect, useRef, useState } from 'react';
import { Lock, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { usePlan } from '@/hooks/use-plan';
import { compressImage } from '@/lib/compress-image';
import { useUpgradeModal } from './UpgradeModal';

const TITLE_MAX = 70;
const DESCRIPTION_MAX = 200;

type Seo = { seo_title: string; seo_description: string; seo_image_url: string };

// Título, descrição e imagem que aparecem no Google e na prévia ao compartilhar o link
export function SeoSection({ profile }: { profile: { id: string; username: string; display_name: string | null; bio: string | null; avatar_url: string | null } & Partial<Record<keyof Seo, string | null>> }) {
  const { has } = usePlan();
  const { open: openUpgrade } = useUpgradeModal();
  const unlocked = has('seo');
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [seo, setSeo] = useState<Seo>({ seo_title: '', seo_description: '', seo_image_url: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setSeo({
      seo_title: profile.seo_title ?? '',
      seo_description: profile.seo_description ?? '',
      seo_image_url: profile.seo_image_url ?? '',
    });
  }, [profile.seo_title, profile.seo_description, profile.seo_image_url]);

  async function save(next: Seo = seo) {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      seo_title: next.seo_title.trim() || null,
      seo_description: next.seo_description.trim() || null,
      seo_image_url: next.seo_image_url || null,
    }).eq('id', profile.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success('SEO salvo');
  }

  async function onImage(original: File) {
    if (!original.type.startsWith('image/')) { toast.error('Envie um arquivo de imagem.'); return; }
    setUploading(true);
    const file = await compressImage(original, { maxSize: 1200 });
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${profile.id}/seo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: false, contentType: file.type });
    setUploading(false);
    if (error) { toast.error('Falha no upload: ' + error.message); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const next = { ...seo, seo_image_url: data.publicUrl };
    setSeo(next);
    await save(next);
  }

  const previewTitle = seo.seo_title || `${profile.display_name || profile.username} | BioFlowzy`;
  const previewDescription = seo.seo_description || profile.bio || `Confira os links de ${profile.display_name || profile.username} na BioFlowzy.`;
  const previewImage = seo.seo_image_url || profile.avatar_url;

  return (
    <section>
      <h2 className="font-display text-2xl mb-4">SEO e prévia de compartilhamento</h2>
      <div className="brutal-card p-6 relative">
        {!unlocked && (
          <div className="mb-4 bg-bioyellow brutal-border p-3 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs font-bold flex items-center gap-2">
              <Lock className="w-4 h-4" /> Personalize como sua página aparece no Google e no WhatsApp. Disponível no Pro.
            </p>
            <button onClick={openUpgrade} className="brutal-btn bg-black text-white px-3 py-1.5 text-xs">Ver planos</button>
          </div>
        )}

        <div className={`grid md:grid-cols-[1fr_280px] gap-6 ${unlocked ? '' : 'opacity-60 pointer-events-none select-none'}`}>
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold flex flex-col gap-1">
              Título
              <input
                value={seo.seo_title}
                maxLength={TITLE_MAX}
                onChange={e => setSeo(s => ({ ...s, seo_title: e.target.value }))}
                placeholder={`${profile.display_name || profile.username} | BioFlowzy`}
                className="brutal-input px-3 py-2 font-normal"
              />
              <span className="text-[11px] font-normal opacity-60">{seo.seo_title.length}/{TITLE_MAX}</span>
            </label>
            <label className="text-sm font-bold flex flex-col gap-1">
              Descrição
              <textarea
                value={seo.seo_description}
                maxLength={DESCRIPTION_MAX}
                onChange={e => setSeo(s => ({ ...s, seo_description: e.target.value }))}
                placeholder="Uma frase que convide a pessoa a clicar."
                className="brutal-input px-3 py-2 min-h-[80px] font-normal"
              />
              <span className="text-[11px] font-normal opacity-60">{seo.seo_description.length}/{DESCRIPTION_MAX}</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) onImage(f); if (fileInput.current) fileInput.current.value = ''; }}
              />
              <button onClick={() => fileInput.current?.click()} disabled={uploading} className="brutal-btn bg-white px-3 py-2 text-xs gap-2 disabled:opacity-50">
                <Upload className="w-3.5 h-3.5" /> {uploading ? 'Enviando...' : 'Imagem de compartilhamento'}
              </button>
              {seo.seo_image_url && (
                <button
                  onClick={() => { const next = { ...seo, seo_image_url: '' }; setSeo(next); save(next); }}
                  className="brutal-btn bg-white px-3 py-2 text-xs gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Remover imagem
                </button>
              )}
            </div>
            <p className="text-[11px] opacity-60">Imagem ideal: 1200 × 630 px. Sem imagem, usamos sua foto de perfil.</p>
            <div>
              <button onClick={() => save()} disabled={saving} className="brutal-btn bg-bioyellow px-4 py-2 text-sm disabled:opacity-50">
                {saving ? 'Salvando...' : 'Salvar SEO'}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold mb-2 opacity-60">Prévia no WhatsApp/redes</p>
            <div className="brutal-border bg-white overflow-hidden">
              {previewImage ? (
                <img src={previewImage} alt="" className="w-full aspect-[1.91/1] object-cover border-b-2 border-black" />
              ) : (
                <div className="w-full aspect-[1.91/1] bg-black/5 border-b-2 border-black" />
              )}
              <div className="p-3">
                <p className="text-[11px] opacity-60">bioflowzy.com</p>
                <p className="text-sm font-bold line-clamp-2">{previewTitle}</p>
                <p className="text-xs opacity-70 line-clamp-2">{previewDescription}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
