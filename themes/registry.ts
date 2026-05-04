import { BrutalistTheme, brutalistMeta } from './brutalist';
import { AuroraTheme, auroraMeta } from './aurora';
import { CyberTheme, cyberMeta } from './cyber';
import { RetrowaveTheme, retrowaveMeta } from './retrowave';
import { AtlasTheme, atlasMeta } from './atlas';
import { ConversionTheme, conversionMeta } from './conversion';
import { CreatorTheme, creatorMeta } from './creator';
import { AgencyTheme, agencyMeta } from './agency';
import { PrismTheme, prismMeta } from './prism';
import { NeonLabTheme, neonlabMeta } from './neonlab';
import { ChromeTheme, chromeMeta } from './chrome';
import { TerminalTheme, terminalMeta } from './terminal';
import { ConsultancyTheme, consultancyMeta } from './consultancy';
import { KeynoteTheme, keynoteMeta } from './keynote';
import { GraphiteTheme, graphiteMeta } from './graphite';
import { SunsetTheme, sunsetMeta } from './sunset';
import { ForestTheme, forestMeta } from './forest';
import { MangaTheme, mangaMeta } from './manga';
import { BauhausTheme, bauhausMeta } from './bauhaus';
import { LavaTheme, lavaMeta } from './lava';
import { NewspaperTheme, newspaperMeta } from './newspaper';
import { GlitchTheme, glitchMeta } from './glitch';
import { CosmosTheme, cosmosMeta } from './cosmos';
import type { BioThemeDefaults, BioThemeDefinition, BioThemeMeta, ControlDef } from './types';

function buildCoreControls(meta: BioThemeMeta): ControlDef[] {
  const isBrutalist = meta.key === 'brutalist';
  const core: ControlDef[] = [
    { key: '__core_bg_color', field: 'bg_color', type: 'coreColor', label: 'Cor de fundo', palette: meta.palettes.bg, default: meta.defaults.bg_color, group: 'Básico', category: 'cores' },
    { key: '__core_button_color', field: 'button_color', type: 'coreColor', label: 'Cor do botão / destaque', palette: meta.palettes.accent, default: meta.defaults.button_color, group: 'Básico', category: 'cores' },
    { key: '__core_text_color', field: 'text_color', type: 'coreColor', label: 'Cor do texto', palette: meta.palettes.text, default: meta.defaults.text_color, group: 'Básico', category: 'cores' },
    { key: '__core_avatar_size', field: 'avatar_size', type: 'coreNumber', label: 'Tamanho do avatar', min: 60, max: 200, step: 2, suffix: 'px', default: 96, group: 'Básico', category: 'layout' },
  ];
  if (isBrutalist) {
    core.push(
      { key: '__core_border_width', field: 'border_width', type: 'coreNumber', label: 'Espessura da borda', min: 2, max: 5, step: 1, suffix: 'px', default: meta.defaults.border_width ?? 3, group: 'Básico', category: 'layout' },
      { key: '__core_shadow_offset', field: 'shadow_offset', type: 'coreNumber', label: 'Intensidade da sombra', min: 0, max: 8, step: 2, suffix: 'px', default: meta.defaults.shadow_offset ?? 4, group: 'Básico', category: 'layout' },
    );
  }
  return core;
}

function withCoreControls(meta: BioThemeMeta): BioThemeMeta {
  return { ...meta, controls: [...buildCoreControls(meta), ...(meta.controls || [])] };
}

export const THEMES: Record<string, BioThemeDefinition> = {
  brutalist: { meta: withCoreControls(brutalistMeta), component: BrutalistTheme },
  aurora: { meta: withCoreControls(auroraMeta), component: AuroraTheme },
  atlas: { meta: withCoreControls(atlasMeta), component: AtlasTheme },
  conversion: { meta: withCoreControls(conversionMeta), component: ConversionTheme },
  terminal: { meta: withCoreControls(terminalMeta), component: TerminalTheme },
  chrome: { meta: withCoreControls(chromeMeta), component: ChromeTheme },
  prism: { meta: withCoreControls(prismMeta), component: PrismTheme },
  cyber: { meta: withCoreControls(cyberMeta), component: CyberTheme },
  retrowave: { meta: withCoreControls(retrowaveMeta), component: RetrowaveTheme },
  neonlab: { meta: withCoreControls(neonlabMeta), component: NeonLabTheme },
  creator: { meta: withCoreControls(creatorMeta), component: CreatorTheme },
  agency: { meta: withCoreControls(agencyMeta), component: AgencyTheme },
  consultancy: { meta: withCoreControls(consultancyMeta), component: ConsultancyTheme },
  keynote: { meta: withCoreControls(keynoteMeta), component: KeynoteTheme },
  graphite: { meta: withCoreControls(graphiteMeta), component: GraphiteTheme },
  sunset: { meta: withCoreControls(sunsetMeta), component: SunsetTheme },
  forest: { meta: withCoreControls(forestMeta), component: ForestTheme },
  manga: { meta: withCoreControls(mangaMeta), component: MangaTheme },
  bauhaus: { meta: withCoreControls(bauhausMeta), component: BauhausTheme },
  lava: { meta: withCoreControls(lavaMeta), component: LavaTheme },
  newspaper: { meta: withCoreControls(newspaperMeta), component: NewspaperTheme },
  glitch: { meta: withCoreControls(glitchMeta), component: GlitchTheme },
  cosmos: { meta: withCoreControls(cosmosMeta), component: CosmosTheme },
};

export function getTheme(key: string | undefined | null): BioThemeDefinition {
  if (key && THEMES[key]) return THEMES[key];
  return THEMES.brutalist;
}

export function getThemeDefaults(key: string | undefined | null): BioThemeDefaults {
  return getTheme(key).meta.defaults;
}
