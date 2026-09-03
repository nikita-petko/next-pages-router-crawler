import type { TStatusBadgeVariant } from '@rbx/foundation-ui';
import { UniverseSessionExitReason } from '@modules/clients/analytics/universeSessionMetadataApi';
import { MISSING_VALUE_PLACEHOLDER } from './clientSessionFormatters';

const MISSING_STATUS_BADGE_VARIANT: TStatusBadgeVariant = 'Standard';

export const CLIENT_SESSION_STATUS_BADGE_VARIANTS = {
  [UniverseSessionExitReason.Active]: 'Success',
  [UniverseSessionExitReason.Ended]: 'Standard',
  [UniverseSessionExitReason.Crashed]: 'Alert',
} as const satisfies Record<UniverseSessionExitReason, TStatusBadgeVariant>;

export const getClientSessionStatusBadge = (
  exitReason: UniverseSessionExitReason | null,
  labels: Record<UniverseSessionExitReason, string>,
): { readonly label: string; readonly variant: TStatusBadgeVariant } => {
  if (exitReason == null) {
    return { label: MISSING_VALUE_PLACEHOLDER, variant: MISSING_STATUS_BADGE_VARIANT };
  }

  return {
    label: labels[exitReason],
    variant: CLIENT_SESSION_STATUS_BADGE_VARIANTS[exitReason],
  };
};
