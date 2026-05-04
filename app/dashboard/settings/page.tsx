'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, User } from 'lucide-react';
import { ProFeatureCard } from '@/components/dashboard/ProFeatureCard';
import { AvatarCropModal } from '@/components/dashboard/AvatarCropModal';
import { CustomDomainSection } from '@/components/dashboard/CustomDomainSection';

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', u.user.id).maybeSingle();
      setProfile(data);
    })();
  }, []);

  async function save() {
    if (!profile) return;
    await supabase.from('profiles').update({
      display_name: profile.display_name,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
    }).eq('id', profile.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function extractPath(url: string): string | null {
    const m = url.match(/\/storage\/v1\/object\/public\/avatars\/(.+)$/);
    return m ? m[1] : null;
  }

  function onFileSelected(file: File) {
    if (!file.type.startsWith('image/')) { alert('Envie um arquivo de imagem.'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('Máximo 10MB.'); return; }
    const url = URL.createObjectURL(file);
    setCropSrc(url);
  }

  async function onCropConfirmed(croppedFile: File) {
    if (!profile) return;
    setCropSrc(null);
    setUploading(true);
    const path = `${profile.id}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage.from('avatars').upload(path, croppedFile, { upsert: false, contentType: 'image/jpeg' });
    if (error) { setUploading(false); alert('Falha no upload: ' + error.message); return; }
    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    const oldPath = profile.avatar_url ? extractPath(profile.avatar_url) : null;
    const newUrl = pub.publicUrl;
    await supabase.from('profiles').update({ avatar_url: newUrl }).eq('id', profile.id);
    setProfile({ ...profile, avatar_url: newUrl });
    if (oldPath) await supabase.storage.from('avatars').remove([oldPath]);
    setUploading(false);
  }

  function onCropCancel() {
    setCropSrc(null);
    if (fileInput.current) fileInput.current.value = '';
  }

  async function removeAvatar() {
    if (!profile?.avatar_url) return;
    const oldPath = extractPath(profile.avatar_url);
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', profile.id);
    setProfile({ ...profile, avatar_url: null });
    if (oldPath) await supabase.storage.from('avatars').remove([oldPath]);
  }

  if (!profile) return <div>Carregando...</div>;

  return (
    <div className="max-w-2xl flex flex-col gap-10">
      <AvatarCropModal
        imageSrc={cropSrc}
        onConfirm={onCropConfirmed}
        onCancel={onCropCancel}
      />
      <h1 className="font-display text-4xl">Configurações</h1>

      {/* Perfil */}
      <section>
        <h2 className="font-display text-2xl mb-4">Perfil</h2>
        <div className="brutal-card p-6 flex flex-col gap-4">
          <div>
            <label className="font-bold text-sm">Foto de perfil</label>
            <div className="mt-2 flex items-center gap-4">
              <div className="brutal-border w-20 h-20 bg-white overflow-hidden flex items-center justify-center">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-black/40" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) onFileSelected(f); }}
                />
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={uploading}
                  className="brutal-btn bg-white px-3 py-2 text-sm gap-2 disabled:opacity-60"
                >
                  <Upload className="w-4 h-4" /> {uploading ? 'Enviando...' : profile.avatar_url ? 'Trocar foto' : 'Enviar foto'}
                </button>
                {profile.avatar_url && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="text-xs font-bold underline text-black/60"
                  >
                    Remover foto
                  </button>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="font-bold text-sm">Nome público</label>
            <input className="brutal-input w-full mt-1" value={profile.display_name || ''} onChange={e => setProfile({ ...profile, display_name: e.target.value })} />
          </div>
          <div>
            <label className="font-bold text-sm">@ (username)</label>
            <input className="brutal-input w-full mt-1" value={profile.username} disabled />
          </div>
          <div>
            <label className="font-bold text-sm">Bio</label>
            <textarea className="brutal-input w-full mt-1" rows={5} maxLength={300} value={profile.bio || ''} onChange={e => setProfile({ ...profile, bio: e.target.value })} />
            <p className="text-xs text-black/60 mt-1">Pressione Enter para quebrar linha.</p>
          </div>
          <button onClick={save} className="brutal-btn bg-bioyellow py-3 mt-2">Salvar</button>
          {saved && <div className="font-bold">Salvo!</div>}
        </div>
      </section>

      {/* Dominio */}
      <section>
        <ProFeatureCard
          feature="custom_domain"
          title="Domínio personalizado"
          description="Use seu próprio domínio (ex: links.seudominio.com) em vez do subdomínio Bioflowzy."
          comingSoon={false}
        >
          <CustomDomainSection />
        </ProFeatureCard>
      </section>

      {/* Integracoes */}
      <section>
        <h2 className="font-display text-2xl mb-4">Integrações</h2>
        <div className="brutal-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold">Meta Pixel e Google Analytics</p>
            <p className="text-xs text-black/60 mt-1">Gerencie suas integrações de rastreamento na página dedicada.</p>
          </div>
          <a href="/dashboard/integrations" className="brutal-btn bg-black text-white px-4 py-2 text-xs shrink-0">
            Gerenciar integrações
          </a>
        </div>
      </section>
    </div>
  );
}
