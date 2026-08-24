import type { TStatusBadgeVariant } from '@rbx/foundation-ui';
import { UniverseSessionExitReason } from '@modules/clients/analytics/universeSessionMetadataApi';

export const CLIENT_SESSION_STATUS_BADGE_VARIANTS = {
  [UniverseSessionExitReason.Invalid]: 'Standard',
  [UniverseSessionExitReason.Active]: 'Success',
  [UniverseSessionExitReason.Ended]: 'Standard',
  [UniverseSessionExitReason.Crashed]: 'Alert',
} as const satisfies Record<UniverseSessionExitReason, TStatusBadgeVariant>;
