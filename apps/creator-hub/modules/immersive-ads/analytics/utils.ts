import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

enum AnalyticsViewType {
  Overview = 'Overview',
  RewardedAds = 'RewardedAds',
  VideoAds = 'VideoAds',
  PortalAds = 'PortalAds',
  ImageAds = 'ImageAds',
}

interface AnalyticsView {
  type: AnalyticsViewType;
  nameKey: TranslationKey;
}

const analyticsViewItems: AnalyticsView[] = [
  {
    type: AnalyticsViewType.Overview,
    nameKey: translationKey('Heading.Overview', TranslationNamespace.ImmersiveAdsAnalytics),
  },
  {
    type: AnalyticsViewType.RewardedAds,
    nameKey: translationKey('Heading.RewardedAds', TranslationNamespace.ImmersiveAdsAnalytics),
  },
  {
    type: AnalyticsViewType.VideoAds,
    nameKey: translationKey('Heading.ImmersiveVideo', TranslationNamespace.ImmersiveAdsAnalytics),
  },
  {
    type: AnalyticsViewType.ImageAds,
    nameKey: translationKey('Heading.ImmersiveImage', TranslationNamespace.ImmersiveAdsAnalytics),
  },
  {
    type: AnalyticsViewType.PortalAds,
    nameKey: translationKey('Heading.ImmersivePortal', TranslationNamespace.ImmersiveAdsAnalytics),
  },
];

export { AnalyticsViewType, analyticsViewItems };
