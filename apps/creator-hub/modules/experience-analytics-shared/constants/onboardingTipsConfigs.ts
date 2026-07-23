import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { urls } from '@modules/miscellaneous/common';
import { TranslationKey, translationKey } from '@modules/analytics-translations';
import { ModalId as OnboardingFeatureKey } from '@modules/clients/analytics';

export enum OnboardingStepKey {
  HomeRecommendationTab = 'HomeRecommendationTab',
  HomeRecommendationSignalsSectionTitle = 'HomeRecommendationSignalsSectionTitle',
  SimilarExperienceSectionTitle = 'SimilarExperienceSectionTitle',
  // L7 Metrics Overview Onboarding Steps
  OverviewL7Benchmarks = 'OverviewL7Benchmarks',
  OverviewL7DailyBenchmarkSwitching = 'OverviewL7DailyBenchmarkSwitching',
  OverviewL7Snapshot = 'OverviewL7Snapshot',
  AssistantHistoricalReportSelector = 'AssistantHistoricalReportSelector',
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
    contentLink: urls.creatorHub.docs.getDiscoveryRecommendationUrl(),
  },
  [OnboardingStepKey.HomeRecommendationSignalsSectionTitle]: {
    titleKey: translationKey('Title.HomeRecommendationSignals', TranslationNamespace.Analytics),
    contentKey: translationKey(
      'Description.OnboardingTips.HomeRecommendationSignals',
      TranslationNamespace.Analytics,
    ),
    contentLink: urls.creatorHub.docs.getDiscoveryGetDiscoveredUrl(),
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
    contentLink: urls.creatorHub.docs.getDiscoveryGetDiscoveredUrl(),
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
    contentLink: urls.creatorHub.docs.getDiscoveryUrl(),
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
    contentLink: urls.creatorHub.docs.getDiscoveryUrl(),
  },
  [OnboardingStepKey.AssistantHistoricalReportSelector]: {
    titleKey: translationKey(
      'Title.OnboardingTips.AssistantHistoricalReportSelector',
      TranslationNamespace.Insights,
    ),
  },
};

export const getStepIndex = (featureKey: OnboardingFeatureKey, step: OnboardingStepKey): number => {
  return featureKeyToStepKeyOrder[featureKey]?.indexOf(step) ?? -1;
};

export { ModalId as OnboardingFeatureKey } from '@modules/clients/analytics';
