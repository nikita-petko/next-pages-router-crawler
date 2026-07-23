import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { RecommendationType } from '@modules/clients/analytics';
import type {
  TAnalyticsProductRecommendation,
  TAnalyticsProductRecommendationType,
} from '@modules/experience-analytics-shared/types/assistant/AnalyticsAssistantRecommendations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidArrayEnumValue } from '@modules/miscellaneous/utils/enumUtils';

export type AnalyticsProductRecommendationConfig = {
  headingKey: TranslationKey;
  descriptionKey: TranslationKey;
};

export const AttributedAnalyticsProductRecommendation = [
  RecommendationType.ProductRegionalPricing,
] as const;

type TAttributedAnalyticsProductRecommendation =
  (typeof AttributedAnalyticsProductRecommendation)[number];

const AnalyticsProductRecommendationConfigsMap: Record<
  Exclude<TAnalyticsProductRecommendationType, TAttributedAnalyticsProductRecommendation>,
  AnalyticsProductRecommendationConfig
> = {
  [RecommendationType.ProductThumbnailPersonalization]: {
    headingKey: translationKey(
      'Description.Recommendations.ThumbnailPersonalization',
      TranslationNamespace.AnalyticsAssistant,
    ),
    descriptionKey: translationKey(
      'Label.Recommendations.ThumbnailPersonalization',
      TranslationNamespace.AnalyticsAssistant,
    ),
  },
  [RecommendationType.ProductCustomEvents]: {
    headingKey: translationKey(
      'Description.Recommendations.CustomEvents',
      TranslationNamespace.AnalyticsAssistant,
    ),
    descriptionKey: translationKey(
      'Label.Recommendations.CustomEvents',
      TranslationNamespace.AnalyticsAssistant,
    ),
  },
  [RecommendationType.ProductEconomyEvents]: {
    headingKey: translationKey(
      'Description.Recommendations.EconomyEvents',
      TranslationNamespace.AnalyticsAssistant,
    ),
    descriptionKey: translationKey(
      'Label.Recommendations.EconomyEvents',
      TranslationNamespace.AnalyticsAssistant,
    ),
  },
  [RecommendationType.ProductFunnelEvents]: {
    headingKey: translationKey(
      'Description.Recommendations.FunnelEvents',
      TranslationNamespace.AnalyticsAssistant,
    ),
    descriptionKey: translationKey(
      'Label.Recommendations.FunnelEvents',
      TranslationNamespace.AnalyticsAssistant,
    ),
  },
  [RecommendationType.ProductAutoTranslation]: {
    headingKey: translationKey(
      'Description.Recommendations.AutoTranslation',
      TranslationNamespace.AnalyticsAssistant,
    ),
    descriptionKey: translationKey(
      'Label.Recommendations.Localization',
      TranslationNamespace.AnalyticsAssistant,
    ),
  },
  [RecommendationType.ProductAutoTextCapture]: {
    headingKey: translationKey(
      'Description.Recommendations.AutoTextCapture',
      TranslationNamespace.AnalyticsAssistant,
    ),
    descriptionKey: translationKey(
      'Label.Recommendations.Localization',
      TranslationNamespace.AnalyticsAssistant,
    ),
  },
  [RecommendationType.ProductPackagesMissions]: {
    headingKey: translationKey(
      'Description.Recommendations.PackagesMissions',
      TranslationNamespace.AnalyticsAssistant,
    ),
    descriptionKey: translationKey(
      'Label.Recommendations.FeaturePackages',
      TranslationNamespace.AnalyticsAssistant,
    ),
  },
  [RecommendationType.ProductPackagesStarterPack]: {
    headingKey: translationKey(
      'Description.Recommendations.PackagesStarterPack',
      TranslationNamespace.AnalyticsAssistant,
    ),
    descriptionKey: translationKey(
      'Label.Recommendations.FeaturePackages',
      TranslationNamespace.AnalyticsAssistant,
    ),
  },
  [RecommendationType.ProductPackagesGeneric]: {
    headingKey: translationKey(
      'Description.Recommendations.PackagesGeneric',
      TranslationNamespace.AnalyticsAssistant,
    ),
    descriptionKey: translationKey(
      'Label.Recommendations.FeaturePackages',
      TranslationNamespace.AnalyticsAssistant,
    ),
  },
  [RecommendationType.ProductPackagesSeasonPass]: {
    headingKey: translationKey(
      'Description.Recommendations.PackagesSeasonPass',
      TranslationNamespace.AnalyticsAssistant,
    ),
    descriptionKey: translationKey(
      'Label.Recommendations.FeaturePackages',
      TranslationNamespace.AnalyticsAssistant,
    ),
  },
  [RecommendationType.ProductPackagesEngagementRewards]: {
    headingKey: translationKey(
      'Description.Recommendations.PackagesEngagementRewards',
      TranslationNamespace.AnalyticsAssistant,
    ),
    descriptionKey: translationKey(
      'Label.Recommendations.FeaturePackages',
      TranslationNamespace.AnalyticsAssistant,
    ),
  },
  [RecommendationType.ProductPriceOptimization]: {
    headingKey: {
      key: 'Description.Recommendations.PriceOptimization',
      namespace: TranslationNamespace.Home,
    },
    descriptionKey: {
      key: 'Label.Recommendations.PriceOptimization',
      namespace: TranslationNamespace.Home,
    },
  },
  [RecommendationType.ProductStudioPublish]: {
    headingKey: {
      key: 'Description.Recommendations.StudioPublish',
      namespace: TranslationNamespace.Home,
    },
    descriptionKey: {
      key: 'Label.Recommendations.StudioPublish',
      namespace: TranslationNamespace.Home,
    },
  },
  [RecommendationType.ProductProductIntelligenceApis]: {
    headingKey: {
      key: 'Description.Recommendation.ProductIntelligenceApis',
      namespace: TranslationNamespace.AnalyticsAssistant,
    },
    descriptionKey: {
      key: 'Label.Recommendations.ProductIntelligenceApis',
      namespace: TranslationNamespace.AnalyticsAssistant,
    },
  },
  [RecommendationType.ProductManagedPricing]: {
    headingKey: {
      key: 'Description.Recommendation.ManagedPricing',
      namespace: TranslationNamespace.AnalyticsAssistant,
    },
    descriptionKey: {
      key: 'Label.Recommendations.ManagedPricing',
      namespace: TranslationNamespace.AnalyticsAssistant,
    },
  },
  [RecommendationType.ProductExperimentationFunnels]: {
    headingKey: {
      key: 'Description.Recommendation.ExperimentationFunnels',
      namespace: TranslationNamespace.AnalyticsAssistant,
    },
    descriptionKey: {
      key: 'Label.Recommendations.ExperimentationFunnels',
      namespace: TranslationNamespace.AnalyticsAssistant,
    },
  },
};

export const getAnalyticsProductRecommendationConfig = (
  recommendation: TAnalyticsProductRecommendation,
): AnalyticsProductRecommendationConfig => {
  const { recommendationType, attributes } = recommendation;
  if (isValidArrayEnumValue(AttributedAnalyticsProductRecommendation, recommendationType)) {
    switch (recommendationType) {
      case RecommendationType.ProductRegionalPricing: {
        const productType =
          attributes?.values?.find((attribute) => attribute.key === 'ProductType')?.value ??
          'GamePass';

        return {
          headingKey: translationKey(
            'Description.Recommendations.RegionalPricing',
            TranslationNamespace.AnalyticsAssistant,
          ),
          descriptionKey: translationKey(
            productType === 'GamePass'
              ? 'Label.Recommendations.Passes'
              : 'Label.Recommendations.DeveloperProducts',
            TranslationNamespace.AnalyticsAssistant,
          ),
        };
      }
      default:
        // oxlint-disable-next-line typescript/restrict-template-expressions
        throw new Error(`Unsupported attributed recommendation type: ${recommendationType}`);
    }
  }

  return AnalyticsProductRecommendationConfigsMap[recommendationType];
};
