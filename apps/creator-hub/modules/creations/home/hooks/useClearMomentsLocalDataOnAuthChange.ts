import { useEffect } from 'react';
import { useAuthentication } from '@modules/authentication/providers';
import { clearMomentVideoMediaUrlCache } from '../utils/momentsVideoMediaStorage';

/** Clears in-memory media blob URL cache when the active account changes. Per-user drafts persist across sign-out. */
export const useClearMomentsLocalDataOnAuthChange = (): void => {
  const { user } = useAuthentication();
  const userId = user?.id;

  useEffect(() => {
    return () => {
      if (userId !== undefined) {
        clearMomentVideoMediaUrlCache();
      }
    };
  }, [userId]);
};
