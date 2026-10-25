'use client';

import { useEffect, useState } from 'react';
import { getTheme } from '@/themes/registry';
import { BioAnalytics } from '@/components/bio/BioAnalytics';
import { firePixel, fireGa, TrackEntity, validatePixelId, validateGaId } from '@/lib/tracking';
import { can, getPlanFor } from '@/lib/plans';
import { isLeadFormUrl, LEAD_FORM_URL } from '@/lib/leads';
import { LeadFormModal } from '@/components/bio/LeadFormModal';
import { detectDevice, detectSource } from '@/lib/visit-source';

const RPC_HEADERS = {
  'Content-Type': 'application/json',
  apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
};

export function BioClient({ profile, links, socials, videos, banners }: any) {
  const Theme = getTheme(profile?.theme).component;
  const [leadFormTitle, setLeadFormTitle] = useState<string | null>(null);

  // Sem leads no plano (ex.: Pro vencido), o botão do formulário some da página
  const acceptsLeads = getPlanFor(profile).limits.leads !== 0;
  const visibleLinks = acceptsLeads ? links : links.filter((l: any) => !isLeadFormUrl(l.url));

  const planAllowsTracking = can(profile, 'pixel_ga');
  const pixelId = planAllowsTracking && validatePixelId(profile?.meta_pixel_id) ? profile.meta_pixel_id : '';
  const gaId = planAllowsTracking && validateGaId(profile?.ga_measurement_id) ? profile.ga_measurement_id : '';

  // Uma visita por carregamento; o banco descarta repetições do mesmo visitante em 30 min
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/track_view`, {
      method: 'POST',
      keepalive: true,
      headers: RPC_HEADERS,
      body: JSON.stringify({ p_profile_id: profile.id, p_source: detectSource(), p_device: detectDevice() }),
    }).catch(() => {});
  }, [profile.id]);

  async function track(entity_type: string, entity_id: string | null) {
    // Chama a RPC direto do navegador para o banco ver o IP real do visitante (limites
    // por visitante); keepalive garante o envio mesmo quando o clique abre outra página
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/track_click`, {
      method: 'POST',
      keepalive: true,
      headers: RPC_HEADERS,
      body: JSON.stringify({ p_profile_id: profile.id, p_entity_type: entity_type, p_entity_id: entity_id }),
    }).catch(() => {});

    const known: TrackEntity[] = ['link', 'social', 'banner', 'video'];
    if (known.includes(entity_type as TrackEntity)) {
      firePixel(entity_type as TrackEntity, entity_id);
      fireGa(entity_type as TrackEntity, entity_id);
    }
  }

  // O botão do formulário é um link comum do tema; intercepta o clique para abrir o modal
  function onClickCapture(e: React.MouseEvent) {
    const anchor = (e.target as HTMLElement).closest('a');
    if (!anchor || anchor.getAttribute('href') !== LEAD_FORM_URL) return;
    e.preventDefault();
    const link = visibleLinks.find((l: any) => isLeadFormUrl(l.url));
    setLeadFormTitle(link?.title || 'Fale comigo');
  }

  return (
    <div style={{ display: 'contents' }} onClickCapture={onClickCapture}>
      <BioAnalytics
        metaPixelId={pixelId}
        gaId={gaId}
        metaEnabled={profile?.meta_pixel_enabled !== false}
        gaEnabled={profile?.ga_enabled !== false}
      />
      <Theme
        profile={profile}
        links={visibleLinks}
        socials={socials}
        videos={videos}
        banners={banners}
        sectionOrder={profile?.section_order || ['socials', 'links', 'banners', 'videos']}
        track={track}
      />
      {leadFormTitle && (
        <LeadFormModal
          profileId={profile.id}
          ownerName={profile.display_name || profile.username}
          title={leadFormTitle}
          onClose={() => setLeadFormTitle(null)}
        />
      )}
    </div>
  );
}
