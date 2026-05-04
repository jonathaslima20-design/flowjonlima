import type { ComponentType } from 'react';

export type BioProfile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  theme: string;
  theme_settings: Record<string, any>;
  bg_color: string;
  button_color: string;
  text_color: string;
  border_width: number;
  shadow_offset: number;
  avatar_size: number;
  is_pro: boolean;
};

export type BioThemeProps = {
  profile: BioProfile;
  links: any[];
  socials: any[];
  videos: any[];
  banners: any[];
  track?: (entity_type: string, entity_id: string | null) => void;
  preview?: boolean;
};

export type BioThemeDefaults = {
  bg_color: string;
  button_color: string;
  text_color: string;
  border_width?: number;
  shadow_offset?: number;
};

type BaseControl = {
  key: string;
  label: string;
  group?: string;
  category?: 'cores' | 'tipografia' | 'layout' | 'textos' | 'efeitos' | 'geral';
  help?: string;
};

export type ControlDef =
  | (BaseControl & { type: 'slider'; min: number; max: number; step?: number; suffix?: string; default: number })
  | (BaseControl & { type: 'toggle'; default: boolean })
  | (BaseControl & { type: 'select'; options: { value: string; label: string }[]; default: string })
  | (BaseControl & { type: 'color'; palette: string[]; default: string; allowCustom?: boolean })
  | (BaseControl & { type: 'colorPicker'; default: string })
  | (BaseControl & { type: 'radio'; options: { value: string; label: string }[]; default: string })
  | (BaseControl & { type: 'text'; default: string; placeholder?: string; maxLength?: number })
  | (BaseControl & { type: 'textarea'; default: string; placeholder?: string; maxLength?: number; rows?: number })
  | (BaseControl & { type: 'fontFamily'; default: string })
  | (BaseControl & { type: 'coreColor'; field: 'bg_color' | 'button_color' | 'text_color'; palette: string[]; default: string })
  | (BaseControl & { type: 'coreNumber'; field: 'avatar_size' | 'border_width' | 'shadow_offset'; min: number; max: number; step?: number; suffix?: string; default: number });

export type BioThemeMeta = {
  key: string;
  name: string;
  description: string;
  available: boolean;
  defaults: BioThemeDefaults;
  palettes: {
    bg: string[];
    accent: string[];
    text: string[];
  };
  controls?: ControlDef[];
};

export type BioThemeDefinition = {
  meta: BioThemeMeta;
  component: ComponentType<BioThemeProps>;
};

export function getThemeSettings(profile: BioProfile | any, themeKey: string, controls: ControlDef[] = []): Record<string, any> {
  const stored = (profile?.theme_settings && typeof profile.theme_settings === 'object')
    ? (profile.theme_settings[themeKey] || {})
    : {};
  const defaults: Record<string, any> = {};
  for (const c of controls) {
    if (c.type === 'coreColor' || c.type === 'coreNumber') continue;
    defaults[c.key] = (c as any).default;
  }
  return { ...defaults, ...stored };
}

export type FontOption = {
  value: string;
  label: string;
  stack: string;
  category: 'sans' | 'serif' | 'mono' | 'display';
};

export const CURATED_FONTS: FontOption[] = [
  { value: 'inter', label: 'Inter', stack: 'var(--font-inter), system-ui, sans-serif', category: 'sans' },
  { value: 'grotesk', label: 'Space Grotesk', stack: 'var(--font-space-grotesk), system-ui, sans-serif', category: 'sans' },
  { value: 'dmsans', label: 'DM Sans', stack: 'var(--font-dmsans), system-ui, sans-serif', category: 'sans' },
  { value: 'manrope', label: 'Manrope', stack: 'var(--font-manrope), system-ui, sans-serif', category: 'sans' },
  { value: 'archivo', label: 'Archivo Black', stack: 'var(--font-archivo-black), Impact, sans-serif', category: 'display' },
  { value: 'syne', label: 'Syne', stack: 'var(--font-syne), sans-serif', category: 'display' },
  { value: 'bricolage', label: 'Bricolage Grotesque', stack: 'var(--font-bricolage), sans-serif', category: 'display' },
  { value: 'playfair', label: 'Playfair Display', stack: 'var(--font-playfair), Georgia, serif', category: 'serif' },
  { value: 'fraunces', label: 'Fraunces', stack: 'var(--font-fraunces), Georgia, serif', category: 'serif' },
  { value: 'cormorant', label: 'Cormorant Garamond', stack: 'var(--font-cormorant), Georgia, serif', category: 'serif' },
  { value: 'dmserif', label: 'DM Serif Display', stack: 'var(--font-dmserif), Georgia, serif', category: 'serif' },
  { value: 'jetbrains', label: 'JetBrains Mono', stack: 'var(--font-jetbrains), ui-monospace, monospace', category: 'mono' },
  { value: 'ibmplex', label: 'IBM Plex Mono', stack: 'var(--font-ibmplex), ui-monospace, monospace', category: 'mono' },
  { value: 'system', label: 'System UI', stack: 'system-ui, -apple-system, sans-serif', category: 'sans' },
];

export function getFontStack(value: string | undefined | null, fallback?: string): string {
  if (!value) return fallback || 'system-ui, sans-serif';
  const f = CURATED_FONTS.find(x => x.value === value);
  return f ? f.stack : (fallback || 'system-ui, sans-serif');
}
