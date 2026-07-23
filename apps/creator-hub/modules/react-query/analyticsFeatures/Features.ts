export enum AnalyticsFeatureName {
  QualityStatus = 'quality_status_v4',
  RegionalPricing = 'regional_pricing_adoption',
}

export const BooleanValues = ['True', 'False'] as const;
export type TBooleanValues = (typeof BooleanValues)[number];

type BaseAnalyticsFeatureValues = {
  name: AnalyticsFeatureName;
};

export type QualityStatus = BaseAnalyticsFeatureValues & {
  name: AnalyticsFeatureName.QualityStatus;
  status: TBooleanValues | null;
};

export type RegionalPricing = BaseAnalyticsFeatureValues & {
  name: AnalyticsFeatureName.RegionalPricing;
  adopted: TBooleanValues | null;
  eligible: TBooleanValues | null;
};

export type AnalyticsFeatureValues = QualityStatus | RegionalPricing;
