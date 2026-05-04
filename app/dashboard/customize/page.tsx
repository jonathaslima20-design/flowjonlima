'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BioPreview } from '@/components/dashboard/BioPreview';
import { THEMES, getTheme } from '@/themes/registry';
import { ThemeMockup } from '@/components/themes/ThemeMockup';
import { ThemeControls } from '@/components/dashboard/ThemeControls';
import { Check, Eye, X } from 'lucide-react';
import { fetchAllShowcasePresets, catalogDemoFor, ShowcasePreset } from '@/lib/theme-showcase';

export default function CustomizePage() {
  const [profileId, setProfileId] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [socials, setSocials] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);
  const [showcase, setShowcase] = useState<Record<string, ShowcasePreset>>({});
  const [catalogOrder, setCatalogOrder] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const saveTimer = useRef<any>(null);

  useEffect(() => {
    (async () => {
      const all = await fetchAllShowcasePresets();
      const map: Record<string, ShowcasePreset> = {};
      for (const p of all) map[p.theme_key] = p;
      setShowcase(map);
      // all is already sorted by catalog_order from fetchAllShowcasePresets
      setCatalogOrder(all.map(p => p.theme_key));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setProfileId(u.user.id);
      const { data: p } = await supabase.from('profiles').select('*').eq('id', u.user.id).maybeSingle();
      setProfile(p);
      const [{ data: ls }, { data: ss }, { data: vs }, { data: bs }] = await Promise.all([
        supabase.from('links').select('*').eq('profile_id', u.user.id).eq('is_active', true).order('position'),
        supabase.from('social_links').select('*').eq('profile_id', u.user.id).eq('is_active', true).order('position'),
        supabase.from('videos').select('*').eq('profile_id', u.user.id).eq('is_active', true).order('position'),
        supabase.from('banners').select('*').eq('profile_id', u.user.id).eq('is_active', true).order('position'),
      ]);
      setLinks(ls ?? []);
      setSocials(ss ?? []);
      setVideos(vs ?? []);
      setBanners(bs ?? []);
    })();
  }, []);

  async function update(patch: any) {
    const next = { ...profile, ...patch };
    setProfile(next);
    await supabase.from('profiles').update(patch).eq('id', profileId);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function updateThemeSetting(themeKey: string, key: string, value: any) {
    setProfile((prev: any) => {
      const current = (prev?.theme_settings && typeof prev.theme_settings === 'object') ? prev.theme_settings : {};
      const nextSettings = { ...current, [themeKey]: { ...(current[themeKey] || {}), [key]: value } };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        await supabase.from('profiles').update({ theme_settings: nextSettings }).eq('id', profileId);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }, 300);
      return { ...prev, theme_settings: nextSettings };
    });
  }

  async function resetThemeSettings(themeKey: string) {
    const current = (profile?.theme_settings && typeof profile.theme_settings === 'object') ? profile.theme_settings : {};
    const nextSettings = { ...current };
    delete nextSettings[themeKey];
    const next = { ...profile, theme_settings: nextSettings };
    setProfile(next);
    await supabase.from('profiles').update({ theme_settings: nextSettings }).eq('id', profileId);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function resetThemeGroup(themeKey: string, group: string) {
    const theme = getTheme(themeKey);
    const groupControls = (theme.meta.controls || []).filter(c => (c.group || 'Ajustes') === group);
    const current = (profile?.theme_settings && typeof profile.theme_settings === 'object') ? profile.theme_settings : {};
    const themeSet = { ...(current[themeKey] || {}) };
    const corePatch: any = {};
    for (const c of groupControls) {
      if (c.type === 'coreColor' || c.type === 'coreNumber') {
        corePatch[c.field] = (c as any).default;
      } else {
        delete themeSet[c.key];
      }
    }
    const nextSettings = { ...current, [themeKey]: themeSet };
    const patch = { ...corePatch, theme_settings: nextSettings };
    const next = { ...profile, ...patch };
    setProfile(next);
    await supabase.from('profiles').update(patch).eq('id', profileId);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function updateCoreField(field: string, value: any) {
    setProfile((prev: any) => ({ ...prev, [field]: value }));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await supabase.from('profiles').update({ [field]: value }).eq('id', profileId);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 300);
  }

  async function applyTheme(themeKey: string) {
    const defaults = getTheme(themeKey).meta.defaults;
    await update({
      theme: themeKey,
      bg_color: defaults.bg_color,
      button_color: defaults.button_color,
      text_color: defaults.text_color,
      ...(defaults.border_width !== undefined ? { border_width: defaults.border_width } : {}),
      ...(defaults.shadow_offset !== undefined ? { shadow_offset: defaults.shadow_offset } : {}),
    });
  }

  const activeKey = profile?.theme || 'brutalist';

  if (!profile) return <div>Carregando...</div>;

  const activeTheme = getTheme(activeKey);
  const themeControls = activeTheme.meta.controls || [];
  const themeValues = (profile.theme_settings && typeof profile.theme_settings === 'object')
    ? (profile.theme_settings[activeKey] || {})
    : {};

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8">
      <div>
        <h1 className="font-display text-4xl mb-6">Aparencia</h1>

        <Section title="Tema">
          <p className="text-xs font-bold text-black/60 mb-3">
            Cada tema tem um layout e personalidade unicos. Suas cores continuam aplicadas.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              ...catalogOrder.filter(k => THEMES[k]).map(k => THEMES[k]),
              ...Object.values(THEMES).filter(({ meta }) => !catalogOrder.includes(meta.key)),
            ].map(({ meta }) => {
              const active = activeKey === meta.key;
              const preset = showcase[meta.key];
              const hasShowcase = preset?.show_in_catalog;
              const demo = hasShowcase ? catalogDemoFor(preset) : null;
              return (
                <button
                  key={meta.key}
                  onClick={() => applyTheme(meta.key)}
                  className={`group brutal-border text-left transition-all overflow-hidden bg-white ${active ? 'brutal-shadow -translate-y-0.5' : 'hover:-translate-y-0.5 hover:brutal-shadow'}`}
                >
                  <div className="relative bg-[#F7F7F5] border-b-[3px] border-black flex items-center justify-center py-6">
                    <ThemeMockup
                      themeKey={meta.key}
                      overrides={demo?.profile as any}
                      links={demo?.links}
                      socials={demo?.socials}
                      videos={demo?.videos}
                      banners={demo?.banners}
                      themeSettings={demo?.themeSettings}
                      height={454}
                    />
                    {active && (
                      <span className="absolute top-2 right-2 text-[10px] font-bold uppercase bg-black text-white px-2 py-1 brutal-border flex items-center gap-1 z-10">
                        <Check className="w-3 h-3" /> Ativo
                      </span>
                    )}
                  </div>
                  <div className={`p-3 ${active ? 'bg-bioyellow' : 'bg-white'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-display text-lg">{meta.name}</span>
                    </div>
                    <p className="text-xs mt-1 text-black/70 line-clamp-2">{meta.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        {themeControls.length > 0 && (
          <Section title={`Ajustes de ${activeTheme.meta.name}`}>
            <ThemeControls
              controls={themeControls}
              values={themeValues}
              coreValues={{
                bg_color: profile.bg_color,
                button_color: profile.button_color,
                text_color: profile.text_color,
                avatar_size: profile.avatar_size,
                border_width: profile.border_width,
                shadow_offset: profile.shadow_offset,
              }}
              onChange={(k, v) => updateThemeSetting(activeKey, k, v)}
              onCoreChange={updateCoreField}
              onReset={() => resetThemeSettings(activeKey)}
              onResetGroup={(g) => resetThemeGroup(activeKey, g)}
            />
          </Section>
        )}

        {saved && <div className="mt-4 inline-block brutal-card px-4 py-2 bg-biolime font-bold">Salvo!</div>}
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-6">
          <h2 className="font-display text-lg mb-4">Preview</h2>
          <BioPreview
            profileId={profileId}
            profile={profile}
            links={links}
            socials={socials}
            videos={videos}
            banners={banners}
          />
        </div>
      </div>

      {/* Mobile floating preview button */}
      <button
        onClick={() => setPreviewOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-black text-white font-bold text-sm px-4 py-3 brutal-border brutal-shadow active:translate-y-0.5 active:shadow-none transition-all"
      >
        <Eye className="w-4 h-4" />
        Visualizar
      </button>

      {/* Mobile preview drawer */}
      {previewOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setPreviewOpen(false)}
          />
          <div className="relative mt-auto bg-white brutal-border-t max-h-[92dvh] flex flex-col animate-slide-up">
            <div className="flex items-center justify-between px-5 py-3 border-b-[3px] border-black shrink-0">
              <span className="font-display text-lg">Preview</span>
              <button
                onClick={() => setPreviewOpen(false)}
                className="brutal-btn p-2 bg-white"
                aria-label="Fechar preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 flex items-start justify-center py-6 px-4">
              <BioPreview
                profileId={profileId}
                profile={profile}
                links={links}
                socials={socials}
                videos={videos}
                banners={banners}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="brutal-card p-5 mb-5">
      <h3 className="font-display text-lg mb-3">{title}</h3>
      {children}
    </div>
  );
}

