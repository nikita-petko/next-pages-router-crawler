import { RecommendationType } from '@modules/clients/analytics';
import { FeatureAttributes } from '@rbx/client-universe-analytics-insights/v1';

export enum AnalyticsAssistantRecommendationType {
  Product = 'product',
  NonProduct = 'non-product',
}

export const AnalyticsProductRecommendation = [
  RecommendationType.ProductThumbnailPersonalization,
  RecommendationType.ProductCustomEvents,
  RecommendationType.ProductEconomyEvents,
  RecommendationType.ProductFunnelEvents,
  RecommendationType.ProductAutoTranslation,
  RecommendationType.ProductAutoTextCapture,
  RecommendationType.ProductPackagesMissions,
  RecommendationType.ProductPackagesStarterPack,
  RecommendationType.ProductPackagesGeneric,
  RecommendationType.ProductPackagesSeasonPass,
  RecommendationType.ProductPackagesEngagementRewards,
  RecommendationType.ProductRegionalPricing,
  RecommendationType.ProductPriceOptimization,
  RecommendationType.ProductStudioPublish,
  RecommendationType.ProductProductIntelligenceApis,
] as const;

export const AnalyticsNonProductRecommendation = [RecommendationType.ViewPlayerFeedback] as const;

export type TAnalyticsProductRecommendationType = (typeof AnalyticsProductRecommendation)[number];
export type TAnalyticsNonProductRecommendationType =
  (typeof AnalyticsNonProductRecommendation)[number];

export type TAnalyticsProductRecommendation = {
  recommendationType: TAnalyticsProductRecommendationType;
  attributes?: FeatureAttributes;
};

export type TAnalyticsNonProductRecommendation = {
  recommendationType: TAnalyticsNonProductRecommendationType;
};

export type TAnalyticsAssistantRecommendation =
  | TAnalyticsProductRecommendation
  | TAnalyticsNonProductRecommendation;

// Updated report section recommendations to use new structured types
export type TAnalyticsAssistantReportSectionRecommendation =
  | {
      type: AnalyticsAssistantRecommendationType.Product;
      recommendations: TAnalyticsProductRecommendation[];
    }
  | {
      type: AnalyticsAssistantRecommendationType.NonProduct;
      recommendation: TAnalyticsNonProductRecommendation;
    };
