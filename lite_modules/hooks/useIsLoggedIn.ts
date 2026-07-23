import { useRobloxAuthentication } from '@rbx/auth';

import useUserSession from '@hooks/useUserSession';
import { useAppStore } from '@stores/appStoreProvider';

export const useIsLoggedIn = () => {
  const { user: robloxUser } = useRobloxAuthentication();
  const { authenticatedUser } = useUserSession();
  const { isAuthMigrationEnabled } = useAppStore((state) => state.appMetadataState.data);

  if (isAuthMigrationEnabled) {
    return Boolean(robloxUser);
  }

  return Boolean(authenticatedUser);
};
