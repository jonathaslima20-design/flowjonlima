import type { BioThemeDefinition } from './types';
import { LiquidTheme, liquidMeta } from './liquid';
import { BentoTheme, bentoMeta } from './bento';
import { KineticTheme, kineticMeta } from './kinetic';
import { RetroosTheme, retroosMeta } from './retroos';
import { StickerTheme, stickerMeta } from './sticker';
import { ClayTheme, clayMeta } from './clay';
import { ArcadeTheme, arcadeMeta } from './arcade';
import { TicketTheme, ticketMeta } from './ticket';
import { ReceiptTheme, receiptMeta } from './receipt';
import { ScrapbookTheme, scrapbookMeta } from './scrapbook';
import { VinylTheme, vinylMeta } from './vinyl';
import { ChatTheme, chatMeta } from './chat';
import { NoirTheme, noirMeta } from './noir';
import { MemphisTheme, memphisMeta } from './memphis';
import { EsportsTheme, esportsMeta } from './esports';

// Coleção 2026: temas novos, registrados em themes/registry.ts
export const COLLECTION_2026: BioThemeDefinition[] = [
  { meta: liquidMeta, component: LiquidTheme },
  { meta: bentoMeta, component: BentoTheme },
  { meta: kineticMeta, component: KineticTheme },
  { meta: retroosMeta, component: RetroosTheme },
  { meta: stickerMeta, component: StickerTheme },
  { meta: clayMeta, component: ClayTheme },
  { meta: arcadeMeta, component: ArcadeTheme },
  { meta: ticketMeta, component: TicketTheme },
  { meta: receiptMeta, component: ReceiptTheme },
  { meta: scrapbookMeta, component: ScrapbookTheme },
  { meta: vinylMeta, component: VinylTheme },
  { meta: chatMeta, component: ChatTheme },
  { meta: noirMeta, component: NoirTheme },
  { meta: memphisMeta, component: MemphisTheme },
  { meta: esportsMeta, component: EsportsTheme },
];
