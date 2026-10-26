import type { BioThemeDefinition } from './types';
import { LiquidTheme, liquidMeta } from './liquid';
import { BentoTheme, bentoMeta } from './bento';
import { SpatialTheme, spatialMeta } from './spatial';
import { HoloTheme, holoMeta } from './holo';
import { KineticTheme, kineticMeta } from './kinetic';
import { RetroosTheme, retroosMeta } from './retroos';
import { StickerTheme, stickerMeta } from './sticker';
import { FluxTheme, fluxMeta } from './flux';
import { ClayTheme, clayMeta } from './clay';
import { WalletTheme, walletMeta } from './wallet';
import { Y2kTheme, y2kMeta } from './y2k';
import { ArcadeTheme, arcadeMeta } from './arcade';
import { TicketTheme, ticketMeta } from './ticket';
import { ReceiptTheme, receiptMeta } from './receipt';
import { ScrapbookTheme, scrapbookMeta } from './scrapbook';
import { HudTheme, hudMeta } from './hud';
import { VinylTheme, vinylMeta } from './vinyl';
import { ChatTheme, chatMeta } from './chat';
import { NoirTheme, noirMeta } from './noir';
import { PapercutTheme, papercutMeta } from './papercut';
import { MemphisTheme, memphisMeta } from './memphis';
import { EsportsTheme, esportsMeta } from './esports';
import { StoriesTheme, storiesMeta } from './stories';

// Coleção 2026: temas novos, registrados em themes/registry.ts
export const COLLECTION_2026: BioThemeDefinition[] = [
  { meta: liquidMeta, component: LiquidTheme },
  { meta: bentoMeta, component: BentoTheme },
  { meta: spatialMeta, component: SpatialTheme },
  { meta: holoMeta, component: HoloTheme },
  { meta: kineticMeta, component: KineticTheme },
  { meta: retroosMeta, component: RetroosTheme },
  { meta: stickerMeta, component: StickerTheme },
  { meta: fluxMeta, component: FluxTheme },
  { meta: clayMeta, component: ClayTheme },
  { meta: walletMeta, component: WalletTheme },
  { meta: y2kMeta, component: Y2kTheme },
  { meta: arcadeMeta, component: ArcadeTheme },
  { meta: ticketMeta, component: TicketTheme },
  { meta: receiptMeta, component: ReceiptTheme },
  { meta: scrapbookMeta, component: ScrapbookTheme },
  { meta: hudMeta, component: HudTheme },
  { meta: vinylMeta, component: VinylTheme },
  { meta: chatMeta, component: ChatTheme },
  { meta: noirMeta, component: NoirTheme },
  { meta: papercutMeta, component: PapercutTheme },
  { meta: memphisMeta, component: MemphisTheme },
  { meta: esportsMeta, component: EsportsTheme },
  { meta: storiesMeta, component: StoriesTheme },
];
