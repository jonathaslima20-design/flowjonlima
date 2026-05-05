'use client';

import { getTheme } from '@/themes/registry';
import { BioAnalytics } from '@/components/bio/BioAnalytics';
import { firePixel, fireGa, TrackEntity, validatePixelId, validateGaId } from '@/lib/tracking';
import { can } from '@/lib/plans';

export function BioClient({ profile, links, socials, videos, banners }: any) {
  const Theme = getTheme(profile?.theme).component;

  const planAllowsTracking = can(profile, 'pixel_ga');
  const pixelId = planAllowsTracking && validatePixelId(profile?.meta_pixel_id) ? profile.meta_pixel_id : '';
  const gaId = planAllowsTracking && validateGaId(profile?.ga_measurement_id) ? profile.ga_measurement_id : '';

  async function track(entity_type: string, entity_id: string | null) {
    try {
      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profile.id, entity_type, entity_id }),
      });
    } catch {}

    const known: TrackEntity[] = ['link', 'social', 'banner', 'video'];
    if (known.includes(entity_type as TrackEntity)) {
      firePixel(entity_type as TrackEntity, entity_id);
      fireGa(entity_type as TrackEntity, entity_id);
    }
  }

  return (
    <>
      <BioAnalytics
        metaPixelId={pixelId}
        gaId={gaId}
        metaEnabled={profile?.meta_pixel_enabled !== false}
        gaEnabled={profile?.ga_enabled !== false}
      />
      <Theme
        profile={profile}
        links={links}
        socials={socials}
        videos={videos}
        banners={banners}
        sectionOrder={profile?.section_order || ['socials', 'links', 'banners', 'videos']}
        track={track}
      />
    </>
  );
}
