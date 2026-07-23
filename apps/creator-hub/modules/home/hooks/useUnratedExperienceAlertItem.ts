import { ComponentType } from 'react';
import { skipToken, useQuery } from '@tanstack/react-query';
import { useTranslation } from '@rbx/intl';
import { useGroups } from '@modules/providers/groups/GroupsProvider';
import { useAuthentication } from '@modules/authentication/providers';
import { useSettings } from '@modules/settings';
import { useGetActivationEligibilityForUser } from '@modules/react-query/develop';
import { StepsToGoPublicModal } from '@modules/creations';
import type { UnifiedAlertItem, UnifiedAlertModalProps } from '@modules/unified-alerts/types';
import getUnratedExperienceBanner from '../components/unratedExperienceBanner/queryFunction';

/**
 * Hook that returns either an unrated experience alert or activation eligibility alert.
 * These are mutually exclusive - only one will be returned based on the conditions.
 *
 * Priority:
 * 1. Public Publish Eligibility alert (if user is not eligible for public publish)
 * 2. Unrated experience alert (if user has unrated experiences)
 * 3. null (if neither condition is met)
 */
export const useUnratedExperienceAlertItem = (): UnifiedAlertItem | null => {
  const { translate } = useTranslation();
  const { user, isFetched: isFetchedUser } = useAuthentication();
  const { currentGroup, isFetched: isFetchedGroups } = useGroups();
  const {
    settings: { unratedExperienceBannerLink },
    isFetched: isFetchedSettings,
  } = useSettings();
  const { data: activationEligibility, isFetched: isFetchedActivationEligibility } =
    useGetActivationEligibilityForUser();

  const allFetched =
    isFetchedGroups && isFetchedUser && isFetchedSettings && isFetchedActivationEligibility;

  const id = (currentGroup?.id || user?.id) as number;

  const { data } = useQuery({
    queryKey: ['creatorHome', 'unratedBanner', currentGroup?.id, user?.id],
    queryFn:
      allFetched && user
        ? async () => {
            return getUnratedExperienceBanner({ id, group: Boolean(currentGroup) });
          }
        : skipToken,
  });

  if (!allFetched) {
    return null;
  }

  // Priority 1: Public Publish Eligibility banner
  // Show if user is not eligible for public publish
  if (activationEligibility?.isEligible === false) {
    return {
      id: 'activation-eligibility',
      title: translate('Message.PublicPublishRequirementsNotMet'),
      ctaText: translate('Action.GenericLearnMore'),
      dismissible: false,
      // StepsToGoPublicModal has optional universeId - omitting it shows generic user-level steps
      Modal: StepsToGoPublicModal as ComponentType<UnifiedAlertModalProps>,
    };
  }

  // Priority 2: Unrated experience banner
  const hasUnratedExperiences = data?.universeIds && data?.universeIds?.length > 0;
  if (hasUnratedExperiences) {
    return {
      id: 'unrated-experiences',
      title: translate('Title.UnratedExperiencesUnplayable'),
      learnMoreLink: unratedExperienceBannerLink,
      learnMoreText: translate('Label.ViewPolicy'),
      ctaText: translate('Label.ViewExperiences'),
      ctaOnClick: () => {
        window.location.href = '/dashboard/creations';
      },
      dismissible: false,
    };
  }

  return null;
};

export default useUnratedExperienceAlertItem;
