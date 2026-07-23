import { useEffect } from 'react';
import { useLocalStorage } from '@rbx/react-utilities';
import { useAuthentication } from '@modules/authentication/providers';
import { noop } from '../noop';

type Args = {
  featureKey: string;
  universeId: number | undefined;
  setOnMount?: boolean;
};

type Result = {
  hasSeen: boolean;
  setHasSeen: (value: boolean) => void;
};

// localStorage key for an authenticated user + universe scope. Manual QA reset:
// remove the matching `${featureKey}.${universeId}.${userId}.hasUserSeen` entry.
const buildKey = (featureKey: string, universeId: number, userId: number) =>
  `${featureKey}.${universeId}.${userId}.hasUserSeen`;

/**
 * Generic per-user, per-universe "has seen this feature" flag backed by
 * localStorage. Treats unresolved scope (no signed-in user or no universe in
 * scope) as "already seen" so chips and other announcements stay hidden until
 * the storage key is fully resolved, preventing a flash before the scope settles.
 *
 * Pass `setOnMount: true` to mark the feature seen on mount once scope is ready.
 */
export const useHasSeenFeature = ({ featureKey, universeId, setOnMount = false }: Args): Result => {
  const { user } = useAuthentication();
  const userId = user?.id;

  // useLocalStorage requires a stable key string per render; when scope isn't
  // resolved we still pass a sentinel so the hook keeps its render shape, and
  // ignore reads/writes via the guards below.
  const key = buildKey(featureKey, universeId ?? -1, userId ?? -1);
  const [hasSeen, setHasSeen] = useLocalStorage<boolean>(key, false);

  const scopeReady = !!userId && !!universeId;
  const effectiveSetHasSeen = scopeReady ? setHasSeen : noop;

  useEffect(() => {
    if (setOnMount && scopeReady) {
      effectiveSetHasSeen(true);
    }
  }, [setOnMount, scopeReady, effectiveSetHasSeen]);

  return {
    hasSeen: scopeReady ? hasSeen : true,
    setHasSeen: effectiveSetHasSeen,
  };
};
