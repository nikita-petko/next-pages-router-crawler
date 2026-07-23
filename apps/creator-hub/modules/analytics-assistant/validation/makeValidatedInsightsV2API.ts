import type {
  Signal as DangerousSignal,
  KpiChangeData as DangerousKpiChangeData,
  OnboardingFunnelData as DangerousOnboardingFunnelData,
  SignificantFunnelStepData as DangerousSignificantFunnelStepData,
  OutlierData as DangerousOutlierData,
  BenchmarkData as DangerousBenchmarkData,
  UnderPerformingSegmentData as DangerousUnderPerformingSegmentData,
  BreakdownValue as DangerousBreakdownValue,
  QueryFilter as DangerousQueryFilter,
  Insight as DangerousInsight,
  SummaryReportEvidence as DangerousSummaryReportEvidence,
  MetricsSummaryEvidence as DangerousMetricsSummaryEvidence,
  Report as DangerousReport,
  ReportSection as DangerousReportSection,
  RetentionPowerCurveData as DangerousRetentionPowerCurveData,
  PowerCurveAnalysisResult,
  RatioKpiChangeAttributionData as DangerousRatioKpiChangeAttributionData,
  SeasonalBenchmarkComparisonData as DangerousSeasonalBenchmarkComparisonData,
  SeasonalBenchmarkComparisonType,
  SeasonalBenchmarkPeriodType,
} from '@rbx/client-universe-analytics-insights/v1';
import {
  ResourceType,
  MetricGranularity,
  SignalType,
  type GenericSignalChart as DangerousGenericSignalChart,
} from '@rbx/client-universe-analytics-insights/v1';
import {
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
  RAQIV2UIMetric,
  type TRAQIV2Metric,
} from '@rbx/creator-hub-analytics-config';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import type { QueryFilter } from '@modules/clients/analytics/analyticsRAQIShared';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';

// Validated types that are type-safe and have required fields
export type ValidatedKpiChangeData = {
  currentValue?: number;
  previousValue?: number;
  absoluteChange?: number;
  percentChange?: number;
  impact?: number;
  breakdowns: ValidatedBreakdownValue[];
  filters: QueryFilter[];
};

export type ValidatedOnboardingFunnelData = {
  dropoffPercentage: number;
  firstEligibleStep: number; // Make this required since we need it
  firstEligibleStepName?: string;
};

export type ValidatedOutlierData = {
  segmentMetricName?: string;
  segmentSize?: number;
  segmentMetricPercentChange?: number;
  overallSize?: number;
  overallMetricPercentChange?: number;
  breakdowns: ValidatedBreakdownValue[];
  filters: QueryFilter[];
};

export type ValidatedBenchmarkData = {
  currentPercentile?: number;
  currentValue?: number;
};

export type ValidatedUnderPerformingSegmentData = {
  currentPercentile?: string;
  currentValue?: number;
  segmentMetricName?: string;
  segmentSize?: number;
  segmentValue?: number;
  breakdowns: ValidatedBreakdownValue[];
};

export type ValidatedRetentionPowerCurveCurveData = {
  coefficient: number;
  exponent: number;
  rSquared: number;
  pointCount: number;
};

export type ValidatedRetentionPowerCurveData = {
  universeCurve: ValidatedRetentionPowerCurveCurveData;
  benchmarkCurve: ValidatedRetentionPowerCurveCurveData;
  result: PowerCurveAnalysisResult;
  xIntercept?: number;
};

export type ValidatedRatioKpiChangeAttributionData = {
  percentChange: number;
  denominatorPercentChange: number;
  denominatorTopContributors: ValidatedBreakdownValue[];
};

export type ValidatedBreakdownValue = {
  dimension: RAQIV2Dimension;
  value?: string;
};

export type ValidatedSeasonalBenchmarkComparisonData = {
  percentChange: number;
  seasonName: string;
  comparisonType: SeasonalBenchmarkComparisonType;
  periodType: SeasonalBenchmarkPeriodType;
};

export type ValidatedSignificantFunnelStepData = {
  funnelName: string;
  funnelStep: number;
  funnelStepName?: string;
  churnRate: number;
};

export type ValidatedGenericSignalChart = {
  metric: TRAQIV2Metric;
  granularity: RAQIV2MetricGranularity;
  breakdown: RAQIV2Dimension[];
  filter: QueryFilter[];
  startTime?: string;
  endTime?: string;
  universeId?: number;
  limit?: number;
};

export type ValidatedGenericSignalData = {
  charts: ValidatedGenericSignalChart[];
};

// Union type for validated signal-specific data
export type ValidatedSignalData =
  | { signalType: typeof SignalType.KpiChange; data: ValidatedKpiChangeData }
  | { signalType: typeof SignalType.OnboardingFunnel; data: ValidatedOnboardingFunnelData }
  | { signalType: typeof SignalType.Outlier; data: ValidatedOutlierData }
  | { signalType: typeof SignalType.Benchmark; data: ValidatedBenchmarkData }
  | {
      signalType: typeof SignalType.UnderPerformingSegments;
      data: ValidatedUnderPerformingSegmentData;
    }
  | { signalType: typeof SignalType.VirtualEvent; data: undefined }
  | { signalType: typeof SignalType.PlayerFeedback; data: undefined }
  | { signalType: typeof SignalType.Invalid; data: undefined }
  | { signalType: typeof SignalType.RetentionPowerCurve; data: ValidatedRetentionPowerCurveData }
  | {
      signalType: typeof SignalType.RatioKpiChangeAttribution;
      data: ValidatedRatioKpiChangeAttributionData;
    }
  | {
      signalType: typeof SignalType.SeasonalBenchmarkComparison;
      data: ValidatedSeasonalBenchmarkComparisonData;
    }
  | {
      signalType: typeof SignalType.SignificantFunnelStep;
      data: ValidatedSignificantFunnelStepData;
    }
  | { signalType: typeof SignalType.Generic; data: ValidatedGenericSignalData };

export type ValidatedSignal = {
  metric: string; // Required
  signalType: SignalType; // Required
  startUtcTime: string; // Required
  endUtcTime: string; // Required
  signalData: ValidatedSignalData; // Required and properly typed
};

export type ValidatedReportSection = {
  content: string;
  signals: ValidatedSignal[];
  recommendations: string[]; // Simplified for now
};

export type ValidatedReport = {
  sections: ValidatedReportSection[];
};

export type ValidatedSummaryReportEvidence = {
  signals: ValidatedSignal[];
  report?: ValidatedReport;
};

export type ValidatedMetricsSummaryEvidence = {
  startUtcTime?: string;
  endUtcTime?: string;
  report?: ValidatedReport;
};

export type ValidatedInsight = {
  id: string; // Required
  insightType: string; // Required
  summaryReportEvidence?: ValidatedSummaryReportEvidence;
  metricsSummaryEvidence?: ValidatedMetricsSummaryEvidence;
  recommendations: string[]; // Simplified for now
};

// Validation functions
const toValidatedBreakdownValue = (
  dangerous: DangerousBreakdownValue,
): ValidatedBreakdownValue | null => {
  if (!dangerous.dimension) {
    logAnalyticsError('BreakdownValue missing required dimension');
    return null;
  }

  if (!isValidEnumValue(RAQIV2Dimension, dangerous.dimension)) {
    logAnalyticsError(`Invalid dimension in BreakdownValue: ${dangerous.dimension}`);
    return null;
  }

  return {
    dimension: dangerous.dimension as RAQIV2Dimension,
    value: dangerous.value,
  };
};

const toValidatedQueryFilter = (dangerous: DangerousQueryFilter): QueryFilter | null => {
  if (!dangerous.dimension || !dangerous.values || dangerous.values.length === 0) {
    logAnalyticsError('QueryFilter missing required dimension or values');
    return null;
  }

  if (!isValidEnumValue(RAQIV2Dimension, dangerous.dimension)) {
    logAnalyticsError(`Invalid dimension in QueryFilter: ${dangerous.dimension}`);
    return null;
  }

  return {
    dimension: dangerous.dimension as RAQIV2Dimension,
    values: dangerous.values,
  };
};

const toValidatedKpiChangeData = (dangerous: DangerousKpiChangeData): ValidatedKpiChangeData => {
  const breakdowns = (dangerous.breakdowns || [])
    .map(toValidatedBreakdownValue)
    .filter((b): b is ValidatedBreakdownValue => b !== null);

  const filters = (dangerous.filters || [])
    .map(toValidatedQueryFilter)
    .filter((f): f is QueryFilter => f !== null);

  return {
    currentValue: dangerous.currentValue,
    previousValue: dangerous.previousValue,
    absoluteChange: dangerous.absoluteChange,
    percentChange: dangerous.percentChange,
    impact: dangerous.impact,
    breakdowns,
    filters,
  };
};

const toValidatedOnboardingFunnelData = (
  dangerous: DangerousOnboardingFunnelData,
): ValidatedOnboardingFunnelData => {
  if (dangerous.firstEligibleStep === undefined || dangerous.firstEligibleStep === null) {
    throw new Error('OnboardingFunnelData missing required firstEligibleStep');
  }

  if (dangerous.dropoffPercentage === undefined || dangerous.dropoffPercentage === null) {
    throw new Error('OnboardingFunnelData missing required dropoffPercentage');
  }

  return {
    dropoffPercentage: dangerous.dropoffPercentage,
    firstEligibleStep: dangerous.firstEligibleStep,
    firstEligibleStepName: dangerous.firstEligibleStepName,
  };
};

const toValidatedOutlierData = (dangerous: DangerousOutlierData): ValidatedOutlierData => {
  const breakdowns = (dangerous.breakdowns || [])
    .map(toValidatedBreakdownValue)
    .filter((b): b is ValidatedBreakdownValue => b !== null);

  const filters = (dangerous.filters || [])
    .map(toValidatedQueryFilter)
    .filter((f): f is QueryFilter => f !== null);

  return {
    segmentMetricName: dangerous.segmentMetricName,
    segmentSize: dangerous.segmentSize,
    segmentMetricPercentChange: dangerous.segmentMetricPercentChange,
    overallSize: dangerous.overallSize,
    overallMetricPercentChange: dangerous.overallMetricPercentChange,
    breakdowns,
    filters,
  };
};

const toValidatedBenchmarkData = (dangerous: DangerousBenchmarkData): ValidatedBenchmarkData => {
  return {
    currentPercentile: dangerous.currentPercentile,
    currentValue: dangerous.currentValue,
  };
};

const toValidatedUnderPerformingSegmentData = (
  dangerous: DangerousUnderPerformingSegmentData,
): ValidatedUnderPerformingSegmentData => {
  const breakdowns = (dangerous.breakdowns || [])
    .map(toValidatedBreakdownValue)
    .filter((b): b is ValidatedBreakdownValue => b !== null);

  return {
    currentPercentile: dangerous.currentPercentile,
    currentValue: dangerous.currentValue,
    segmentMetricName: dangerous.segmentMetricName,
    segmentSize: dangerous.segmentSize,
    segmentValue: dangerous.segmentValue,
    breakdowns,
  };
};

const toValidatedRetentionPowerCurveData = (
  dangerous: DangerousRetentionPowerCurveData,
): ValidatedRetentionPowerCurveData => {
  if (!dangerous.universeCurve) {
    throw new Error('RetentionPowerCurveData missing required universeCurve');
  }

  if (!dangerous.benchmarkCurve) {
    throw new Error('RetentionPowerCurveData missing required benchmarkCurve');
  }

  if (!dangerous.result) {
    throw new Error('RetentionPowerCurveData missing required result');
  }

  const validatePowerCurve = (
    curve:
      | { coefficient?: number; exponent?: number; rSquared?: number; pointCount?: number }
      | undefined,
    curveName: string,
  ) => {
    if (!curve) {
      throw new Error(`${curveName} is missing`);
    }
    if (curve.coefficient === undefined || curve.coefficient === null) {
      throw new Error(`${curveName} missing required coefficient`);
    }
    if (curve.exponent === undefined || curve.exponent === null) {
      throw new Error(`${curveName} missing required exponent`);
    }
    if (curve.rSquared === undefined || curve.rSquared === null) {
      throw new Error(`${curveName} missing required rSquared`);
    }
    if (curve.pointCount === undefined || curve.pointCount === null) {
      throw new Error(`${curveName} missing required pointCount`);
    }
    return {
      coefficient: curve.coefficient,
      exponent: curve.exponent,
      rSquared: curve.rSquared,
      pointCount: curve.pointCount,
    };
  };

  return {
    universeCurve: validatePowerCurve(dangerous.universeCurve, 'universeCurve'),
    benchmarkCurve: validatePowerCurve(dangerous.benchmarkCurve, 'benchmarkCurve'),
    result: dangerous.result,
    xIntercept: dangerous.xIntercept,
  };
};

const toValidatedRatioKpiChangeAttributionData = (
  dangerous: DangerousRatioKpiChangeAttributionData,
): ValidatedRatioKpiChangeAttributionData => {
  const denominatorTopContributors = (dangerous.denominatorTopContributors || [])
    .map(toValidatedBreakdownValue)
    .filter((b): b is ValidatedBreakdownValue => b !== null);

  if (dangerous.percentChange === undefined || dangerous.percentChange === null) {
    throw new Error('RatioKpiChangeAttributionData missing required percentChange');
  }

  if (
    dangerous.denominatorPercentChange === undefined ||
    dangerous.denominatorPercentChange === null
  ) {
    throw new Error('RatioKpiChangeAttributionData missing required denominatorPercentChange');
  }

  return {
    percentChange: dangerous.percentChange,
    denominatorPercentChange: dangerous.denominatorPercentChange,
    denominatorTopContributors,
  };
};

const toValidatedSeasonalBenchmarkComparisonData = (
  dangerous: DangerousSeasonalBenchmarkComparisonData,
): ValidatedSeasonalBenchmarkComparisonData => {
  if (dangerous.percentChange == null) {
    throw new Error('SeasonalBenchmarkComparisonData missing required percentChange');
  }

  if (!dangerous.seasonName) {
    throw new Error('SeasonalBenchmarkComparisonData missing required seasonName');
  }

  if (!dangerous.comparisonType) {
    throw new Error('SeasonalBenchmarkComparisonData missing required comparisonType');
  }

  if (!dangerous.periodType) {
    throw new Error('SeasonalBenchmarkComparisonData missing required periodType');
  }

  return {
    percentChange: dangerous.percentChange,
    seasonName: dangerous.seasonName,
    comparisonType: dangerous.comparisonType,
    periodType: dangerous.periodType,
  };
};

const mapToRaqiV2MetricGranularity = (
  granularity: MetricGranularity | undefined,
): RAQIV2MetricGranularity => {
  switch (granularity) {
    case MetricGranularity.OneMinute:
      return RAQIV2MetricGranularity.OneMinute;
    case MetricGranularity.OneHour:
      return RAQIV2MetricGranularity.OneHour;
    case MetricGranularity.HalfHour:
      return RAQIV2MetricGranularity.HalfHour;
    case MetricGranularity.OneDay:
      return RAQIV2MetricGranularity.OneDay;
    case MetricGranularity.OneWeek:
      return RAQIV2MetricGranularity.OneWeek;
    case MetricGranularity.OneMonth:
      return RAQIV2MetricGranularity.OneMonth;
    case MetricGranularity.None:
      return RAQIV2MetricGranularity.None;
    case MetricGranularity.DefaultGranularity:
    case MetricGranularity.Invalid:
    default:
      return RAQIV2MetricGranularity.OneDay;
  }
};

const toValidatedGenericSignalChart = (
  chart: DangerousGenericSignalChart,
): ValidatedGenericSignalChart | null => {
  const { query } = chart;
  if (
    !query?.metric ||
    (!isValidEnumValue(RAQIV2Metric, query.metric) &&
      !isValidEnumValue(RAQIV2UIMetric, query.metric))
  ) {
    return null;
  }

  const breakdown = (query.breakdown ?? [])
    .flatMap((b) => b.dimensions ?? [])
    .filter((d): d is RAQIV2Dimension => d !== undefined && isValidEnumValue(RAQIV2Dimension, d));

  const filter = (query.filter ?? [])
    .filter(
      (f) => f.dimension && f.values?.length && isValidEnumValue(RAQIV2Dimension, f.dimension),
    )
    .map((f) => ({
      dimension: f.dimension as RAQIV2Dimension,
      values: f.values as string[],
    }));

  const parsed =
    query.resourceType === ResourceType.Universe && query.resourceId
      ? Number.parseInt(query.resourceId, 10)
      : NaN;
  const universeId = Number.isNaN(parsed) ? undefined : parsed;

  return {
    metric: query.metric as TRAQIV2Metric,
    granularity: mapToRaqiV2MetricGranularity(query.granularity),
    breakdown,
    filter,
    startTime: query.startTime || undefined,
    endTime: query.endTime || undefined,
    universeId,
    limit: query.limit,
  };
};

const toValidatedGenericSignalData = (dangerous: DangerousSignal): ValidatedGenericSignalData => {
  const { genericSignal } = dangerous;
  if (!genericSignal?.charts?.length) {
    return { charts: [] };
  }

  const charts = genericSignal.charts
    .map(toValidatedGenericSignalChart)
    .filter((c): c is ValidatedGenericSignalChart => c !== null);

  return { charts };
};

const toValidatedSignificantFunnelStepData = (
  dangerous: DangerousSignificantFunnelStepData,
): ValidatedSignificantFunnelStepData => {
  if (!dangerous.funnelName) {
    throw new Error('SignificantFunnelStepData missing required funnelName');
  }

  if (dangerous.funnelStep === undefined || dangerous.funnelStep === null) {
    throw new Error('SignificantFunnelStepData missing required funnelStep');
  }

  if (dangerous.churnRate === undefined || dangerous.churnRate === null) {
    throw new Error('SignificantFunnelStepData missing required churnRate');
  }

  return {
    funnelName: dangerous.funnelName,
    funnelStep: dangerous.funnelStep,
    funnelStepName: dangerous.funnelStepName,
    churnRate: dangerous.churnRate,
  };
};

const toValidatedSignalData = (dangerous: DangerousSignal): ValidatedSignalData => {
  if (!dangerous.signalType) {
    throw new Error('Signal missing required signalType');
  }

  switch (dangerous.signalType) {
    case SignalType.KpiChange:
      if (!dangerous.kpiChange) {
        throw new Error('KpiChange signal missing kpiChange data');
      }
      return {
        signalType: SignalType.KpiChange,
        data: toValidatedKpiChangeData(dangerous.kpiChange),
      };

    case SignalType.OnboardingFunnel:
      if (!dangerous.onboardingFunnel) {
        throw new Error('OnboardingFunnel signal missing onboardingFunnel data');
      }
      return {
        signalType: SignalType.OnboardingFunnel,
        data: toValidatedOnboardingFunnelData(dangerous.onboardingFunnel),
      };

    case SignalType.Outlier:
      if (!dangerous.outlier) {
        throw new Error('Outlier signal missing outlier data');
      }
      return {
        signalType: SignalType.Outlier,
        data: toValidatedOutlierData(dangerous.outlier),
      };

    case SignalType.Benchmark:
      if (!dangerous.benchmark) {
        throw new Error('Benchmark signal missing benchmark data');
      }
      return {
        signalType: SignalType.Benchmark,
        data: toValidatedBenchmarkData(dangerous.benchmark),
      };

    case SignalType.UnderPerformingSegments:
      if (!dangerous.underPerformingSegment) {
        throw new Error('UnderPerformingSegments signal missing underPerformingSegment data');
      }
      return {
        signalType: SignalType.UnderPerformingSegments,
        data: toValidatedUnderPerformingSegmentData(dangerous.underPerformingSegment),
      };

    case SignalType.VirtualEvent:
      return {
        signalType: SignalType.VirtualEvent,
        data: undefined,
      };

    case SignalType.PlayerFeedback:
      return {
        signalType: SignalType.PlayerFeedback,
        data: undefined,
      };

    case SignalType.Invalid:
      return {
        signalType: SignalType.Invalid,
        data: undefined,
      };

    case SignalType.RetentionPowerCurve:
      if (!dangerous.retentionPowerCurve) {
        throw new Error('RetentionPowerCurve signal missing retentionPowerCurve data');
      }
      return {
        signalType: SignalType.RetentionPowerCurve,
        data: toValidatedRetentionPowerCurveData(dangerous.retentionPowerCurve),
      };

    case SignalType.RatioKpiChangeAttribution:
      if (!dangerous.ratioKpiChangeAttribution) {
        throw new Error('RatioKpiChangeAttribution signal missing ratioKpiChangeAttribution data');
      }
      return {
        signalType: SignalType.RatioKpiChangeAttribution,
        data: toValidatedRatioKpiChangeAttributionData(dangerous.ratioKpiChangeAttribution),
      };
    case SignalType.SeasonalBenchmarkComparison:
      if (!dangerous.seasonalBenchmarkComparison) {
        throw new Error(
          'SeasonalBenchmarkComparison signal missing seasonalBenchmarkComparison data',
        );
      }
      return {
        signalType: SignalType.SeasonalBenchmarkComparison,
        data: toValidatedSeasonalBenchmarkComparisonData(dangerous.seasonalBenchmarkComparison),
      };

    case SignalType.SignificantFunnelStep:
      if (!dangerous.significantFunnelStep) {
        throw new Error('SignificantFunnelStep signal missing significantFunnelStep data');
      }
      return {
        signalType: SignalType.SignificantFunnelStep,
        data: toValidatedSignificantFunnelStepData(dangerous.significantFunnelStep),
      };

    case SignalType.Generic:
      return {
        signalType: SignalType.Generic,
        data: toValidatedGenericSignalData(dangerous),
      };

    default: {
      const exhaustiveCheck: never = dangerous.signalType;
      throw new Error(`Unhandled signal type: ${exhaustiveCheck}`);
    }
  }
};

export const toValidatedSignal = (dangerous: DangerousSignal): ValidatedSignal => {
  if (!dangerous.metric) {
    throw new Error('Signal missing required metric');
  }

  if (!dangerous.signalType) {
    throw new Error('Signal missing required signalType');
  }

  if (!dangerous.startUtcTime) {
    throw new Error('Signal missing required startUtcTime');
  }

  if (!dangerous.endUtcTime) {
    throw new Error('Signal missing required endUtcTime');
  }

  return {
    metric: dangerous.metric,
    signalType: dangerous.signalType,
    startUtcTime: dangerous.startUtcTime,
    endUtcTime: dangerous.endUtcTime,
    signalData: toValidatedSignalData(dangerous),
  };
};

export const toValidatedReportSection = (
  dangerous: DangerousReportSection,
): ValidatedReportSection | null => {
  try {
    const signals = (dangerous.signals || [])
      .map((signal) => {
        try {
          return toValidatedSignal(signal);
        } catch (err) {
          logAnalyticsError(`Error validating signal: ${err}`);
          return null;
        }
      })
      .filter((signal): signal is ValidatedSignal => signal !== null);

    return {
      content: dangerous.content || '',
      signals,
      recommendations: dangerous.recommendations?.map((r) => r.recommendationType || '') || [],
    };
  } catch (err) {
    logAnalyticsError(`Error validating report section: ${err}`);
    return null;
  }
};

export const toValidatedReport = (dangerous: DangerousReport): ValidatedReport => {
  const sections = (dangerous.sections || [])
    .map(toValidatedReportSection)
    .filter((section): section is ValidatedReportSection => section !== null);

  return { sections };
};

export const toValidatedSummaryReportEvidence = (
  dangerous: DangerousSummaryReportEvidence,
): ValidatedSummaryReportEvidence => {
  const signals = (dangerous.signals || [])
    .map((signal) => {
      try {
        return toValidatedSignal(signal);
      } catch (err) {
        logAnalyticsError(`Error validating signal in evidence: ${err}`);
        return null;
      }
    })
    .filter((signal): signal is ValidatedSignal => signal !== null);

  return {
    signals,
    report: dangerous.report ? toValidatedReport(dangerous.report) : undefined,
  };
};

export const toValidatedMetricsSummaryEvidence = (
  dangerous: DangerousMetricsSummaryEvidence,
): ValidatedMetricsSummaryEvidence => {
  return {
    startUtcTime: dangerous.input?.startUtcTime,
    endUtcTime: dangerous.input?.endUtcTime,
    report: dangerous.report ? toValidatedReport(dangerous.report) : undefined,
  };
};

export const toValidatedInsight = (dangerous: DangerousInsight): ValidatedInsight => {
  if (!dangerous.id) {
    throw new Error('Insight missing required id');
  }

  if (!dangerous.insightType) {
    throw new Error('Insight missing required insightType');
  }

  return {
    id: dangerous.id,
    insightType: dangerous.insightType,
    summaryReportEvidence: dangerous.summaryReportEvidence
      ? toValidatedSummaryReportEvidence(dangerous.summaryReportEvidence)
      : undefined,
    metricsSummaryEvidence: dangerous.metricsSummaryEvidence
      ? toValidatedMetricsSummaryEvidence(dangerous.metricsSummaryEvidence)
      : undefined,
    recommendations: dangerous.recommendations?.map((r) => r.recommendationType || '') || [],
  };
};
