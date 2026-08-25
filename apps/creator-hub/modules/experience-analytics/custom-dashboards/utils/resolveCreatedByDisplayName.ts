import { UNRESOLVED_CREATED_BY_USERNAME } from '../constants/unresolvedCreatedByUsername';
import type { UserDisplayNamesById } from '../hooks/useUserDisplayNamesQuery';

/**
 * Visible creator name for a dashboard whose API metadata may only include a
 * user id. Prefers the batch display-name lookup used by Manage All. A stored
 * username is used only when it is a real identity (not blank / the unresolved
 * sentinel). While a lookup for a valid id is still in flight, returns `null`
 * so callers can omit the subtitle instead of flashing "unknown".
 */
export function resolveCreatedByDisplayName({
  createdByUserId,
  createdByUsername,
  displayNamesById,
  isLookupPending,
  unknownCreatorLabel,
}: {
  readonly createdByUserId: number;
  readonly createdByUsername: string;
  readonly displayNamesById: UserDisplayNamesById;
  readonly isLookupPending: boolean;
  readonly unknownCreatorLabel: string;
}): string | null {
  const resolvedDisplayName = displayNamesById.get(createdByUserId);
  if (resolvedDisplayName) {
    return resolvedDisplayName;
  }

  const hasPersistedUsername =
    createdByUsername.length > 0 && createdByUsername !== UNRESOLVED_CREATED_BY_USERNAME;
  if (hasPersistedUsername) {
    return createdByUsername;
  }

  if (isLookupPending && createdByUserId > 0) {
    return null;
  }

  return unknownCreatorLabel;
}
