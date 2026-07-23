import { useCallback, useMemo } from 'react';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { TranslationKey } from '@modules/analytics-translations/types';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import { useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import { isValidArrayEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type { ChartConfiguratorChartType } from '../../chartConfigurator/ChartConfiguratorChartTypes';
import type { TChartConfiguratorMetrics } from '../../chartConfigurator/chartConfiguratorMetricsConfig';
import getGranularityOptionsForMetric from '../../chartConfigurator/getGranularityOptionsForMetric';
import getSharedGranularityOptionsForMetrics from '../../chartConfigurator/getSharedGranularityOptionsForMetrics';
import isDurationChartMetric from '../../chartConfigurator/isDurationChartMetric';
import type RAQIV2ChartContext from '../../types/RAQIV2ChartContext';
import { type TUIGranularity, UIGranularities } from '../../utils/seriesGranularities';
import type {
  ChartConfiguratorSidebarAction,
  ChartConfiguratorChartControlsProps,
  ChartConfiguratorGranularityControlsProps,
  ChartConfiguratorMetricControlsProps,
} from './ChartConfiguratorSidebarModelTypes';

export type SidebarGranularityOption = {
  granularity: TUIGranularity;
  isAllowed: boolean;
  messageKey?: TranslationKey;
};

type ChartTypeGranularityTransition =
  | {
      kind: 'set-chart-type';
      chartType: ChartConfiguratorChartType;
    }
  | {
      kind: 'set-chart-type-with-granularity';
      chartType: ChartConfiguratorChartType;
      granularity: TUIGranularity;
    }
  | {
      kind: 'blocked';
    };

type GranularityTransition =
  | {
      kind: 'set-granularity';
      granularity: TUIGranularity;
    }
  | {
      kind: 'set-chart-type-with-granularity';
      chartType: ChartConfiguratorChartType;
      granularity: TUIGranularity;
    }
  | {
      kind: 'blocked';
    };

const isChartTypeCumulativeCompatible = (type: ChartConfiguratorChartType) =>
  type === ChartType.Bar ||
  type === ChartType.Pie ||
  type === ChartType.DurationSpline ||
  type === ChartType.DurationArea ||
  // Tables render either a cumulative row per breakdown (granularity = None)
  // or one row per (breakdown, time bucket) when granularity is non-None;
  // either flow is valid, so tables are cumulative-compatible.
  type === ChartType.Table;

const firstAllowedNonCumulativeGranularity = (
  granularityOptions: readonly SidebarGranularityOption[],
): TUIGranularity | undefined =>
  granularityOptions.find(
    (option) => option.granularity !== RAQIV2MetricGranularity.None && option.isAllowed,
  )?.granularity;

export function resolveGranularityChangeTransition({
  chartType,
  currentGranularity,
  nextGranularity,
}: {
  chartType: ChartConfiguratorChartType;
  currentGranularity: TUIGranularity;
  nextGranularity: TUIGranularity;
}): GranularityTransition {
  if (chartType === ChartType.Table) {
    return { kind: 'set-granularity', granularity: nextGranularity };
  }
  if (nextGranularity === RAQIV2MetricGranularity.None) {
    return {
      kind: 'set-chart-type-with-granularity',
      chartType: ChartType.Bar,
      granularity: nextGranularity,
    };
  }
  if (currentGranularity === RAQIV2MetricGranularity.None) {
    return {
      kind: 'set-chart-type-with-granularity',
      chartType: ChartType.Spline,
      granularity: nextGranularity,
    };
  }
  return { kind: 'set-granularity', granularity: nextGranularity };
}

export function resolveChartTypeGranularityTransition({
  currentChartType,
  nextChartType,
  currentGranularity,
  granularityOptions,
}: {
  currentChartType: ChartConfiguratorChartType;
  nextChartType: ChartConfiguratorChartType;
  currentGranularity: TUIGranularity;
  granularityOptions: readonly SidebarGranularityOption[];
}): ChartTypeGranularityTransition {
  const isCumulative = currentGranularity === RAQIV2MetricGranularity.None;
  const nextIsCumulativeCompatible = isChartTypeCumulativeCompatible(nextChartType);

  if (isCumulative && !nextIsCumulativeCompatible) {
    const firstAllowed = firstAllowedNonCumulativeGranularity(granularityOptions);
    return firstAllowed
      ? {
          kind: 'set-chart-type-with-granularity',
          chartType: nextChartType,
          granularity: firstAllowed,
        }
      : { kind: 'blocked' };
  }

  if (!isCumulative && nextIsCumulativeCompatible && nextChartType !== ChartType.Table) {
    return {
      kind: 'set-chart-type-with-granularity',
      chartType: nextChartType,
      granularity: RAQIV2MetricGranularity.None,
    };
  }

  if (currentChartType === nextChartType) {
    return { kind: 'blocked' };
  }

  return { kind: 'set-chart-type', chartType: nextChartType };
}

export function resolveTimestampToggleGranularity({
  currentGranularity,
  granularityOptions,
}: {
  currentGranularity: TUIGranularity;
  granularityOptions: readonly SidebarGranularityOption[];
}): TUIGranularity | null {
  if (currentGranularity !== RAQIV2MetricGranularity.None) {
    const isCumulativeAllowed = granularityOptions.some(
      (option) => option.granularity === RAQIV2MetricGranularity.None && option.isAllowed,
    );
    return isCumulativeAllowed ? RAQIV2MetricGranularity.None : null;
  }
  return firstAllowedNonCumulativeGranularity(granularityOptions) ?? null;
}

function getMetricsForGranularity({
  constraintMetrics,
  metric,
}: Pick<ChartConfiguratorMetricControlsProps, 'constraintMetrics' | 'metric'>) {
  if (constraintMetrics.length > 0) {
    return constraintMetrics;
  }
  return metric ? [metric] : [];
}

function getGranularityOptions({
  metrics,
  chartContext,
  startDate,
  endDate,
  unsupportedGranularityMessageKey,
}: {
  metrics: readonly TChartConfiguratorMetrics[];
  chartContext: RAQIV2ChartContext;
  startDate: Date;
  endDate: Date;
  unsupportedGranularityMessageKey: TranslationKey;
}): SidebarGranularityOption[] {
  if (metrics.length === 0) {
    return [];
  }
  if (metrics.length === 1) {
    return getGranularityOptionsForMetric({
      metric: metrics[0],
      startDate,
      endDate,
      breakdown: chartContext.breakdown,
    });
  }

  const sharedGranularities = getSharedGranularityOptionsForMetrics({
    metrics,
    startDate,
    endDate,
    breakdown: chartContext.breakdown,
  });
  const baseOptions: SidebarGranularityOption[] = sharedGranularities.map((granularity) => ({
    granularity,
    isAllowed: true,
  }));
  if (
    isValidArrayEnumValue(UIGranularities, chartContext.granularity) &&
    !sharedGranularities.includes(chartContext.granularity)
  ) {
    baseOptions.push({
      granularity: chartContext.granularity,
      isAllowed: false,
      messageKey: unsupportedGranularityMessageKey,
    });
  }
  return baseOptions;
}

function appendRequestedUnsupportedGranularity({
  granularityOptions,
  granularitySelection,
  unsupportedGranularityMessageKey,
}: Pick<ChartConfiguratorGranularityControlsProps, 'granularitySelection'> & {
  granularityOptions: SidebarGranularityOption[];
  unsupportedGranularityMessageKey: TranslationKey;
}): SidebarGranularityOption[] {
  if (
    !granularitySelection ||
    granularitySelection.isRequestedGranularitySupported ||
    !isValidArrayEnumValue(UIGranularities, granularitySelection.requestedGranularity) ||
    granularityOptions.some(
      (option) => option.granularity === granularitySelection.requestedGranularity,
    )
  ) {
    return granularityOptions;
  }
  return [
    ...granularityOptions,
    {
      granularity: granularitySelection.requestedGranularity,
      isAllowed: false,
      messageKey: unsupportedGranularityMessageKey,
    },
  ];
}

export default function useChartConfiguratorSidebarModel({
  dispatch,
  metricControls,
  chartControls,
  granularityControls,
  unsupportedGranularityMessageKey,
}: {
  dispatch: (action: ChartConfiguratorSidebarAction) => void;
  metricControls: ChartConfiguratorMetricControlsProps;
  chartControls: ChartConfiguratorChartControlsProps;
  granularityControls: ChartConfiguratorGranularityControlsProps;
  unsupportedGranularityMessageKey: TranslationKey;
}) {
  const { metric, constraintMetrics, availableMetrics } = metricControls;
  const { chartType } = chartControls;
  const { chartContext, granularitySelection } = granularityControls;
  const dateTimeBundle = useAnalyticsCurrentDateRangeBundle();

  const equationBuilderChartContext = useMemo(
    () => ({
      startDate: dateTimeBundle.startDate,
      endDate: dateTimeBundle.endDate,
      breakdown: chartContext.breakdown,
    }),
    [dateTimeBundle.startDate, dateTimeBundle.endDate, chartContext.breakdown],
  );

  const metricsForGranularity = useMemo(
    () => getMetricsForGranularity({ constraintMetrics, metric }),
    [constraintMetrics, metric],
  );

  // Multi-metric (computed) charts can require a granularity their source metrics
  // don't share; we surface that unsupported state in the UI. Single-metric charts
  // instead silently coerce to the effective granularity (legacy/prod behavior),
  // so they neither expose the unsupported requested option nor show the warning.
  const isMultiMetricGranularity = metricsForGranularity.length > 1;

  const granularityOptions = useMemo(() => {
    const baseOptions = getGranularityOptions({
      metrics: metricsForGranularity,
      chartContext,
      startDate: dateTimeBundle.startDate,
      endDate: dateTimeBundle.endDate,
      unsupportedGranularityMessageKey,
    });
    return isMultiMetricGranularity
      ? appendRequestedUnsupportedGranularity({
          granularityOptions: baseOptions,
          granularitySelection,
          unsupportedGranularityMessageKey,
        })
      : baseOptions;
  }, [
    chartContext,
    dateTimeBundle.endDate,
    dateTimeBundle.startDate,
    granularitySelection,
    isMultiMetricGranularity,
    metricsForGranularity,
    unsupportedGranularityMessageKey,
  ]);

  const handleGranularityChange = useCallback(
    (value: string) => {
      if (!isValidArrayEnumValue(UIGranularities, value)) {
        return;
      }
      const transition = resolveGranularityChangeTransition({
        chartType,
        currentGranularity: chartContext.granularity,
        nextGranularity: value,
      });
      if (transition.kind === 'set-chart-type-with-granularity') {
        dispatch({
          type: 'select-chart-type-with-granularity',
          chartType: transition.chartType,
          granularity: transition.granularity,
        });
      } else if (transition.kind === 'set-granularity') {
        dispatch({ type: 'select-granularity', granularity: transition.granularity });
      }
    },
    [chartContext.granularity, chartType, dispatch],
  );

  const isTimestampSelected = chartContext.granularity !== RAQIV2MetricGranularity.None;
  const timestampToggleGranularity = useMemo(
    () =>
      resolveTimestampToggleGranularity({
        currentGranularity: chartContext.granularity,
        granularityOptions,
      }),
    [chartContext.granularity, granularityOptions],
  );

  const handleToggleTimestamp = useCallback(() => {
    if (timestampToggleGranularity) {
      handleGranularityChange(timestampToggleGranularity);
    }
  }, [handleGranularityChange, timestampToggleGranularity]);

  const handleChartTypeChange = useCallback(
    (newChartType: ChartConfiguratorChartType) => {
      const transition = resolveChartTypeGranularityTransition({
        currentChartType: chartType,
        nextChartType: newChartType,
        currentGranularity: chartContext.granularity,
        granularityOptions,
      });
      if (transition.kind === 'set-chart-type') {
        dispatch({ type: 'select-chart-type', chartType: transition.chartType });
      } else if (transition.kind === 'set-chart-type-with-granularity') {
        dispatch({
          type: 'select-chart-type-with-granularity',
          chartType: transition.chartType,
          granularity: transition.granularity,
        });
      }
    },
    [chartContext.granularity, chartType, dispatch, granularityOptions],
  );

  const handleToggleOperations = useCallback(
    (checked: boolean) => {
      dispatch({ type: 'toggle-operations', isOn: checked });
      if (!checked) {
        dispatch({ type: 'set-computed-metric', computedMetric: null });
      }
    },
    [dispatch],
  );

  const equationBuilderMetrics = useMemo(
    () => availableMetrics.filter((m) => !isDurationChartMetric(m)),
    [availableMetrics],
  );
  const equationBuilderDefaultMetric = metric && !isDurationChartMetric(metric) ? metric : null;

  return {
    equationBuilderChartContext,
    equationBuilderDefaultMetric,
    equationBuilderMetrics,
    granularityOptions,
    handleChartTypeChange,
    handleGranularityChange,
    handleToggleOperations,
    handleToggleTimestamp,
    hasEnabledGranularityOptions: granularityOptions.some((option) => option.isAllowed),
    isTimestampSelected,
    isTimestampToggleDisabled: timestampToggleGranularity === null,
    shouldShowUnsupportedGranularityWarning: Boolean(
      isMultiMetricGranularity &&
      granularitySelection &&
      !granularitySelection.isRequestedGranularitySupported,
    ),
  };
}
