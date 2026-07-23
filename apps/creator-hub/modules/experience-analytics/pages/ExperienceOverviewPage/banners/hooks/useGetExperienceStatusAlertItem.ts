import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { urls } from '@modules/miscellaneous/common';
import {
  useIsQualityStatusBannerOn,
  useIsYellowSequestrationBannerOn,
  useIsOrangeSequestrationBannerOn,
  useUniverseResource,
  useAnalyticsBannerConfiguration,
  BannerCustomTarget,
} from '@modules/experience-analytics-shared';
import { useIsSequestrationStatusBannerOn } from '@modules/ip/rights/components/banners/SequestrationStatusBanner';
import { BannerCategory, useLocale } from '@modules/charts-generic';
import type { UnifiedAlertItem } from '@modules/unified-alerts/types';
import { developerForum } from '@modules/miscellaneous/common/urls/creatorHub';
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
  const isSequestrationStatusBannerOn = useIsSequestrationStatusBannerOn();
  const isOrangeSequestrationBannerOn = useIsOrangeSequestrationBannerOn();
  const isYellowSequestrationBannerOn = useIsYellowSequestrationBannerOn();
  const isQualityStatusBannerOn = useIsQualityStatusBannerOn();

  const { translate } = useTranslationWrapper(useTranslation());
  const locale = useLocale();

  return useMemo((): UnifiedAlertItem | null => {
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

    if (isOrangeSequestrationBannerOn) {
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
        learnMoreLink: `https://en.help.roblox.com/hc/${locale}/articles/21416271342868-Content-Moderation-on-Roblox`,
        learnMoreText: translate(
          translationKey('Message.Alert.LearnMore', TranslationNamespace.Analytics),
        ),
        dismissible: false,
      };
    }

    if (isYellowSequestrationBannerOn) {
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
        learnMoreLink: urls.creatorHub.docs.getDiscoveryBestPracticesUrl(),
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
    isSequestrationStatusBannerOn,
    isOrangeSequestrationBannerOn,
    isYellowSequestrationBannerOn,
    isQualityStatusBannerOn,
    activeDataIssueBanners,
    translate,
    locale,
  ]);
};

export default useGetExperienceStatusAlertItem;
