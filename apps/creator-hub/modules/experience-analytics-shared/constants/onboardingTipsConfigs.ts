import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ModalId as OnboardingFeatureKey } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';

export enum OnboardingStepKey {
  HomeRecommendationTab = 'HomeRecommendationTab',
  HomeRecommendationSignalsSectionTitle = 'HomeRecommendationSignalsSectionTitle',
  SimilarExperienceSectionTitle = 'SimilarExperienceSectionTitle',
  // L7 Metrics Overview Onboarding Steps
  OverviewL7Benchmarks = 'OverviewL7Benchmarks',
  OverviewL7DailyBenchmarkSwitching = 'OverviewL7DailyBenchmarkSwitching',
  OverviewL7Snapshot = 'OverviewL7Snapshot',
  AssistantHistoricalReportSelector = 'AssistantHistoricalReportSelector',
  // Immersive Ads / Rewarded Video Onboarding Steps
  RewardedVideoEarningsOverview = 'RewardedVideoEarningsOverview',
  RewardedVideoImpressionsBreakdown = 'RewardedVideoImpressionsBreakdown',
  RewardedVideoEpmBreakdown = 'RewardedVideoEpmBreakdown',
  // Error Report Onboarding Steps
  ErrorReportNewErrorsSinceFilter = 'ErrorReportNewErrorsSinceFilter',
  ErrorReportRulesTab = 'ErrorReportRulesTab',
}

export type OnboardingTipsConfig = {
  titleKey: TranslationKey;
  contentKey?: TranslationKey;
  contentLink?: string;
};

export type OnboardingTipsConfigs = {
  featureKey: OnboardingFeatureKey;
  stepKey: OnboardingStepKey;
  isClosed?: boolean;
  isSingleLineStyle?: boolean;
};

export const featureKeyToStepKeyOrder: Partial<Record<OnboardingFeatureKey, OnboardingStepKey[]>> =
  {
    [OnboardingFeatureKey.CreatorHubAnalyticsAcquisitionRfy]: [
      OnboardingStepKey.HomeRecommendationTab,
      OnboardingStepKey.HomeRecommendationSignalsSectionTitle,
      OnboardingStepKey.SimilarExperienceSectionTitle,
    ],
    [OnboardingFeatureKey.CreatorHubAnalyticsOverviewL7Metrics]: [
      OnboardingStepKey.OverviewL7Benchmarks,
      OnboardingStepKey.OverviewL7Snapshot,
      OnboardingStepKey.OverviewL7DailyBenchmarkSwitching,
    ],
    [OnboardingFeatureKey.CreatorHubAnalyticsHistoricalInsights]: [
      OnboardingStepKey.AssistantHistoricalReportSelector,
    ],
    [OnboardingFeatureKey.CreatorHubAnalyticsImmersiveAdsRewardedVideo]: [
      OnboardingStepKey.RewardedVideoEarningsOverview,
      OnboardingStepKey.RewardedVideoImpressionsBreakdown,
      OnboardingStepKey.RewardedVideoEpmBreakdown,
    ],
    [OnboardingFeatureKey.CreatorHubAnalyticsErrorReportRules]: [
      OnboardingStepKey.ErrorReportNewErrorsSinceFilter,
      OnboardingStepKey.ErrorReportRulesTab,
    ],
  };

export const onboardingTipsConfigs: Record<OnboardingStepKey, OnboardingTipsConfig> = {
  [OnboardingStepKey.HomeRecommendationTab]: {
    titleKey: translationKey(
      'Title.OnboardingTips.HomeRecommendationImpressions',
      TranslationNamespace.Analytics,
    ),
    contentKey: translationKey(
      'Description.OnboardingTips.HomeRecommendationImpressions',
      TranslationNamespace.Analytics,
    ),
    contentLink: creatorHub.docs.getDiscoveryRecommendationUrl(),
  },
  [OnboardingStepKey.HomeRecommendationSignalsSectionTitle]: {
    titleKey: translationKey('Title.HomeRecommendationSignals', TranslationNamespace.Analytics),
    contentKey: translationKey(
      'Description.OnboardingTips.HomeRecommendationSignals',
      TranslationNamespace.Analytics,
    ),
    contentLink: creatorHub.docs.getDiscoveryGetDiscoveredUrl(),
  },
  [OnboardingStepKey.SimilarExperienceSectionTitle]: {
    titleKey: translationKey(
      'Title.OnboardingTips.SimilarExperienceBenchmark',
      TranslationNamespace.Analytics,
    ),
    contentKey: translationKey(
      'Description.OnboardingTips.SimilarExperienceBenchmark',
      TranslationNamespace.Analytics,
    ),
    contentLink: creatorHub.docs.getDiscoveryGetDiscoveredUrl(),
  },
  // L7 Metrics Overview Onboarding
  [OnboardingStepKey.OverviewL7Benchmarks]: {
    titleKey: translationKey(
      'Title.OnboardingTips.OverviewL7Benchmarks',
      TranslationNamespace.Insights,
    ),
    contentKey: translationKey(
      'Description.OnboardingTips.OverviewL7Benchmarks',
      TranslationNamespace.Insights,
    ),
    contentLink: creatorHub.docs.getDiscoveryUrl(),
  },
  [OnboardingStepKey.OverviewL7DailyBenchmarkSwitching]: {
    titleKey: translationKey(
      'Title.OnboardingTips.OverviewL7DailyBenchmarkSwitching',
      TranslationNamespace.Insights,
    ),
    contentKey: translationKey(
      'Description.OnboardingTips.OverviewL7DailyBenchmarkSwitching',
      TranslationNamespace.Insights,
    ),
  },
  [OnboardingStepKey.OverviewL7Snapshot]: {
    titleKey: translationKey(
      'Title.OnboardingTips.OverviewL7Snapshot',
      TranslationNamespace.Insights,
    ),
    contentKey: translationKey(
      'Description.OnboardingTips.OverviewL7Snapshot',
      TranslationNamespace.Insights,
    ),
    contentLink: creatorHub.docs.getDiscoveryUrl(),
  },
  [OnboardingStepKey.AssistantHistoricalReportSelector]: {
    titleKey: translationKey(
      'Title.OnboardingTips.AssistantHistoricalReportSelector',
      TranslationNamespace.Insights,
    ),
  },
  // Rewarded Video Onboarding (V2 layout only — anchors only exist on the
  // redesigned three-section layout gated by `isRewardedVideoRedesignEnabled`).
  [OnboardingStepKey.RewardedVideoEarningsOverview]: {
    titleKey: translationKey(
      'Title.OnboardingTips.RewardedVideoEarningsOverview',
      TranslationNamespace.ImmersiveAdsAnalytics,
    ),
    contentKey: translationKey(
      'Description.OnboardingTips.RewardedVideoEarningsOverview',
      TranslationNamespace.ImmersiveAdsAnalytics,
    ),
  },
  [OnboardingStepKey.RewardedVideoImpressionsBreakdown]: {
    titleKey: translationKey(
      'Title.OnboardingTips.RewardedVideoImpressionsBreakdown',
      TranslationNamespace.ImmersiveAdsAnalytics,
    ),
    contentKey: translationKey(
      'Description.OnboardingTips.RewardedVideoImpressionsBreakdown',
      TranslationNamespace.ImmersiveAdsAnalytics,
    ),
  },
  [OnboardingStepKey.RewardedVideoEpmBreakdown]: {
    titleKey: translationKey(
      'Title.OnboardingTips.RewardedVideoEpmBreakdown',
      TranslationNamespace.ImmersiveAdsAnalytics,
    ),
    contentKey: translationKey(
      'Description.OnboardingTips.RewardedVideoEpmBreakdown',
      TranslationNamespace.ImmersiveAdsAnalytics,
    ),
  },
  [OnboardingStepKey.ErrorReportNewErrorsSinceFilter]: {
    titleKey: translationKey(
      'Title.OnboardingTips.ErrorReportNewErrorsSinceFilter',
      TranslationNamespace.Analytics,
    ),
  },
  [OnboardingStepKey.ErrorReportRulesTab]: {
    titleKey: translationKey(
      'Title.OnboardingTips.ErrorReportRulesTab',
      TranslationNamespace.Analytics,
    ),
  },
};

export const getStepIndex = (featureKey: OnboardingFeatureKey, step: OnboardingStepKey): number => {
  return featureKeyToStepKeyOrder[featureKey]?.indexOf(step) ?? -1;
};

export { ModalId as OnboardingFeatureKey } from '@modules/clients/analytics';
