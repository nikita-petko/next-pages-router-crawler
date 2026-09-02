import type { MetricMetadata } from '../types/experiment';

export const MICRO_MULTIPLE = 1e6;

const metricsMetadata: Record<string, MetricMetadata> = {
  payingUsers: {
    name: 'payingUsers',
    translationKey: 'Label.Metrics.PayingUsers',
    tooltipTranslationKey: 'Description.Metrics.PayingUsers',
    isPositiveGood: true,
  },
  dailyActiveUsers: {
    name: 'dailyActiveUsers',
    translationKey: 'Label.Metrics.DAU',
    tooltipTranslationKey: 'Description.Metrics.DAU',
    isPositiveGood: true,
  },
  testedProductsRevenue: {
    name: 'productsRevenue',
    translationKey: 'Label.Metrics.TestedProductsRevenue',
    tooltipTranslationKey: 'Description.Metrics.TestedProductsRevenue',
    isPositiveGood: true,
  },
  overallRevenue: {
    name: 'overallRevenue',
    translationKey: 'Label.Metrics.OverallRevenue',
    tooltipTranslationKey: 'Description.Metrics.OverallRevenueV2',
    isPositiveGood: true,
  },
  arppu: {
    name: 'arppu',
    translationKey: 'Label.Metrics.ARPPU',
    tooltipTranslationKey: 'Description.Metrics.ARPPU',
    isPositiveGood: true,
  },
};

const holdoutScorecardMetadata: MetricMetadata[] = [
  metricsMetadata.testedProductsRevenue,
  metricsMetadata.arppu,
  metricsMetadata.payingUsers,
  metricsMetadata.dailyActiveUsers,
  metricsMetadata.overallRevenue,
];

export const TESTED_PRODUCTS_REVENUE_METRIC_NAME = metricsMetadata.testedProductsRevenue.name;
export const OVERALL_REVENUE_METRIC_NAME = metricsMetadata.overallRevenue.name;

export { holdoutScorecardMetadata };
