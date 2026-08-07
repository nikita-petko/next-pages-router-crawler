import type { MomentCreation } from '../types/MomentCreation';
import { MomentCreationStatus } from '../types/MomentCreation';

/**
 * Stable, unique in-browser identity for a moment row.
 *
 * Exists because `MomentCreation` is a union whose two halves carry different identifiers, not
 * because of `isMomentsFeedIdEnabled` — it takes no flag argument. The value is only ever used
 * client-side (React keys, `data-testid`s, dedupe across pages, in-session metadata overrides,
 * react-query cache surgery) and never sent to the server, so it only has to be stable within one
 * page load.
 *
 * The `?? ''` is unreachable: `parseMomentItemToCreation` drops any item missing the identifier the
 * flag selects, so a `ServerMomentCreation` that reaches the client always has at least one.
 */
export const getMomentRowKey = (moment: MomentCreation): string =>
  moment.status === MomentCreationStatus.DRAFT
    ? moment.draftId
    : (moment.feedItemId ?? moment.momentId ?? '');
