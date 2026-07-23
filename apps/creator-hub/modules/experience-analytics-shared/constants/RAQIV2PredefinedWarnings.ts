import { AnnotationType, RAQIV2QueryFilter } from '@modules/clients/analytics';
import { RAQIV2Metric, TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import { translationKey, TranslationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getCachedUniverseEligibility } from '@modules/react-query/affiliateLinks';

export enum RAQIV2PredefinedWarningCondition {
  Always = 'Always',
  HasAnnotation = 'HasAnnotation',
  HasFilterOnSpecificValue = 'HasFilterOnSpecificValue',
  UniverseEligibility = 'UniverseEligibility',
  // TODO(shumingxu@20240618): DSA-2477 - could add more conditions here for breakdown and double counting
}

export enum RAQIV2UniverseEligibilityCondition {
  Eligible = 'Eligible',
  NotEligible = 'NotEligible',
}

type TRAQIV2PredefinedWarning =
  | {
      type: RAQIV2PredefinedWarningCondition.Always;
      warning: RAQIV2PredefinedWarnings;
    }
  | {
      type: RAQIV2PredefinedWarningCondition.HasAnnotation;
      annotationType: AnnotationType;
      warning: RAQIV2PredefinedWarnings;
    }
  | {
      type: RAQIV2PredefinedWarningCondition.HasFilterOnSpecificValue;
      filter: RAQIV2QueryFilter;
      warning: RAQIV2PredefinedWarnings;
    }
  | {
      type: RAQIV2PredefinedWarningCondition.UniverseEligibility;
      warning: RAQIV2PredefinedWarnings;
      fetchEligibility:
        | ((universeId: number) => boolean | undefined)
        | ((universeId: number) => Promise<boolean | undefined>);
      shownWhen: RAQIV2UniverseEligibilityCondition;
    };

export enum RAQIV2PredefinedWarnings {
  SubscriptionEngagementPayoutsPortalAdsRevenueExcluded = 'SubscriptionEngagementPayoutsPortalAdsRevenueExcluded',
  FunnelStepNameChangeDuringTimePeriodWithLink = 'FunnelStepNameChangeDuringTimePeriodWithLink',
  ShareLinkCampaignExcluded = 'ShareLinkCampaignExcluded',
  ShareLinkCampaignQualifiedPlay = 'ShareLinkCampaignQualifiedPlay',
  CreatorRewardsAudienceExpansionEligibility = 'CreatorRewardsAudienceExpansionEligibility',
  CreatorRewardsNegativePayoutDisclaimer = 'CreatorRewardsNegativePayoutDisclaimer',
  ExperienceEventsNotificationJoinData = 'ExperienceEventsNotificationJoinData',
  ImmersiveAdsImpressions = 'ImmersiveAdsImpressions',
  PortalAdsImpressions = 'PortalAdsImpressions',
  ImmersiveAdsExcludesUnvalidatedData = 'ImmersiveAdsExcludesUnvalidatedData',
  ClientCrashRateNoisyData = 'ClientCrashRateNoisyData',
  PlatformCrashExplaination = 'PlatformCrashExplaination',
}

export const RAQIV2MetricWarningsConfig: Map<TRAQIV2UIMetric, TRAQIV2PredefinedWarning[]> = new Map(
  [
    [
      RAQIV2Metric.Attribution30DRobuxPerUser,
      [
        {
          type: RAQIV2PredefinedWarningCondition.Always,
          warning: RAQIV2PredefinedWarnings.SubscriptionEngagementPayoutsPortalAdsRevenueExcluded,
        },
      ],
    ],
    [
      RAQIV2Metric.Attribution30DRobuxPerUserMigration,
      [
        {
          type: RAQIV2PredefinedWarningCondition.Always,
          warning: RAQIV2PredefinedWarnings.SubscriptionEngagementPayoutsPortalAdsRevenueExcluded,
        },
      ],
    ],
    [
      RAQIV2Metric.FunnelUsersRealtime,
      [
        {
          type: RAQIV2PredefinedWarningCondition.HasAnnotation,
          annotationType: AnnotationType.FunnelStepNameChange,
          warning: RAQIV2PredefinedWarnings.FunnelStepNameChangeDuringTimePeriodWithLink,
        },
      ],
    ],
    [
      RAQIV2Metric.ShareLinkUniqueUsersWithClicks,
      [
        {
          type: RAQIV2PredefinedWarningCondition.Always,
          warning: RAQIV2PredefinedWarnings.ShareLinkCampaignExcluded,
        },
        {
          type: RAQIV2PredefinedWarningCondition.Always,
          warning: RAQIV2PredefinedWarnings.ShareLinkCampaignQualifiedPlay,
        },
      ],
    ],
    [
      RAQIV2Metric.PayoutRobux,
      [
        {
          type: RAQIV2PredefinedWarningCondition.UniverseEligibility,
          warning: RAQIV2PredefinedWarnings.CreatorRewardsAudienceExpansionEligibility,
          fetchEligibility: (universeId: number) => {
            return getCachedUniverseEligibility(universeId);
          },
          shownWhen: RAQIV2UniverseEligibilityCondition.NotEligible,
        },
        {
          type: RAQIV2PredefinedWarningCondition.Always,
          warning: RAQIV2PredefinedWarnings.CreatorRewardsNegativePayoutDisclaimer,
        },
      ],
    ],
    [
      RAQIV2Metric.UsersJoinedFromNotifications,
      [
        {
          type: RAQIV2PredefinedWarningCondition.Always,
          warning: RAQIV2PredefinedWarnings.ExperienceEventsNotificationJoinData,
        },
      ],
    ],
    [
      RAQIV2Metric.AdsPublisherReportingTotalImpressions,
      [
        {
          type: RAQIV2PredefinedWarningCondition.Always,
          warning: RAQIV2PredefinedWarnings.ImmersiveAdsImpressions,
        },
      ],
    ],
    [
      RAQIV2Metric.AdsPublisherReportingPortalRevenueRobux,
      [
        {
          type: RAQIV2PredefinedWarningCondition.Always,
          warning: RAQIV2PredefinedWarnings.PortalAdsImpressions,
        },
      ],
    ],
    [
      RAQIV2Metric.AdsPublisherReportingVideo2DDailyUniqueViewer,
      [
        {
          type: RAQIV2PredefinedWarningCondition.Always,
          warning: RAQIV2PredefinedWarnings.ImmersiveAdsExcludesUnvalidatedData,
        },
      ],
    ],
    [
      RAQIV2Metric.AdsPublisherReportingVideo2DAverageEarningPerDailyUniqueViewer,
      [
        {
          type: RAQIV2PredefinedWarningCondition.Always,
          warning: RAQIV2PredefinedWarnings.ImmersiveAdsExcludesUnvalidatedData,
        },
      ],
    ],
    [
      RAQIV2Metric.ClientCrashRate15m,
      [
        {
          type: RAQIV2PredefinedWarningCondition.Always,
          warning: RAQIV2PredefinedWarnings.ClientCrashRateNoisyData,
        },
      ],
    ],
    [
      RAQIV2Metric.AffiliateLinkDailyTotalPayoutRobux,
      [
        {
          type: RAQIV2PredefinedWarningCondition.Always,
          warning: RAQIV2PredefinedWarnings.CreatorRewardsNegativePayoutDisclaimer,
        },
      ],
    ],
    [
      RAQIV2Metric.ServerCrashCount,
      [
        {
          type: RAQIV2PredefinedWarningCondition.Always,
          warning: RAQIV2PredefinedWarnings.PlatformCrashExplaination,
        },
      ],
    ],
  ],
);

// TODO(gperkins@20240604): DSA-2477 -- Add chart warnings back to RAQIv2 charts
// 1. translationKey('Description.RevenueSourceWarning', TranslationNamespace.Analytics)
//    == "Breakdown filter does not apply to this chart"
//    when current breakdown is not equal to the page breakdown
// 2. translationKey('Description.DoubleCountingWarning', TranslationNamespace.Analytics)
//    when breakdown is RAQIV2Dimension.Platform or RAQIV2Dimension.OperatingSystem
//    and metric is ... actually IDK what metrics or monetization dimensions can be double counted...

export const RAQIV2PredefinedWarningTranslationKey: Record<
  RAQIV2PredefinedWarnings,
  TranslationKey
> = {
  [RAQIV2PredefinedWarnings.SubscriptionEngagementPayoutsPortalAdsRevenueExcluded]: translationKey(
    'Warning.SubscriptionEngagementPayoutsPortalAdsRevenueExcluded',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2PredefinedWarnings.FunnelStepNameChangeDuringTimePeriodWithLink]: translationKey(
    'Warning.FunnelStepNameChangeDuringTimePeriodWithLink',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2PredefinedWarnings.ShareLinkCampaignExcluded]: translationKey(
    'Warning.ShareLinkCampaignExcluded',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2PredefinedWarnings.ShareLinkCampaignQualifiedPlay]: translationKey(
    'Warning.ShareLinkCampaignQualifiedPlay',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2PredefinedWarnings.CreatorRewardsAudienceExpansionEligibility]: translationKey(
    'Description.CreatorRewardsAudienceExpansionEligibility',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2PredefinedWarnings.CreatorRewardsNegativePayoutDisclaimer]: translationKey(
    'Description.CreatorRewardsNegativeDisclaimer',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2PredefinedWarnings.ExperienceEventsNotificationJoinData]: translationKey(
    'Warning.NoNotificationJoinDataBeforeDate',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2PredefinedWarnings.ImmersiveAdsImpressions]: translationKey(
    'Warning.ImmersiveAdsTotalImpressions',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2PredefinedWarnings.PortalAdsImpressions]: translationKey(
    'Description.ImpressionsDisclaimer',
    TranslationNamespace.ImmersiveAdsAnalytics,
  ),
  [RAQIV2PredefinedWarnings.ImmersiveAdsExcludesUnvalidatedData]: translationKey(
    'Warning.NoUnvalidatedData',
    TranslationNamespace.ImmersiveAdsAnalytics,
  ),
  [RAQIV2PredefinedWarnings.ClientCrashRateNoisyData]: translationKey(
    'Warning.ClientCrashRateNoisyData',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2PredefinedWarnings.PlatformCrashExplaination]: translationKey(
    'Warning.PlatformCrashExplaination',
    TranslationNamespace.Analytics,
  ),
};
