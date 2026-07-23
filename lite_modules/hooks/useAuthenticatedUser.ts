import { useRobloxAuthentication } from '@rbx/auth';

import useUserSession from '@hooks/useUserSession';
import { useAppStore } from '@stores/appStoreProvider';

export const useAuthenticatedUser = () => {
  const { user: robloxUser } = useRobloxAuthentication();
  const { authenticatedUser } = useUserSession();
  const { isAuthMigrationEnabled } = useAppStore((state) => state.appMetadataState.data);

  if (isAuthMigrationEnabled) {
    return robloxUser ?? null;
  }

  return authenticatedUser ?? null;
};
