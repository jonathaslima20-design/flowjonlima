'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getTheme, getThemeDefaults } from '@/themes/registry';
import { PhoneFrame } from '@/components/themes/ThemeMockup';

export function BioPreview({
  profileId,
  profile: profileProp,
  links,
  socials,
  videos,
  banners,
}: {
  profileId: string;
  profile?: any;
  links: any[];
  socials?: any[];
  videos?: any[];
  banners?: any[];
}) {
  const [fetched, setFetched] = useState<any>(null);

  useEffect(() => {
    if (profileProp || !profileId) return;
    supabase.from('profiles').select('*').eq('id', profileId).maybeSingle().then(({ data }) => setFetched(data));
  }, [profileId, profileProp]);

  const rawProfile = profileProp ?? fetched;
  if (!rawProfile) return null;

  const defaults = getThemeDefaults(rawProfile.theme);
  const profile = {
    ...rawProfile,
    bg_color: rawProfile.bg_color || defaults.bg_color,
    button_color: rawProfile.button_color || defaults.button_color,
    text_color: rawProfile.text_color || defaults.text_color,
    border_width: rawProfile.border_width ?? defaults.border_width,
    shadow_offset: rawProfile.shadow_offset ?? defaults.shadow_offset,
  };

  const Theme = getTheme(profile.theme).component;
  const noop = () => {};
  const activeLinks = (links || []).filter((l: any) => l.is_active !== false);

  const SCALE = 0.55;
  const INNER_WIDTH = 582;
  const FRAME_WIDTH = Math.round(INNER_WIDTH * SCALE);
  const FRAME_HEIGHT = 622;
  const INNER_HEIGHT = Math.round(FRAME_HEIGHT / SCALE);

  return (
    <div className="mx-auto w-fit">
      <PhoneFrame width={FRAME_WIDTH} height={FRAME_HEIGHT}>
        <div
          className="pointer-events-none origin-top-left overflow-hidden"
          style={{
            transform: `scale(${SCALE})`,
            width: INNER_WIDTH,
            height: INNER_HEIGHT,
            transformOrigin: 'top left',
          }}
        >
          <Theme
            profile={profile}
            links={activeLinks}
            socials={socials || []}
            videos={videos || []}
            banners={banners || []}
            track={noop}
            preview
          />
        </div>
      </PhoneFrame>
    </div>
  );
}
