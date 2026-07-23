import { type FC, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Badge } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAuthentication } from '@modules/authentication/providers';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

type AnalyticsNavigationNewBadgeProps = {
  readonly pagePath: string;
};

/**
 * Route scope for analytics-navigation localStorage, keyed to the signed-in
 * user and the universe in the dynamic `[id]` route.
 */
export const useAnalyticsNavigationStorageScope = () => {
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

const analyticsNavigationItemSeenStorageKey = (
  pagePath: string,
  universeId: number | string,
  userId: number,
) => `${pagePath}.${universeId}.${userId}.hasUserSeen`;

const noopSetBadgeSeen = () => {};

/**
 * Per-user, per-universe persistence for navigation items that should display
 * a New badge until the creator visits the corresponding page.
 */
export const useHasUserSeenAnalyticsNavigationItem = (pagePath: string) => {
  const { user } = useAuthentication();
  const { universeId, scopeReady } = useAnalyticsNavigationStorageScope();
  const hiddenUntilScopeReady = !scopeReady;
  const [hasUserSeen, setHasUserSeen] = useLocalStorage<boolean>(
    analyticsNavigationItemSeenStorageKey(pagePath, universeId, user?.id ?? -1),
    false,
  );

  return useMemo(
    () => ({
      hasUserSeen: !user?.id ? false : hiddenUntilScopeReady ? true : hasUserSeen,
      setHasUserSeen: hiddenUntilScopeReady ? noopSetBadgeSeen : setHasUserSeen,
    }),
    [hasUserSeen, hiddenUntilScopeReady, setHasUserSeen, user?.id],
  );
};

export const useMarkAnalyticsNavigationItemSeenOnPageVisit = (pagePath: string): void => {
  const { user } = useAuthentication();
  const { scopeReady } = useAnalyticsNavigationStorageScope();
  const { setHasUserSeen } = useHasUserSeenAnalyticsNavigationItem(pagePath);

  useEffect(() => {
    if (!scopeReady || !user?.id) {
      return;
    }
    setHasUserSeen(true);
  }, [scopeReady, setHasUserSeen, user?.id]);
};

/** New badge for a left-navigation entry, hidden after its page is visited. */
const AnalyticsNavigationNewBadge: FC<AnalyticsNavigationNewBadgeProps> = ({ pagePath }) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { hasUserSeen } = useHasUserSeenAnalyticsNavigationItem(pagePath);

  if (hasUserSeen) {
    return null;
  }

  return (
    <Badge
      label={translate(translationKey('Label.New', TranslationNamespace.Analytics))}
      variant='Emphasis'
    />
  );
};

export default AnalyticsNavigationNewBadge;
