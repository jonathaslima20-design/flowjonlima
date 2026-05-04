'use client';

import { memo, type ReactNode } from 'react';
import { getTheme, getThemeDefaults } from '@/themes/registry';
import { DEMO_PROFILE, DEMO_LINKS, DEMO_SOCIALS } from './demoData';
import type { BioProfile } from '@/themes/types';

const DEFAULT_PHONE_WIDTH = 220;
const DEFAULT_PHONE_HEIGHT = 504;
const INNER_WIDTH = 400;

type Props = {
  themeKey: string;
  overrides?: Partial<BioProfile>;
  overlay?: ReactNode;
  links?: any[];
  socials?: any[];
  videos?: any[];
  banners?: any[];
  themeSettings?: Record<string, any>;
  width?: number;
  height?: number;
  preview?: boolean;
};

function PhoneFrame({
  children,
  overlay,
  width = DEFAULT_PHONE_WIDTH,
  height = DEFAULT_PHONE_HEIGHT,
}: {
  children: ReactNode;
  overlay?: ReactNode;
  width?: number;
  height?: number;
}) {
  const chassisPad = Math.max(10, Math.round(width * 0.055));
  const outerRadius = Math.round(width * 0.18);
  const screenRadius = Math.max(16, outerRadius - Math.round(chassisPad * 0.5));
  const islandWidth = Math.round(width * 0.32);
  const islandHeight = Math.max(18, Math.round(width * 0.095));
  const islandTop = Math.max(6, Math.round(width * 0.035));

  const chassisStyle: React.CSSProperties = {
    width: width + chassisPad * 2,
    height: height + chassisPad * 2,
    borderRadius: outerRadius,
    background:
      'linear-gradient(145deg, #3a3d42 0%, #1c1d20 30%, #0c0d0f 55%, #1a1b1e 78%, #2e3034 100%)',
    boxShadow:
      '0 30px 60px -20px rgba(0,0,0,0.55), 0 12px 24px -10px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)',
    padding: chassisPad,
  };

  const bezelStyle: React.CSSProperties = {
    width,
    height,
    borderRadius: screenRadius,
    background: '#000',
    boxShadow:
      'inset 0 0 0 2px #0a0a0b, inset 0 0 0 3px rgba(255,255,255,0.04)',
  };

  const buttonBase: React.CSSProperties = {
    position: 'absolute',
    background:
      'linear-gradient(90deg, #0f1013 0%, #2c2e33 50%, #0f1013 100%)',
    boxShadow:
      'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.5)',
  };

  return (
    <div className="relative inline-block">
      <div className="relative" style={chassisStyle}>
        <span
          style={{
            ...buttonBase,
            left: -2,
            top: Math.round(chassisPad + height * 0.12),
            width: 3,
            height: Math.max(10, Math.round(height * 0.035)),
            borderTopLeftRadius: 2,
            borderBottomLeftRadius: 2,
          }}
        />
        <span
          style={{
            ...buttonBase,
            left: -2,
            top: Math.round(chassisPad + height * 0.22),
            width: 3,
            height: Math.max(14, Math.round(height * 0.07)),
            borderTopLeftRadius: 2,
            borderBottomLeftRadius: 2,
          }}
        />
        <span
          style={{
            ...buttonBase,
            left: -2,
            top: Math.round(chassisPad + height * 0.32),
            width: 3,
            height: Math.max(14, Math.round(height * 0.07)),
            borderTopLeftRadius: 2,
            borderBottomLeftRadius: 2,
          }}
        />
        <span
          style={{
            ...buttonBase,
            right: -2,
            top: Math.round(chassisPad + height * 0.24),
            width: 3,
            height: Math.max(18, Math.round(height * 0.1)),
            borderTopRightRadius: 2,
            borderBottomRightRadius: 2,
          }}
        />

        <div className="relative overflow-hidden" style={bezelStyle}>
          {children}

          <div
            className="absolute left-1/2 -translate-x-1/2 z-30"
            style={{
              top: islandTop,
              width: islandWidth,
              height: islandHeight,
              borderRadius: islandHeight,
              background: '#000',
              boxShadow:
                '0 0 0 1px #101114, inset 0 1px 2px rgba(255,255,255,0.05)',
            }}
          >
            <span
              className="absolute"
              style={{
                top: '50%',
                right: Math.round(islandWidth * 0.18),
                transform: 'translateY(-50%)',
                width: Math.max(4, Math.round(islandHeight * 0.3)),
                height: Math.max(4, Math.round(islandHeight * 0.3)),
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #2a3442 0%, #0a0d12 70%)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
              }}
            />
          </div>

          <div
            className="pointer-events-none absolute inset-0 z-20"
            style={{
              borderRadius: screenRadius,
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 100%)',
            }}
          />

          {overlay}
        </div>
      </div>
    </div>
  );
}

function ThemeMockupBase({
  themeKey,
  overrides,
  overlay,
  links,
  socials,
  videos,
  banners,
  themeSettings,
  width = DEFAULT_PHONE_WIDTH,
  height = DEFAULT_PHONE_HEIGHT,
  preview = true,
}: Props) {
  const theme = getTheme(themeKey);
  const Component = theme.component;
  const defaults = getThemeDefaults(themeKey);
  const settingsForTheme = themeSettings && Object.keys(themeSettings).length > 0
    ? { [themeKey]: themeSettings }
    : {};
  const profile = {
    border_width: 2,
    shadow_offset: 4,
    ...DEMO_PROFILE,
    ...defaults,
    ...overrides,
    theme: themeKey,
    theme_settings: settingsForTheme,
  } as BioProfile;

  const scale = width / INNER_WIDTH;
  const innerHeight = height / scale;

  return (
    <PhoneFrame overlay={overlay} width={width} height={height}>
      <div
        className="pointer-events-none select-none origin-top-left overflow-hidden"
        style={{
          width: INNER_WIDTH,
          height: innerHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
        aria-hidden
      >
        <Component
          profile={profile}
          links={links ?? DEMO_LINKS}
          socials={socials ?? DEMO_SOCIALS}
          videos={videos ?? []}
          banners={banners ?? []}
          preview={preview}
        />
      </div>
    </PhoneFrame>
  );
}

export const ThemeMockup = memo(ThemeMockupBase);
export { PhoneFrame };
