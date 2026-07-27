import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { useLocalStorage } from '@rbx/react-utilities';
import { useAuthentication } from '@modules/authentication/providers';

/**
 * Route scope for analytics "seen feature" localStorage, keyed to the
 * signed-in user and the universe in the dynamic `[id]` route.
 */
export const useAnalyticsFeatureStorageScope = () => {
  const router = useRouter();
  const rawUniverseId = router.query?.id;
  const universeIdFromQuery =
    rawUniverseId == null || Array.isArray(rawUniverseId) ? null : rawUniverseId;
  const scopeReady = router.isReady && universeIdFromQuery != null;

  return {
    universeId: universeIdFromQuery ?? -1,
    scopeReady,
    universeIdFromQuery,
  };
};

const hasUserSeenFeatureStorageKey = (key: string, universeId: number | string, userId: number) =>
  `${key}.${universeId}.${userId}.hasUserSeen`;

const noopSetHasUserSeen = () => {};

/**
 * Generic per-user, per-universe "has seen this feature" flag backed by
 * localStorage. `key` is any caller-chosen string (nav item path, banner id,
 * etc.) — callers must ensure keys are unique enough not to collide with
 * unrelated features.
 *
 * `isReady` reflects whether `hasUserSeen` reflects the real persisted value
 * (auth resolved and universe scope known) rather than a not-yet-determined
 * default; callers that must not flash their feature before its dismissed
 * state is known (e.g. a banner, as opposed to an optimistic "New" badge)
 * should gate rendering on it.
 */
export const useHasUserSeenFeature = (key: string) => {
  const { user, isFetched: isAuthFetched } = useAuthentication();
  const { universeId, scopeReady } = useAnalyticsFeatureStorageScope();
  const hiddenUntilScopeReady = !scopeReady;
  const [hasUserSeen, setHasUserSeen] = useLocalStorage<boolean>(
    hasUserSeenFeatureStorageKey(key, universeId, user?.id ?? -1),
    false,
  );

  return useMemo(
    () => ({
      hasUserSeen: !user?.id ? false : hiddenUntilScopeReady ? true : hasUserSeen,
      setHasUserSeen: hiddenUntilScopeReady ? noopSetHasUserSeen : setHasUserSeen,
      isReady: isAuthFetched && scopeReady,
    }),
    [hasUserSeen, hiddenUntilScopeReady, isAuthFetched, scopeReady, setHasUserSeen, user?.id],
  );
};
