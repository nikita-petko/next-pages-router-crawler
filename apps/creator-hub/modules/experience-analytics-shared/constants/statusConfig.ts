import type { TRAQIV2APIMetric } from '@rbx/creator-hub-analytics-config';
import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { BannerConfigurationWithoutKeyAndCategory } from '@modules/charts-generic/components/StatusBanner';
import { BannerSeverity } from '@modules/charts-generic/components/StatusBanner';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

// Banners
export enum BannerKey {
  GeneralDataDelayed = 'GeneralDataDelayed',
  MonetizationDataDelayed = 'MonetizationDataDelayed',
  GeneralDataIssue = 'GeneralDataIssue',
  AcquisitionDataIssue = 'AcquisitionDataIssue',
  MiddleEastTakedown = 'MiddleEastTakedown',
  MessagingServiceServersConnectedIssue = 'MessagingServiceServersConnectedIssue',
  ExperienceAlertsIssue = 'ExperienceAlertsIssue',
}

export enum BannerCustomTarget {
  AnalyticOverviews = 'CustomTargetAnalyticOverviews',
  AllAnalytics = 'CustomTargetAllAnalyticsPages',
  AdsAnalytics = 'CustomTargetAdsAnalytics',
}

export type TBannerTarget = TRAQIV2APIMetric | BannerCustomTarget;

export const bannerConfig: Record<BannerKey, BannerConfigurationWithoutKeyAndCategory> = {
  [BannerKey.GeneralDataDelayed]: {
    titleKey: translationKey('Title.GeneralBreakglassBanner', TranslationNamespace.Analytics),
    descriptionKey: translationKey(
      'Description.GeneralBreakglassBanner',
      TranslationNamespace.Analytics,
    ),
    severity: BannerSeverity.Warning,
  },
  [BannerKey.GeneralDataIssue]: {
    titleKey: translationKey('Title.GeneralDataIssueBanner', TranslationNamespace.Analytics),
    descriptionKey: translationKey(
      'Description.GeneralBreakglassBanner',
      TranslationNamespace.Analytics,
    ),
    severity: BannerSeverity.Warning,
  },
  [BannerKey.MonetizationDataDelayed]: {
    titleKey: translationKey('Title.MonetizationBreakglassBanner', TranslationNamespace.Analytics),
    descriptionKey: translationKey(
      'Description.MonetizationBreakglassBanner',
      TranslationNamespace.Analytics,
    ),
    severity: BannerSeverity.Warning,
  },
  [BannerKey.AcquisitionDataIssue]: {
    titleKey: translationKey(
      'Title.AcquisitionDataIssueBanner.FriendsRename',
      TranslationNamespace.Analytics,
    ),
    descriptionKey: translationKey(
      'Description.GeneralBreakglassBanner',
      TranslationNamespace.Analytics,
    ),
    severity: BannerSeverity.Warning,
  },
  [BannerKey.MiddleEastTakedown]: {
    titleKey: translationKey('Title.MiddleEastTakedownBanner', TranslationNamespace.Analytics),
    descriptionKey: translationKey(
      'Description.MiddleEastTakedownBanner',
      TranslationNamespace.Analytics,
    ),
    severity: BannerSeverity.Info,
    primaryActionConfig: {
      text: translationKey('Action.ViewDetails', TranslationNamespace.Analytics),
      link: '',
    },
    logKey: 'middleEastTakedown',
    dismissalKey: 'middleEastTakedown',
  },
  [BannerKey.MessagingServiceServersConnectedIssue]: {
    titleKey: translationKey('Title.GeneralDataIssueBanner', TranslationNamespace.Analytics),
    descriptionKey: translationKey(
      'Description.MessagingServiceServersConnectedIssue',
      TranslationNamespace.Analytics,
    ),
    severity: BannerSeverity.Warning,
  },
  [BannerKey.ExperienceAlertsIssue]: {
    titleKey: translationKey('Title.ExperienceAlertsIssueBanner', TranslationNamespace.Analytics),
    descriptionKey: translationKey(
      'Description.GeneralBreakglassBanner',
      TranslationNamespace.Analytics,
    ),
    severity: BannerSeverity.Warning,
  },
};

// Annotations
export enum AnnotationKey {
  QPlays202512 = 'QPlays202512',
  AgeCheck20260107 = 'AgeCheck20260107',
  AgeCheck20260415 = 'AgeCheck20260415',
  AgeGroupUpdate20251020 = 'AgeGroupUpdate20251020',
  AgeGroupUpdate20260116 = 'AgeGroupUpdate20260116',
}

export const annotationConfig: Record<
  AnnotationKey,
  {
    translationKey: TranslationKey;
    links: string[];
  }
> = {
  [AnnotationKey.QPlays202512]: {
    translationKey: translationKey(
      'Label.Annotation.MetricChange.QPlays202512',
      TranslationNamespace.Analytics,
    ),
    links: [
      'https://devforum.roblox.com/t/boost-your-discovery-with-the-improved-recommended-for-you-algorithm-and-analytics-for-creators/3587441/1',
    ],
  },
  [AnnotationKey.AgeCheck20260107]: {
    translationKey: translationKey(
      'Label.Annotation.MetricChange.AgeCheck20260107',
      TranslationNamespace.Analytics,
    ),
    links: [],
  },
  [AnnotationKey.AgeCheck20260415]: {
    translationKey: translationKey(
      // using the same label as AgeCheck20260107
      'Label.Annotation.MetricChange.AgeCheck20260107',
      TranslationNamespace.Analytics,
    ),
    links: [],
  },
  [AnnotationKey.AgeGroupUpdate20251020]: {
    translationKey: translationKey(
      'Label.Annotation.MetricChange.AgeGroupUpdate20251020',
      TranslationNamespace.Analytics,
    ),
    links: [],
  },
  [AnnotationKey.AgeGroupUpdate20260116]: {
    // using the same label as AgeGroupUpdate20251020
    translationKey: translationKey(
      'Label.Annotation.MetricChange.AgeGroupUpdate20251020',
      TranslationNamespace.Analytics,
    ),
    links: [],
  },
};

// Chart warnings
export enum ChartWarningKey {
  GeneralDataIssueWarning = 'GeneralDataIssueWarning',
}

export type TChartWarningConfig = { descriptionKey: TranslationKey };
export const chartWarningConfig: Record<ChartWarningKey, TChartWarningConfig> = {
  [ChartWarningKey.GeneralDataIssueWarning]: {
    descriptionKey: translationKey('Title.GeneralDataIssueBanner', TranslationNamespace.Analytics),
  },
};
