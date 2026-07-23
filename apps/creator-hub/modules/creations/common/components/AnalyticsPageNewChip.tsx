import { FC, useMemo } from 'react';
import { Chip } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useAuthentication } from '@modules/authentication/providers';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';

type NewChipProps = {
  pagePath: string;
};

const hasUserSeenKey = (pagePath: string, userId: number) => `${pagePath}.${userId}.hasUserSeen`;

export const useHasUserSeenAnalyticsPage = (pagePath: string) => {
  const { user } = useAuthentication();
  const [hasUserSeen, setHasUserSeen] = useLocalStorage<boolean>(
    hasUserSeenKey(pagePath, user?.id ?? -1),
    false,
  );

  return useMemo(
    () => ({ hasUserSeen: user?.id ? hasUserSeen : false, setHasUserSeen }),
    [hasUserSeen, setHasUserSeen, user?.id],
  );
};

// Component to display a 'New' chip in navigation, based on local storage and DAU eligibility
// The chip will only appear for users who have not seen it before and whose universe has at least 100 DAU
const AnalyticsPageNewChip: FC<NewChipProps> = ({ pagePath }) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { hasUserSeen } = useHasUserSeenAnalyticsPage(pagePath);
  // The chip is only shown if the universe has performance monitoring access (equivalent to >=100 DAU)
  const {
    allowNewChipOnNavigationEnabled,
    experienceHasPerformanceMonitoringAccess: hasAtLeast100DAU,
  } = useFeatureFlagsForNamespace(
    ['allowNewChipOnNavigationEnabled', 'experienceHasPerformanceMonitoringAccess'],
    FeatureFlagNamespace.Analytics,
  );

  if (!allowNewChipOnNavigationEnabled || hasUserSeen || !hasAtLeast100DAU) {
    return null;
  }

  return (
    <Chip
      label={translate(translationKey('Label.New', TranslationNamespace.Analytics)) || 'New'}
      color='primaryBrand'
      variant='filled'
      component='span'
      size='small'
    />
  );
};

export default AnalyticsPageNewChip;
