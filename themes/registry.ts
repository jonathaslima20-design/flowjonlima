import { CyberTheme, cyberMeta } from './cyber';
import { AtlasTheme, atlasMeta } from './atlas';
import { CreatorTheme, creatorMeta } from './creator';
import { AgencyTheme, agencyMeta } from './agency';
import { ChromeTheme, chromeMeta } from './chrome';
import { CupertinoTheme, cupertinoMeta } from './cupertino';
import { COLLECTION_2026 } from './collection';
import type { BioThemeDefaults, BioThemeDefinition, BioThemeMeta, ControlDef } from './types';

function buildCoreControls(meta: BioThemeMeta): ControlDef[] {
  const core: ControlDef[] = [
    { key: '__core_bg_color', field: 'bg_color', type: 'coreColor', label: 'Cor de fundo', palette: meta.palettes.bg, default: meta.defaults.bg_color, group: 'Básico', category: 'cores' },
    { key: '__core_button_color', field: 'button_color', type: 'coreColor', label: 'Cor do botão / destaque', palette: meta.palettes.accent, default: meta.defaults.button_color, group: 'Básico', category: 'cores' },
    { key: '__core_text_color', field: 'text_color', type: 'coreColor', label: 'Cor do texto', palette: meta.palettes.text, default: meta.defaults.text_color, group: 'Básico', category: 'cores' },
    { key: '__core_avatar_size', field: 'avatar_size', type: 'coreNumber', label: 'Tamanho do avatar', min: 60, max: 200, step: 2, suffix: 'px', default: 200, group: 'Básico', category: 'layout' },
  ];
  return core;
}

function withCoreControls(meta: BioThemeMeta): BioThemeMeta {
  return { ...meta, controls: [...buildCoreControls(meta), ...(meta.controls || [])] };
}

export const THEMES: Record<string, BioThemeDefinition> = {
  cupertino: { meta: withCoreControls(cupertinoMeta), component: CupertinoTheme },
  atlas: { meta: withCoreControls(atlasMeta), component: AtlasTheme },
  chrome: { meta: withCoreControls(chromeMeta), component: ChromeTheme },
  cyber: { meta: withCoreControls(cyberMeta), component: CyberTheme },
  creator: { meta: withCoreControls(creatorMeta), component: CreatorTheme },
  agency: { meta: withCoreControls(agencyMeta), component: AgencyTheme },
  // Coleção 2026 (themes/collection.ts)
  ...Object.fromEntries(COLLECTION_2026.map(t => [t.meta.key, { meta: withCoreControls(t.meta), component: t.component }])),
};

export function getTheme(key: string | undefined | null): BioThemeDefinition {
  if (key && THEMES[key]) return THEMES[key];
  return THEMES.cupertino;
}

export function getThemeDefaults(key: string | undefined | null): BioThemeDefaults {
  return getTheme(key).meta.defaults;
}
