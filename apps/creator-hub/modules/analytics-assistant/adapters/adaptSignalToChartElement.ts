import {
  RAQIV2Dimension,
  RAQIV2IsNewUser,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
  RAQIV2ProductType,
  RAQIV2RevenueSource,
  RAQIV2UIMetric,
  RAQIV2UIPseudoDimension,
  TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import { SignalType } from '@rbx/client-universe-analytics-insights/v1';
import {
  ItemMonetizationProductTypes,
  MonetizationProductTypes,
  RAQIV2QueryFilter,
} from '@modules/clients/analytics';
import {
  RAQIV2PredefinedChartKey,
  RAQIV2ChartContext,
  isExploreModeMetric,
  tableConfigFunnelsProgressionByUserRealtime,
  ChartConfigWithPredefinedKey,
  getExploreModeDimensions,
  getAnalyticsMetricDisplayConfig,
  isNumericUIMetric,
  type TRAQIV2NumericUIMetric,
  type ChartConfig,
} from '@modules/experience-analytics-shared';
import { ChartResourceType, ChartType } from '@modules/charts-generic';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { TranslationKey } from '@modules/analytics-translations';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { QueryFilter } from '../../clients/analytics/analyticsRAQIShared';
import { SignalChartElement, SignalChartElementType } from '../types/AssistantSignalChartElement';
import {
  SummaryReportUISignal,
  SummaryReportSignalMetric,
  NonRAQIAssistantMetric,
} from '../types/AssistantUISignal';
import {
  RAQIV2IsNewUserToAcquisitionChartConfigMap,
  RAQIV2RevenueSourceToMonetizationProductType,
} from '../constants/AssistantMetricToPredefinedChartConfig';

const AssistantCanvasChartHeight = 250;

const MonetizationProductTypeToRAQIV2ProductType: Record<
  ItemMonetizationProductTypes,
  RAQIV2ProductType
> = {
  [MonetizationProductTypes.GameshopItem]: RAQIV2ProductType.DevProduct,
  [MonetizationProductTypes.GamePass]: RAQIV2ProductType.GamePass,
  [MonetizationProductTypes.AffiliateFeeAvatar]: RAQIV2ProductType.CommissionAvatar,
};

// NOTE(lucaswang, 2025-02-28): Not all dimensions for a metric from Hive are supported by CAaaS.
// Filter out unsupported breakdowns individually to avoid sending invalid requests.
const filterSupportedBreakdowns = (
  metric: SummaryReportSignalMetric,
  breakdowns: RAQIV2Dimension[],
): RAQIV2Dimension[] => {
  if (breakdowns.length === 0) return [];
  if (!isExploreModeMetric(metric)) return breakdowns;
  const supportedDimensions = getExploreModeDimensions()[metric] || [];
  return breakdowns.filter((d) => supportedDimensions.includes(d));
};

const getBreakdownsFromSignalMetadata = (
  signal: SummaryReportUISignal,
  metric: SummaryReportSignalMetric,
): RAQIV2Dimension[] => {
  if (signal.signalMetadata) {
    switch (signal.signalMetadata.signalType) {
      case SignalType.KpiChange:
      case SignalType.Outlier:
      case SignalType.UnderPerformingSegments: {
        const { data } = signal.signalMetadata;
        const rawBreakdowns =
          data.breakdowns
            ?.map(({ dimension }: { dimension: RAQIV2Dimension }) => dimension)
            .filter(
              (dimension): dimension is RAQIV2Dimension =>
                dimension !== undefined && isValidEnumValue(RAQIV2Dimension, dimension),
            ) ?? [];
        return filterSupportedBreakdowns(metric, rawBreakdowns);
      }
      case SignalType.RatioKpiChangeAttribution: {
        switch (signal.metric) {
          case RAQIV2Metric.ForwardD1Retention: {
            const { data } = signal.signalMetadata;
            const dimensions =
              data.denominatorTopContributors?.map(
                ({ dimension }: { dimension: RAQIV2Dimension }) => dimension,
              ) ?? [];

            return filterSupportedBreakdowns(metric, Array.from(new Set(dimensions)));
          }
          default: {
            return [];
          }
        }
      }
      case SignalType.Benchmark:
      case SignalType.VirtualEvent:
      case SignalType.Invalid:
      case SignalType.PlayerFeedback:
      case SignalType.OnboardingFunnel:
      case SignalType.RetentionPowerCurve:
      case SignalType.SeasonalBenchmarkComparison:
      case SignalType.SignificantFunnelStep:
      case SignalType.Generic: {
        return [];
      }
      default: {
        const exhaustiveCheck: never = signal.signalMetadata;
        throw new Error(`Unhandled signal type: ${JSON.stringify(exhaustiveCheck)}`);
      }
    }
  }

  return [];
};

const filterSupportedFilters = (
  metric: SummaryReportSignalMetric,
  filters: QueryFilter[],
): QueryFilter[] => {
  if (filters.length === 0) return [];
  if (!isExploreModeMetric(metric)) return filters;
  const supportedDimensions = getExploreModeDimensions()[metric] || [];
  return filters.filter((f) => supportedDimensions.includes(f.dimension as RAQIV2Dimension));
};

const getFiltersFromSignalMetadata = (
  signal: SummaryReportUISignal,
  metric: SummaryReportSignalMetric,
): QueryFilter[] => {
  if (signal.signalMetadata) {
    switch (signal.signalMetadata.signalType) {
      case SignalType.KpiChange:
      case SignalType.Outlier:
      case SignalType.UnderPerformingSegments: {
        const { data } = signal.signalMetadata;
        const { breakdowns } = data;
        if (!breakdowns) return [];

        const rawFilters = breakdowns
          .filter(
            (breakdown: {
              dimension?: RAQIV2Dimension;
              value?: string;
            }): breakdown is { dimension: RAQIV2Dimension; value: string } =>
              breakdown.dimension !== undefined &&
              isValidEnumValue(RAQIV2Dimension, breakdown.dimension) &&
              breakdown.value !== undefined,
          )
          .map(({ dimension, value }: { dimension: RAQIV2Dimension; value: string }) => ({
            dimension,
            values: [value],
          }));
        return filterSupportedFilters(metric, rawFilters);
      }
      case SignalType.Benchmark:
      case SignalType.VirtualEvent:
      case SignalType.Invalid:
      case SignalType.PlayerFeedback:
      case SignalType.OnboardingFunnel:
      case SignalType.RetentionPowerCurve:
      case SignalType.RatioKpiChangeAttribution:
      case SignalType.SeasonalBenchmarkComparison:
      case SignalType.SignificantFunnelStep:
      case SignalType.Generic:
        return [];
      default: {
        const exhaustiveCheck: never = signal.signalMetadata;
        throw new Error(`Unhandled signal type: ${JSON.stringify(exhaustiveCheck)}`);
      }
    }
  }

  return [];
};

// Generic helper to get a validated filter value
const getValidFilterValue = <T>(
  filters: QueryFilter[],
  dimension: RAQIV2Dimension,
  enumType: { [key: string]: string },
): T | undefined => {
  const filter = filters.find((f) => f.dimension === dimension);

  if (!filter || filter.values.length !== 1 || !isValidEnumValue(enumType, filter.values[0])) {
    return undefined;
  }

  return filter.values[0] as T;
};

const buildBaseChartContext = (
  universeId: number,
  startDate: Date,
  endDate: Date,
): RAQIV2ChartContext => ({
  resource: { id: universeId, type: ChartResourceType.Universe },
  timeSpec: { startTime: startDate, endTime: endDate },
  granularity: RAQIV2MetricGranularity.OneDay,
  timeAxisBounds: 'disabled',
});

const hashBreakdowns = (breakdowns: readonly TRAQIV2Dimension[]): string =>
  [...breakdowns].sort().join(',');

const hashFilter = (filter: RAQIV2QueryFilter): string => {
  const sortedValues = [...filter.values].sort().join(',');
  return `${filter.dimension}:${sortedValues}`;
};

const hashFilters = (filters: readonly RAQIV2QueryFilter[]): string =>
  JSON.stringify([...filters].sort((a, b) => hashFilter(a).localeCompare(hashFilter(b))));

// NOTE(lucaswang, 2025-02-11): Only exported for tests
export const createItemMonetizationChartElement = (
  signal: SummaryReportUISignal,
  universeId: number,
): SignalChartElement | undefined => {
  const filters = getFiltersFromSignalMetadata(signal, signal.metric);
  const revenueSource = getValidFilterValue<RAQIV2RevenueSource>(
    filters,
    RAQIV2Dimension.RevenueSource,
    RAQIV2RevenueSource,
  );

  if (!revenueSource) {
    return undefined;
  }

  const itemType = RAQIV2RevenueSourceToMonetizationProductType[revenueSource];
  if (!itemType) {
    const chartContext = buildBaseChartContext(universeId, signal.startDate, signal.endDate);
    return {
      dedupKey: `predefined:${RAQIV2PredefinedChartKey.DailyRevenueBySource}::${hashFilters([])}`,
      type: SignalChartElementType.AnalyticsConfigChart,
      props: {
        chartKeyOrConfig: RAQIV2PredefinedChartKey.DailyRevenueBySource,
        chartContext,
      },
    };
  }

  const productType = MonetizationProductTypeToRAQIV2ProductType[itemType];
  const productTypeFilter: RAQIV2QueryFilter[] = [
    { dimension: RAQIV2Dimension.ProductType, values: [productType] },
  ];

  const chartConfig: ChartConfig = {
    type: AnalyticsComponentType.Chart,
    metric: RAQIV2Metric.ItemMonetizationRevenue,
    chartType: ChartType.Spline,
    titleKey: getAnalyticsMetricDisplayConfig(RAQIV2Metric.ItemMonetizationRevenue).localizedName,
    overrides: {
      breakdown: { override: [RAQIV2UIPseudoDimension.TopProductKeyForRevenue] },
      filter: { override: productTypeFilter },
    },
    chartHeight: AssistantCanvasChartHeight,
    inRoundedComparisonChipContext: true,
  } as ChartConfig;

  const chartContext: RAQIV2ChartContext = {
    ...buildBaseChartContext(universeId, signal.startDate, signal.endDate),
    filter: productTypeFilter,
  };

  return {
    dedupKey: `item-monetization:${itemType}`,
    type: SignalChartElementType.AnalyticsConfigChart,
    props: {
      chartKeyOrConfig: chartConfig,
      chartContext,
    },
  };
};

const getAcquisitionChartConfig = (
  signal: SummaryReportUISignal,
): ChartConfigWithPredefinedKey | undefined => {
  const { metric } = signal;
  if (!isValidEnumValue(RAQIV2Metric, metric)) return undefined;

  const isAcquisitionBySourceMetric = [
    RAQIV2Metric.UniqueUsersWithPlaySessions,
    RAQIV2Metric.UniqueUsersWithImpressions,
  ].includes(metric);

  if (!isAcquisitionBySourceMetric) return undefined;

  const filters = getFiltersFromSignalMetadata(signal, metric);
  const isNewUserBreakdown = getValidFilterValue<RAQIV2IsNewUser>(
    filters,
    RAQIV2Dimension.IsNewUser,
    RAQIV2IsNewUser,
  );
  if (!isNewUserBreakdown) return undefined;

  return RAQIV2IsNewUserToAcquisitionChartConfigMap[isNewUserBreakdown][metric];
};

const createAcquisitionChartElement = (
  signal: SummaryReportUISignal,
  universeId: number,
): SignalChartElement | undefined => {
  const chartConfig = getAcquisitionChartConfig(signal);
  if (!chartConfig) return undefined;

  const { chartKey: predefinedChartKey } = chartConfig;
  const chartContext = buildBaseChartContext(universeId, signal.startDate, signal.endDate);

  return {
    dedupKey: `predefined:${predefinedChartKey}::${hashFilters([])}`,
    type: SignalChartElementType.AnalyticsConfigChart,
    props: {
      chartKeyOrConfig: predefinedChartKey,
      chartContext,
    },
  };
};

const ONBOARDING_FUNNEL_ROWS_BEFORE_ELIGIBLE_STEP = 4;

// Creates a table element for onboarding funnel signal
export const createOnboardingFunnelTableElement = (
  signal: SummaryReportUISignal,
  universeId: number,
): SignalChartElement => {
  if (signal.signalMetadata?.signalType !== SignalType.OnboardingFunnel) {
    throw new Error('OnboardingFunnel signal missing required signalMetadata');
  }

  const { firstEligibleStep } = signal.signalMetadata.data;

  const end = firstEligibleStep - 1; // 0-indexed
  const start = Math.max(0, firstEligibleStep - 1 - ONBOARDING_FUNNEL_ROWS_BEFORE_ELIGIBLE_STEP); // include 4 rows before, but at least 0
  const rowRange = { start, end };

  const filter: RAQIV2QueryFilter[] = [
    {
      dimension: RAQIV2Dimension.FunnelName,
      values: ['FUNNEL_TYPE_ONBOARDING'],
    },
  ];

  return {
    dedupKey: `table:${tableConfigFunnelsProgressionByUserRealtime.tableKey}:${hashFilters(filter)}`,
    type: SignalChartElementType.AnalyticsConfigTable,
    props: {
      tableContext: {
        resource: { id: universeId, type: ChartResourceType.Universe },
        timeSpec: { startTime: signal.startDate, endTime: signal.endDate },
        filter,
        granularity: RAQIV2MetricGranularity.None,
      },
      config: tableConfigFunnelsProgressionByUserRealtime,
      rowRange,
    },
  };
};

const SIGNIFICANT_FUNNEL_STEP_ROWS_BEFORE = 4;

export const createSignificantFunnelStepTableElement = (
  signal: SummaryReportUISignal,
  universeId: number,
): SignalChartElement => {
  if (signal.signalMetadata?.signalType !== SignalType.SignificantFunnelStep) {
    throw new Error('SignificantFunnelStep signal missing required signalMetadata');
  }

  const { funnelStep, funnelName } = signal.signalMetadata.data;

  const end = funnelStep - 1;
  const start = Math.max(0, funnelStep - 1 - SIGNIFICANT_FUNNEL_STEP_ROWS_BEFORE);
  const rowRange = { start, end };

  const filter: RAQIV2QueryFilter[] = [
    {
      dimension: RAQIV2Dimension.FunnelName,
      values: [funnelName],
    },
  ];

  return {
    dedupKey: `table:${tableConfigFunnelsProgressionByUserRealtime.tableKey}:${hashFilters(filter)}`,
    type: SignalChartElementType.AnalyticsConfigTable,
    props: {
      tableContext: {
        resource: { id: universeId, type: ChartResourceType.Universe },
        timeSpec: { startTime: signal.startDate, endTime: signal.endDate },
        filter,
        granularity: RAQIV2MetricGranularity.None,
      },
      config: tableConfigFunnelsProgressionByUserRealtime,
      rowRange,
    },
  };
};

export const createRetentionPowerCurveChartElement = (
  signal: SummaryReportUISignal,
): SignalChartElement => {
  if (
    !signal.signalMetadata ||
    signal.signalMetadata.signalType !== SignalType.RetentionPowerCurve
  ) {
    throw new Error('RetentionPowerCurve signal missing required signalMetadata');
  }

  const { startDate, endDate } = signal;
  const { universeCurve, benchmarkCurve } = signal.signalMetadata.data;

  return {
    dedupKey: `retention-power-curve:${startDate.toISOString()}:${endDate.toISOString()}`,
    type: SignalChartElementType.RetentionPowerCurveChart,
    props: {
      startDate,
      endDate,
      universeCurve,
      benchmarkCurve,
      chartHeight: AssistantCanvasChartHeight,
    },
  };
};

export const createRetentionCohortTableElement = (
  signal: SummaryReportUISignal,
  universeId: number,
): SignalChartElement => {
  const { startDate, endDate } = signal;
  return {
    dedupKey: `retention-cohort-table:${startDate.toISOString()}:${endDate.toISOString()}`,
    type: SignalChartElementType.SimpleNewUserRetentionTable,
    props: {
      universeId,
      startDate,
      endDate,
    },
  };
};

// Dynamically constructs a ChartConfig from AnalyticsMetricDisplayConfig.
// Includes breakdowns and filters from signal metadata when present.
// Falls back to ChartType.Spline if exploreModeChartType is not set.
const createDynamicChartElement = (
  signal: SummaryReportUISignal,
  universeId: number,
): SignalChartElement | undefined => {
  const { metric } = signal;
  if (!isValidEnumValue(RAQIV2Metric, metric) && !isValidEnumValue(RAQIV2UIMetric, metric))
    return undefined;
  if (!isNumericUIMetric(metric)) return undefined;

  const numericMetric: TRAQIV2NumericUIMetric = metric;
  const displayConfig = getAnalyticsMetricDisplayConfig(numericMetric);
  const chartType = displayConfig.exploreModeChartType ?? ChartType.Spline;
  const { localizedName, localizedDescription } = displayConfig;
  const titleKey: TranslationKey = {
    key: localizedName.key,
    namespace: localizedName.namespace,
  };
  const definitionTooltipKey: TranslationKey | undefined = localizedDescription
    ? { key: localizedDescription.key, namespace: localizedDescription.namespace }
    : undefined;

  const chartConfig = {
    type: AnalyticsComponentType.Chart,
    metric: numericMetric,
    chartType,
    titleKey,
    definitionTooltipKey,
    overrides: {},
    chartHeight: AssistantCanvasChartHeight,
    inRoundedComparisonChipContext: true,
  } as ChartConfig;

  const breakdown = getBreakdownsFromSignalMetadata(signal, metric);
  const filter = getFiltersFromSignalMetadata(signal, metric);

  const chartContext = {
    ...buildBaseChartContext(universeId, signal.startDate, signal.endDate),
    breakdown,
    filter,
  };

  return {
    dedupKey: `dynamic:${metric}:${hashBreakdowns(breakdown)}:${hashFilters(filter)}`,
    type: SignalChartElementType.AnalyticsConfigChart,
    props: {
      chartKeyOrConfig: chartConfig,
      chartContext,
    },
  };
};

export const createGenericSignalChartElements = (
  signal: SummaryReportUISignal,
  universeId: number,
): SignalChartElement[] => {
  if (signal.signalMetadata?.signalType !== SignalType.Generic) {
    return [];
  }

  const { charts } = signal.signalMetadata.data;
  const elements: SignalChartElement[] = [];

  charts.forEach((chart, index) => {
    const {
      metric,
      granularity,
      breakdown: rawBreakdown,
      filter: rawFilter,
      startTime,
      endTime,
      universeId: chartUniverseId,
      limit,
    } = chart;

    if (!isNumericUIMetric(metric)) {
      return;
    }

    const numericMetric: TRAQIV2NumericUIMetric = metric;
    const displayConfig = getAnalyticsMetricDisplayConfig(numericMetric);
    const chartType = displayConfig.exploreModeChartType ?? ChartType.Spline;
    const titleKey: TranslationKey = {
      key: displayConfig.localizedName.key,
      namespace: displayConfig.localizedName.namespace,
    };
    const definitionTooltipKey: TranslationKey | undefined = displayConfig.localizedDescription
      ? {
          key: displayConfig.localizedDescription.key,
          namespace: displayConfig.localizedDescription.namespace,
        }
      : undefined;

    const chartConfig = {
      type: AnalyticsComponentType.Chart,
      metric: numericMetric,
      chartType,
      titleKey,
      definitionTooltipKey,
      overrides: {},
      chartHeight: AssistantCanvasChartHeight,
      inRoundedComparisonChipContext: true,
    } as ChartConfig;

    const breakdown = filterSupportedBreakdowns(numericMetric, rawBreakdown);
    const filter = filterSupportedFilters(numericMetric, rawFilter);

    const effectiveUniverseId = chartUniverseId ?? universeId;
    const startDate = startTime ? new Date(startTime) : signal.startDate;
    const endDate = endTime ? new Date(endTime) : signal.endDate;

    const chartContext: RAQIV2ChartContext = {
      resource: { id: effectiveUniverseId, type: ChartResourceType.Universe },
      timeSpec: { startTime: startDate, endTime: endDate },
      granularity,
      timeAxisBounds: 'disabled',
      breakdown,
      filter,
      ...(limit !== undefined ? { limit } : {}),
    };

    elements.push({
      dedupKey: `generic:${index}:${numericMetric}:${hashBreakdowns(breakdown)}:${hashFilters(filter)}:${startDate.toISOString()}:${endDate.toISOString()}`,
      type: SignalChartElementType.AnalyticsConfigChart,
      props: {
        chartKeyOrConfig: chartConfig,
        chartContext,
      },
    });
  });

  return elements;
};

const adaptSignalToChartElement = (
  signal: SummaryReportUISignal,
  universeId: number,
): SignalChartElement[] => {
  if (!signal.metric || !signal.signalType) {
    throw new Error('Signal is missing required data');
  }

  switch (signal.signalType) {
    case SignalType.KpiChange:
    case SignalType.Benchmark: {
      if (signal.metric === NonRAQIAssistantMetric.DailyItemRevenue) {
        const element = createItemMonetizationChartElement(signal, universeId);
        return element ? [element] : [];
      }
      const acquisitionElement = createAcquisitionChartElement(signal, universeId);
      if (acquisitionElement) return [acquisitionElement];
      const dynamicElement = createDynamicChartElement(signal, universeId);
      return dynamicElement ? [dynamicElement] : [];
    }
    case SignalType.UnderPerformingSegments:
    case SignalType.Outlier: {
      const element = createDynamicChartElement(signal, universeId);
      return element ? [element] : [];
    }

    case SignalType.OnboardingFunnel: {
      return [createOnboardingFunnelTableElement(signal, universeId)];
    }

    case SignalType.SignificantFunnelStep: {
      return [createSignificantFunnelStepTableElement(signal, universeId)];
    }

    case SignalType.RetentionPowerCurve: {
      return [createRetentionPowerCurveChartElement(signal)];
    }
    case SignalType.RatioKpiChangeAttribution: {
      switch (signal.metric) {
        case RAQIV2Metric.ForwardD1Retention: {
          if (!signal.signalMetadata) {
            return [];
          }
          const chartElement = createDynamicChartElement(signal, universeId);

          return [
            createRetentionCohortTableElement(signal, universeId),
            ...(chartElement ? [chartElement] : []),
          ];
        }
        case RAQIV2Metric.AverageRevenuePerPayingUser:
        case RAQIV2Metric.PayingUsersCVR: {
          const element = createDynamicChartElement(signal, universeId);
          return element ? [element] : [];
        }
        default: {
          return [];
        }
      }
    }

    case SignalType.Generic:
      return createGenericSignalChartElements(signal, universeId);

    case SignalType.Invalid:
    case SignalType.VirtualEvent:
    case SignalType.PlayerFeedback:
    case SignalType.SeasonalBenchmarkComparison:
      return [];

    default: {
      const exhaustiveCheck: never = signal.signalType;
      throw new Error(`Unhandled signal type: ${exhaustiveCheck}`);
    }
  }
};

export const dedupeSignalChartElements = (elements: SignalChartElement[]): SignalChartElement[] => {
  const seen = new Set<string>();

  return elements.filter((element) => {
    if (seen.has(element.dedupKey)) {
      return false;
    }

    seen.add(element.dedupKey);
    return true;
  });
};

export default adaptSignalToChartElement;
