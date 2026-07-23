import React, { ReactElement } from 'react';
import {
  QualityStatusBanner,
  YellowSequestrationBanner,
  OrangeSequestrationBanner,
  GeneralBreakglassBanner,
  MonetizationBreakglassBanner,
  BannerKey,
  bannerConfig,
  UnratedExperienceBanner,
  UnratedExperienceBannerType,
} from '@modules/experience-analytics-shared';
import SequestrationStatusBanner from '@modules/ip/rights/components/banners/SequestrationStatusBanner';
import { SingleStatusBanner } from '@modules/charts-generic';
import { ActivationEligibilityBanner } from '@modules/creations';
import type { UnifiedAlertItem } from '@modules/unified-alerts/types';
import { ExperienceOverviewAlertId } from '../ExperienceOverviewAlertIds';

/**
 * Maps a UnifiedAlertItem back to its original legacy banner ReactElement.
 * Used in the legacy rendering path (when the unified alert flag is off)
 * to preserve the exact visual output of the original banner components.
 */
const renderAlertItemAsLegacyBanner = (
  item: UnifiedAlertItem,
  universeId?: number,
): ReactElement => {
  switch (item.id) {
    case ExperienceOverviewAlertId.SequestrationStatus:
      return <SequestrationStatusBanner key={item.id} />;
    case ExperienceOverviewAlertId.OrangeSequestration:
      return <OrangeSequestrationBanner key={item.id} />;
    case ExperienceOverviewAlertId.YellowSequestration:
      return <YellowSequestrationBanner key={item.id} />;
    case ExperienceOverviewAlertId.QualityStatus:
      return <QualityStatusBanner key={item.id} />;
    case ExperienceOverviewAlertId.GeneralBreakglass:
      return <GeneralBreakglassBanner key={item.id} />;
    case ExperienceOverviewAlertId.MonetizationBreakglass:
      return <MonetizationBreakglassBanner key={item.id} />;
    case ExperienceOverviewAlertId.ActivationEligibility:
      return <ActivationEligibilityBanner key={item.id} />;
    case ExperienceOverviewAlertId.UnratedExperience:
      return (
        <UnratedExperienceBanner key={item.id} bannerType={UnratedExperienceBannerType.Unrated} />
      );
    case ExperienceOverviewAlertId.UnratedExperienceGracePeriod:
      return (
        <UnratedExperienceBanner
          key={item.id}
          bannerType={UnratedExperienceBannerType.GracePeriod}
        />
      );
    default: {
      // Backend-driven banners use BannerKey as their id
      const bannerKey = item.id as BannerKey;
      const config = bannerConfig[bannerKey];
      if (config) {
        return (
          <SingleStatusBanner
            key={item.id}
            bannerConfig={{ key: bannerKey, ...config }}
            universeId={universeId}
          />
        );
      }
      return <React.Fragment key={item.id} />;
    }
  }
};

export default renderAlertItemAsLegacyBanner;
