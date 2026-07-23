import { MetricMetadata } from '../types/experiment';

export const MICRO_MULTIPLE = 1e6;

/* NumWeeks current passes in holdout duration for longTermRevenue, if new translation params are introduced, need to change this */
const metricsMetadata: Record<string, MetricMetadata> = {
  payingUsers: {
    name: 'payingUsers',
    translationKey: 'Label.Metrics.PayingUsers',
    tooltipTranslationKey: 'Description.Metrics.PayingUsers',
    isPositiveGood: true,
    isPrediction: false,
  },
  sales: {
    name: 'sales',
    translationKey: 'Label.Metrics.Sales',
    tooltipTranslationKey: 'Description.Metrics.SalesV2',
    isPositiveGood: true,
    isPrediction: false,
  },
  totalPlaytime: {
    name: 'totalPlaytime',
    translationKey: 'Label.Metrics.TotalPlaytime',
    tooltipTranslationKey: 'Description.Metrics.TotalPlaytimeV2',
    isPositiveGood: true,
    isPrediction: false,
  },
  dailyActiveUsers: {
    name: 'dailyActiveUsers',
    translationKey: 'Label.Metrics.DAU',
    tooltipTranslationKey: 'Description.Metrics.DAU',
    isPositiveGood: true,
    isPrediction: false,
  },
  shortTermRevenue: {
    name: 'shortTermRevenue',
    translationKey: 'Label.Metrics.ShortTermRevenue',
    tooltipTranslationKey: 'Description.Metrics.ShortTermRevenueV2',
    isPositiveGood: true,
    isPrediction: true,
  },
  longTermRevenue: {
    name: 'longTermRevenue',
    translationKey: 'Label.Metrics.LongTermRevenue',
    tooltipTranslationKey: 'Description.Metrics.LongTermRevenueV2',
    isPositiveGood: true,
    isPrediction: true,
  },
  testedProductsRevenue: {
    name: 'productsRevenue',
    translationKey: 'Label.Metrics.TestedProductsRevenue',
    tooltipTranslationKey: 'Description.Metrics.TestedProductsRevenue',
    isPositiveGood: true,
    isPrediction: false,
  },
  overallRevenue: {
    name: 'overallRevenue',
    translationKey: 'Label.Metrics.OverallRevenue',
    tooltipTranslationKey: 'Description.Metrics.OverallRevenueV2',
    isPositiveGood: true,
    isPrediction: false,
  },
  arppu: {
    name: 'arppu',
    translationKey: 'Label.Metrics.ARPPU',
    tooltipTranslationKey: 'Description.Metrics.ARPPU',
    isPositiveGood: true,
    isPrediction: false,
  },
};

const experimentScorecardMetadata: MetricMetadata[] = [
  metricsMetadata.payingUsers,
  metricsMetadata.sales,
  metricsMetadata.totalPlaytime,
  metricsMetadata.dailyActiveUsers,
  metricsMetadata.shortTermRevenue,
  metricsMetadata.longTermRevenue,
];

const holdoutScorecardMetadata: MetricMetadata[] = [
  metricsMetadata.testedProductsRevenue,
  metricsMetadata.arppu,
  metricsMetadata.payingUsers,
  metricsMetadata.dailyActiveUsers,
  metricsMetadata.overallRevenue,
];

export const TESTED_PRODUCTS_REVENUE_METRIC_NAME = metricsMetadata.testedProductsRevenue.name;
export const OVERALL_REVENUE_METRIC_NAME = metricsMetadata.overallRevenue.name;

export { experimentScorecardMetadata, holdoutScorecardMetadata };
