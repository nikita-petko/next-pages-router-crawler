import { Chart, Insight, Recommendation, RecommendationType } from '@modules/clients/analytics';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { Asset } from '@modules/clients/assetsupload';
import { ChartResourceType } from '@modules/charts-generic';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { AchievementChartKeys } from '../types/achievements';
import {
  AdsPerformanceCardSpec,
  InsightAchievementSpec,
  InsightTypeV2,
  LowEndAndroidCrashRateSpec,
  PercentChangeInsightCardSpec,
  QualitySignalCardsSpec,
  SummaryReport7DaysCardSpec,
  SummaryReportCardSpec,
} from '../types/insights';
import RAQIV2ChartContext from '../types/RAQIV2ChartContext';
import RAQIV2PredefinedChartKey from '../constants/RAQIV2PredefinedChartKey';
import {
  adaptAnalyticsAssistantRecommendations,
  adaptProductRecommendations,
  adaptSummaryReportDateRange,
} from './analyticsAssistantAdapters';
import { AnalyticsAssistantRecommendationType } from '../types/assistant/AnalyticsAssistantRecommendations';
import {
  type TRAQIV2PredefinedChartKey,
  isCentralizedPredefinedChartKey,
} from '../constants/RAQIV2PredefinedChartConfig';

const adaptGeneralInsightField = (
  insight: Insight,
): { insightId: string; date: Date; snoozeKey: string } => {
  const { insightType } = insight;
  if (!insightType || !isValidEnumValue(InsightTypeV2, insightType)) {
    throw new Error(`invalid InsightType ${insightType}`);
  }
  return {
    insightId: insight.id,
    date: new Date(insight.createdUtcTime),
    snoozeKey: insight.snoozeKey,
  };
};

const adaptChart = (
  chart: Chart | undefined,
  universeId: number,
): { chartKey: TRAQIV2PredefinedChartKey; context: RAQIV2ChartContext } => {
  if (
    typeof chart === 'undefined' ||
    typeof chart.key === 'undefined' ||
    typeof chart.context === 'undefined' ||
    typeof chart.context.startUtcTime === 'undefined' ||
    typeof chart.context.endUtcTime === 'undefined' ||
    !isCentralizedPredefinedChartKey(chart.key)
  ) {
    throw new Error(`GetInsightsResponse - Invalid chart ${chart}`);
  }
  const { startUtcTime, endUtcTime, ...givenOtherContext } = chart.context;
  const otherContext = givenOtherContext as Pick<
    // TODO: Consider don't rely on backend to provide the correct type https://roblox.atlassian.net/browse/DSA-3101
    RAQIV2ChartContext,
    'breakdown' | 'filter' | 'granularity'
  >;
  const context: RAQIV2ChartContext = {
    ...otherContext,
    timeSpec: {
      startTime: new Date(startUtcTime),
      endTime: new Date(endUtcTime),
    },
    resource: {
      id: universeId,
      type: ChartResourceType.Universe,
    },
    // The summary & insights reports don't show charts
    // or if they do we shouldn't keep the same time axes page-wide.
    timeAxisBounds: null,
  };
  return {
    chartKey: chart.key,
    context,
  };
};

const adaptRecommendations = (
  recommendations: Recommendation[] | undefined,
): RecommendationType[] => {
  return typeof recommendations !== 'undefined'
    ? recommendations
        .map((recommendation) => recommendation.recommendationType)
        .filter(
          (type): type is RecommendationType =>
            typeof type !== 'undefined' && isValidEnumValue(RecommendationType, type),
        )
    : [];
};

export const adaptPercentChangeInsight = (insightDetail: Insight): PercentChangeInsightCardSpec => {
  if (!insightDetail.percentChangeEvidence) {
    throw new Error('GetInsightsResponse with Percent change type missing percentChangeEvidence');
  }

  const { chart, percentChange, benchmarkComparisonRank, benchmarkPercentChange } =
    insightDetail.percentChangeEvidence;

  return {
    ...adaptGeneralInsightField(insightDetail),
    ...adaptChart(chart, insightDetail.universeId),
    type: InsightTypeV2.PercentChange,
    recommendations: adaptRecommendations(insightDetail.recommendations),
    summaryValue: percentChange ?? 0,
    captionInfo:
      benchmarkComparisonRank === undefined || benchmarkPercentChange === undefined
        ? undefined
        : { benchmarkComparisonRank, benchmarkPercentChange },
  };
};

export const adaptPeriodHighInsight = (insightDetail: Insight): InsightAchievementSpec => {
  if (
    !insightDetail.periodHighEvidence?.chart?.key ||
    !isValidEnumValue(AchievementChartKeys, insightDetail.periodHighEvidence.chart.key)
  ) {
    throw new Error('GetInsightsResponse with Period high type missing periodHighEvidence');
  }

  const chartKey: AchievementChartKeys = insightDetail.periodHighEvidence.chart.key;
  const currentValue =
    insightDetail.periodHighEvidence.currentValue &&
    insightDetail.periodHighEvidence.currentValue > 0
      ? insightDetail.periodHighEvidence.currentValue
      : null;

  return {
    ...adaptGeneralInsightField(insightDetail),
    type: InsightTypeV2.PeriodHigh,
    chartKey,
    currentValue,
  };
};

export const adaptAdsPerformanceInsight = (insightDetail: Insight): AdsPerformanceCardSpec => {
  const evidence = insightDetail.adsPerformanceEvidence;

  if (!evidence?.chart?.key) {
    throw new Error('GetInsightsResponse with AdsPerformance type missing adsPerformanceEvidence');
  }

  const adsPlaysL7 = evidence.adsPlaysL7 ?? 0;

  return {
    ...adaptGeneralInsightField(insightDetail),
    ...adaptChart(evidence.chart, insightDetail.universeId),
    type: InsightTypeV2.AdsPerformance7Days,
    recommendations: adaptRecommendations(insightDetail.recommendations),
    summaryValue: adsPlaysL7,
    captionInfo: {
      adsPlaysL7,
    },
  };
};

export const adaptQualitySignalInsight = (insightDetail: Insight): QualitySignalCardsSpec => {
  const signals = insightDetail.experienceQualityEvidence?.experienceQualityInsights;
  const isDefaultPlace = !!signals?.some(
    (item) => item.rootPlaceSimilarToTemplateInsight?.isRootPlaceSimilarToTemplate,
  );
  const isDefaultName = !!signals?.some(
    (item) => item.rootPlaceDefaultNameInsight?.isRootPlaceDefaultName,
  );
  const isDefaultDescription = !!signals?.some(
    (item) => item.rootPlaceDefaultOrEmptyDescriptionInsight?.isRootPlaceDefaultOrEmptyDescription,
  );
  const isDefaultIcon = !!signals?.some((item) => item.defaultIconInsight?.isDefaultIcon);
  const isDefaultThumbnail = !!signals?.some(
    (item) => item.defaultThumbnailInsight?.isDefaultThumbnail,
  );
  const hasGuidelines = !!signals?.some((item) => item.ageGuidelinesInsight?.hasAgeGuidelines);

  // Populating a lot of empty values here to adhere to type requirements.
  // Quality signal cards don't have a chart.
  return {
    type: InsightTypeV2.ExperienceQuality,
    showDefaultPlaceCard: isDefaultPlace,
    showDefaultNameDescriptionCard: isDefaultName || isDefaultDescription,
    showDefaultIconCard: isDefaultIcon,
    showDefaultThumbnailCard: isDefaultThumbnail,
    showCompleteGuidelinesCard: !hasGuidelines,
    // Only the fields above are used. The rest defined here are meaningless, only populated to comply to type.
    recommendations: [],
    summaryValue: 1,
    insightId: '',
    date: new Date(),
    chartKey: RAQIV2PredefinedChartKey.AcquisitionHomeRecommendationQualifiedPTR,
    context: {
      resource: {
        id: insightDetail.universeId,
        type: ChartResourceType.Universe,
      },
      timeSpec: {
        startTime: new Date(),
        endTime: new Date(),
      },
      granularity: RAQIV2MetricGranularity.None,
      breakdown: [],
      filter: [],
      timeAxisBounds: null,
    },
    snoozeKey: '',
  };
};

export const adaptLowEndAndroidCrashRateInsight = (
  insightDetail: Insight,
  asset?: Asset,
): LowEndAndroidCrashRateSpec => {
  if (!insightDetail.lowEndAndroidCrashRateEvidence) {
    throw new Error(
      'GetInsightsResponse with LowEndAndroidCrashRate type missing lowEndAndroidCrashRateEvidence',
    );
  }

  const evidence = insightDetail.lowEndAndroidCrashRateEvidence;

  const placeId = evidence?.mostCrashedPlaceId ?? -1;
  const placeName = asset?.displayName ?? '';
  const totalCrashRate = evidence?.crashRate ?? 0;
  const lowEndAndroidCrashRate = evidence?.lowEndAndroidCrashRate ?? 0;
  const totalCcu = evidence?.ccu ?? 0;
  const lowEndAndroidCcu = evidence?.lowEndAndroidCcu ?? 0;
  const ccuRatio = totalCcu > 0 ? lowEndAndroidCcu / totalCcu : 0;

  return {
    ...adaptGeneralInsightField(insightDetail),
    // NOTE: this is not used by the insight, we have a custom chart to render instead of a time series chart
    ...adaptChart(
      {
        key: RAQIV2PredefinedChartKey.PerformanceClientCrashRate,
        context: {
          startUtcTime: insightDetail.createdUtcTime,
          endUtcTime: insightDetail.createdUtcTime,
        },
      },
      insightDetail.universeId,
    ),
    type: InsightTypeV2.LowEndAndroidCrashRate,
    summaryValue: evidence?.lowEndAndroidCrashRate ?? 0,
    recommendations: adaptRecommendations(insightDetail.recommendations),
    captionInfo: { totalCrashRate },
    titleInfo: { placeName },
    chartInfo: { totalCrashRate, lowEndAndroidCrashRate },
    suggestionsInfo: { ccuRatio, placeId },
  };
};

const validateSummaryReportEvidence = (
  insightDetail: Insight,
): {
  startDate: Date;
  endDate: Date;
  reportSummary: string;
  recommendations: RecommendationType[];
  newSignalCount: number;
} => {
  if (!insightDetail.summaryReportEvidence) {
    throw new Error('GetInsightsResponse with SummaryReport type missing summaryReportEvidence');
  }

  if (
    insightDetail.insightType !== InsightTypeV2.SummaryReport &&
    insightDetail.insightType !== InsightTypeV2.SummaryReport7Days
  ) {
    throw new Error('GetInsightsResponse with SummaryReport type has invalid insightType');
  }

  const evidence = insightDetail.summaryReportEvidence;
  const signals = evidence.signals || [];

  if (signals.length === 0) {
    throw new Error('SummaryReport evidence missing signals data');
  }

  const insightType =
    insightDetail.insightType === InsightTypeV2.SummaryReport
      ? InsightTypeV2.SummaryReport
      : InsightTypeV2.SummaryReport7Days;

  const { startDate, endDate } = adaptSummaryReportDateRange(signals, insightType);

  const sections = evidence.report?.sections ?? [];
  const reportSummary = sections.length > 0 ? (sections[0].content ?? '') : '';

  const overviewRecommendations = adaptAnalyticsAssistantRecommendations(
    adaptProductRecommendations(insightDetail.recommendations),
    sections.length > 0 ? sections[0].recommendations : undefined,
  );
  const recommendations =
    overviewRecommendations?.type === AnalyticsAssistantRecommendationType.Product
      ? overviewRecommendations.recommendations.map((rec) => rec.recommendationType)
      : [];

  // Sum up newSignalCount from all report sections
  const newSignalCount = sections.reduce((total, section) => {
    return total + (section.metadata?.newSignalCount ?? 0);
  }, 0);

  return { startDate, endDate, reportSummary, recommendations, newSignalCount };
};

export const adaptSummaryReport = (insightDetail: Insight): SummaryReportCardSpec => {
  const { startDate, endDate, reportSummary, recommendations, newSignalCount } =
    validateSummaryReportEvidence(insightDetail);

  return {
    type: InsightTypeV2.SummaryReport,
    startDate,
    endDate,
    reportSummary,
    recommendations,
    newSignalCount,
    // Only the fields above are used. The rest defined here are meaningless, only populated to comply to type.
    ...adaptGeneralInsightField(insightDetail),
    chartKey: RAQIV2PredefinedChartKey.AcquisitionHomeRecommendationQualifiedPTR,
    summaryValue: 0,
    context: {
      resource: {
        id: insightDetail.universeId,
        type: ChartResourceType.Universe,
      },
      timeSpec: {
        startTime: startDate,
        endTime: endDate,
      },
      granularity: RAQIV2MetricGranularity.None,
      breakdown: [],
      filter: [],
      timeAxisBounds: null,
    },
  };
};

export const adaptSummaryReport7Days = (insightDetail: Insight): SummaryReport7DaysCardSpec => {
  const { startDate, endDate, reportSummary, recommendations, newSignalCount } =
    validateSummaryReportEvidence(insightDetail);

  return {
    type: InsightTypeV2.SummaryReport7Days,
    startDate,
    endDate,
    reportSummary,
    recommendations,
    newSignalCount,
    // Only the fields above are used. The rest defined here are meaningless, only populated to comply to type.
    ...adaptGeneralInsightField(insightDetail),
    chartKey: RAQIV2PredefinedChartKey.AcquisitionHomeRecommendationQualifiedPTR,
    summaryValue: 0,
    context: {
      resource: {
        id: insightDetail.universeId,
        type: ChartResourceType.Universe,
      },
      timeSpec: {
        startTime: startDate,
        endTime: endDate,
      },
      granularity: RAQIV2MetricGranularity.None,
      breakdown: [],
      filter: [],
      timeAxisBounds: null,
    },
  };
};
