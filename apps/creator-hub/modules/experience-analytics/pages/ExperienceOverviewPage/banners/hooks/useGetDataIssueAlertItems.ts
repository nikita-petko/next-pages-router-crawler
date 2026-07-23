import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { BannerCategory } from '@modules/charts-generic';
import {
  useIsGeneralBreakglassBannerOn,
  useIsMonetizationBreakglassBannerOn,
  useAnalyticsBannerConfiguration,
  BannerCustomTarget,
  useUniverseResource,
} from '@modules/experience-analytics-shared';
import type { UnifiedAlertItem } from '@modules/unified-alerts/types';
import { ExperienceOverviewAlertId } from '../ExperienceOverviewAlertIds';
import mapBannerConfigToAlertItem from '../utils/mapBannerConfigToAlertItem';

const experienceOverviewBannerTargets = [BannerCustomTarget.AnalyticOverviews];

const useGetDataIssueAlertItems = (): UnifiedAlertItem[] => {
  const { id: universeId } = useUniverseResource();
  const { data: activeDataIssueBanners } = useAnalyticsBannerConfiguration(
    experienceOverviewBannerTargets,
    universeId,
    BannerCategory.DataIssue,
  );
  const isGeneralBreakglassBannerOn = useIsGeneralBreakglassBannerOn();
  const isMonetizationBreakglassBannerOn = useIsMonetizationBreakglassBannerOn();

  const { translate } = useTranslationWrapper(useTranslation());

  return useMemo((): UnifiedAlertItem[] => {
    // Priority order: Backend-defined banners > General Breakglass > Monetization Breakglass
    if (activeDataIssueBanners.length > 0) {
      return activeDataIssueBanners.map((banner) => mapBannerConfigToAlertItem(banner, translate));
    }

    if (isGeneralBreakglassBannerOn) {
      return [
        {
          id: ExperienceOverviewAlertId.GeneralBreakglass,
          title: translate(
            translationKey('Title.GeneralBreakglassBanner', TranslationNamespace.Analytics),
          ),
          description: translate(
            translationKey('Description.GeneralBreakglassBanner', TranslationNamespace.Analytics),
          ),
          dismissible: false,
        },
      ];
    }

    if (isMonetizationBreakglassBannerOn) {
      return [
        {
          id: ExperienceOverviewAlertId.MonetizationBreakglass,
          title: translate(
            translationKey('Title.MonetizationBreakglassBanner', TranslationNamespace.Analytics),
          ),
          description: translate(
            translationKey(
              'Description.MonetizationBreakglassBanner',
              TranslationNamespace.Analytics,
            ),
          ),
          dismissible: false,
        },
      ];
    }

    return [];
  }, [
    activeDataIssueBanners,
    isGeneralBreakglassBannerOn,
    isMonetizationBreakglassBannerOn,
    translate,
  ]);
};

export default useGetDataIssueAlertItems;
