import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { BannerCategory } from '@modules/charts-generic/components/StatusBanner';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { useIsOrangeSequestrationBannerOn } from '@modules/experience-analytics-shared/components/Banners/OrangeSequestrationBanner';
import { useIsQualityStatusBannerOn } from '@modules/experience-analytics-shared/components/Banners/QualityStatusBanner';
import { useIsYellowSequestrationBannerOn } from '@modules/experience-analytics-shared/components/Banners/YellowSequestrationBanner';
import { BannerCustomTarget } from '@modules/experience-analytics-shared/constants/statusConfig';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { useAnalyticsBannerConfiguration } from '@modules/experience-analytics-shared/hooks/useStatusConfiguration';
import { useIsSequestrationStatusBannerOn } from '@modules/ip/rights/components/banners/SequestrationStatusBanner';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { developerForum } from '@modules/miscellaneous/urls/creatorHub';
import type { UnifiedAlertItem } from '@modules/unified-alerts/types';
import { ExperienceOverviewAlertId } from '../ExperienceOverviewAlertIds';
import mapBannerConfigToAlertItem from '../utils/mapBannerConfigToAlertItem';

const experienceOverviewBannerTargets = [BannerCustomTarget.AnalyticOverviews];

const SAFETY_POLICY_FORUM_URL = `${developerForum.getBaseUrl()}/t/strengthening-our-safety-policies-and-tools/3882864`;

const useGetExperienceStatusAlertItem = (): UnifiedAlertItem | null => {
  const { id: universeId } = useUniverseResource();
  const { data: activeDataIssueBanners } = useAnalyticsBannerConfiguration(
    experienceOverviewBannerTargets,
    universeId,
    BannerCategory.ExperienceStatus,
  );
  const {
    params: { enableAudienceReachOnOverviewPage },
    isFetched: isIxpFetched,
  } = useIXPParameters(IXPLayers.CreatorHubCreationsPermission);
  const isSequestrationStatusBannerOn = useIsSequestrationStatusBannerOn();
  const isOrangeSequestrationBannerOn = useIsOrangeSequestrationBannerOn();
  const isYellowSequestrationBannerOn = useIsYellowSequestrationBannerOn();
  const isQualityStatusBannerOn = useIsQualityStatusBannerOn();

  const { translate } = useTranslationWrapper(useTranslation());

  // TODO (CSGO-2035): This banner solution is a stopgap to unblock a release as requested by product,
  // but leaves the banners in a messy situation where they can appear at multiple points on the page.
  // I will come back to refactor the banners into one priority ranking that appears on one point in the
  // page whenever product aligns on that ranking.
  return useMemo((): UnifiedAlertItem | null => {
    if (!isIxpFetched) {
      // To avoid banner flickering (will still have layout jumps though)
      return null;
    }
    // Priority order: Sequestration Status > Orange Sequestration > Yellow Sequestration > Quality Status > Backend-driven
    if (isSequestrationStatusBannerOn) {
      return {
        id: ExperienceOverviewAlertId.SequestrationStatus,
        title: translate(
          translationKey('Heading.Sequestered.BannerTitle', TranslationNamespace.Analytics),
        ),
        description: translate(
          translationKey(
            'Description.Sequestered.BannerDescriptionV2',
            TranslationNamespace.Analytics,
          ),
        ),
        dismissible: false,
      };
    }

    // duped by audience reach banner
    if (!enableAudienceReachOnOverviewPage && isOrangeSequestrationBannerOn) {
      return {
        id: ExperienceOverviewAlertId.OrangeSequestration,
        title: translate(
          translationKey('Heading.OrangeSequestered.BannerTitle', TranslationNamespace.Analytics),
        ),
        description: translate(
          translationKey(
            'Description.OrangeSequestered.BannerDescription',
            TranslationNamespace.Analytics,
          ),
        ),
        dismissible: false,
      };
    }

    // duped by audience reach banner
    if (!enableAudienceReachOnOverviewPage && isYellowSequestrationBannerOn) {
      return {
        id: ExperienceOverviewAlertId.YellowSequestration,
        title: translate(
          translationKey('Heading.YellowSequestered.BannerTitle', TranslationNamespace.Analytics),
        ),
        description: translate(
          translationKey(
            'Description.YellowSequestered.BannerDescription',
            TranslationNamespace.Analytics,
          ),
        ),
        learnMoreLink: SAFETY_POLICY_FORUM_URL,
        learnMoreText: translate(
          translationKey('Message.Alert.LearnMore', TranslationNamespace.Analytics),
        ),
        dismissible: false,
      };
    }

    if (isQualityStatusBannerOn) {
      return {
        id: ExperienceOverviewAlertId.QualityStatus,
        title: translate(
          translationKey('Heading.NoRecommendation.BannerTitle', TranslationNamespace.Analytics),
        ),
        description: translate(
          translationKey(
            'Description.NoRecommendation.BannerDescription',
            TranslationNamespace.Analytics,
          ),
        ),
        learnMoreLink: creatorHub.docs.getDiscoveryBestPracticesUrl(),
        learnMoreText: translate(
          translationKey('Link.LearnMore', TranslationNamespace.DeveloperItem),
        ),
        dismissible: false,
      };
    }

    if (activeDataIssueBanners.length > 0) {
      return mapBannerConfigToAlertItem(activeDataIssueBanners[0], translate);
    }

    return null;
  }, [
    enableAudienceReachOnOverviewPage,
    isIxpFetched,
    isSequestrationStatusBannerOn,
    isOrangeSequestrationBannerOn,
    isYellowSequestrationBannerOn,
    isQualityStatusBannerOn,
    activeDataIssueBanners,
    translate,
  ]);
};

export default useGetExperienceStatusAlertItem;
