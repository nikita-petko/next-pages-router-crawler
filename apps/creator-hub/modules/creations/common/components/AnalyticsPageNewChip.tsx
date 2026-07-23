import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import { Chip } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAuthentication } from '@modules/authentication/providers';
import { useAnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

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
  const { id: universeId } = useUniverseResource();
  // The chip is only shown if the universe has performance monitoring access (equivalent to >=100 DAU)
  const { experienceHasPerformanceMonitoringAccess: hasAtLeast100DAU } =
    useAnalyticsExperiencePermissions(universeId);

  if (hasUserSeen || !hasAtLeast100DAU) {
    return null;
  }

  return (
    <Chip
      label={translate(translationKey('Label.New', TranslationNamespace.Analytics))}
      color='primaryBrand'
      variant='filled'
      component='span'
      size='small'
    />
  );
};

export default AnalyticsPageNewChip;
