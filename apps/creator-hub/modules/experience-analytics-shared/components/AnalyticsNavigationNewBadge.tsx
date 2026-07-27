import { type FC, useEffect } from 'react';
import { Badge } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAuthentication } from '@modules/authentication/providers';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  useAnalyticsFeatureStorageScope,
  useHasUserSeenFeature,
} from '../hooks/useHasUserSeenFeature';

export { useAnalyticsFeatureStorageScope as useAnalyticsNavigationStorageScope } from '../hooks/useHasUserSeenFeature';

type AnalyticsNavigationNewBadgeProps = {
  readonly pagePath: string;
};

/**
 * Per-user, per-universe persistence for navigation items that should display
 * a New badge until the creator visits the corresponding page. Thin wrapper
 * around the generic {@link useHasUserSeenFeature}, keyed by `pagePath`.
 */
export const useHasUserSeenAnalyticsNavigationItem = (pagePath: string) =>
  useHasUserSeenFeature(pagePath);

export const useMarkAnalyticsNavigationItemSeenOnPageVisit = (pagePath: string): void => {
  const { user } = useAuthentication();
  const { scopeReady } = useAnalyticsFeatureStorageScope();
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
