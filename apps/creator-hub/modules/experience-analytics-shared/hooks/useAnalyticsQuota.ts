import { useCallback, useMemo } from 'react';
import { SeriesDataTypes } from '@rbx/analytics-ui';
import { RAQIV2MetricToSupportedDimensions } from '@rbx/creator-hub-analytics-config';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { FormattedText } from '@modules/analytics-translations/types';
import type { ChartSummaryItemSpec } from '@modules/charts-generic/charts/ChartSummaryItem';
import getTypeLegendDescription from '@modules/charts-generic/charts/TimeSeriesRangeAnnotationLegend';
import type {
  SplineChartTimeSeriesNamedData,
  TimeSeriesSplineChartSpec,
} from '@modules/charts-generic/charts/types/TimeSeriesSplineChartTypes';
import { noSummarySpec } from '../adapters/genericRAQIV2ChartSummaryAdapter';
import genericRAQIV2TimeSeriesDoubleMetricSummaryAdapter from '../adapters/genericRAQIV2TimeSeriesDoubleMetricSummaryAdapter';
import genericRAQIV2TimeSeriesSplineChartAdapter from '../adapters/genericRAQIV2TimeSeriesSplineChartAdapter';
import { useRAQIV2Client } from '../context/RAQIV2ClientProvider';
import type { RAQIV2CompoundDoubleMetricSummaryType } from '../enums/RAQIV2SummaryType';
import type { QuotaConfig } from '../types/RAQIV2ChartConfig';
import type RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import type { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';
import type { FetchComparisonOptions } from '../utils/makeRAQIV2Request';
import makeRAQIV2Request from '../utils/makeRAQIV2Request';
import { maybeThrowRAQIV2InternalException } from '../utils/RAQIV2InternalException';
import { applyStaticQuotaToChart, type StaticQuotaConfig } from './applyStaticQuotaToChart';
import useApiRequest from './useApiRequest';
import useRAQIV2TranslationDependencies from './useRAQIV2TranslationDependencies';

export type AnalyticsQuotaProps = {
  mainSpec: RAQIV2ChartSpec;
  mainChart: TimeSeriesSplineChartSpec;
  summarySpec: RAQIV2CompoundDoubleMetricSummaryType[];
  quotaConfig: QuotaConfig | undefined;
  fetchComparison?: FetchComparisonOptions;
  inRoundedComparisonChipContext?: boolean;
  ignoreCache?: boolean;
  showQuotaWithBreakdown?: boolean;
};

/**
 * `FormattedText` is a nominal brand with no runtime distinction from
 * `string`. A single `as` here keeps the rest of the hook brand-cast-free.
 */
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- branding a plain string into the FormattedText nominal type
const toFormattedText = (value: string): FormattedText => value as FormattedText;

const getQuotaLegendName = (
  translationDependencies: RAQIV2TranslationDependencies,
): FormattedText => {
  const description = getTypeLegendDescription(
    SeriesDataTypes.Quota,
    translationDependencies.translate,
  );
  return description ?? toFormattedText('');
};

const decorateQuotaSeries = (
  series: SplineChartTimeSeriesNamedData[],
  translationDependencies: RAQIV2TranslationDependencies,
) => {
  return series
    .filter((s) => s.type !== SeriesDataTypes.Comparison)
    .map((s) => ({
      ...s,
      type: SeriesDataTypes.Quota,
      name: getQuotaLegendName(translationDependencies),
    }));
};

export const useAnalyticsQuota = ({
  mainSpec,
  mainChart,
  summarySpec,
  quotaConfig,
  fetchComparison,
  inRoundedComparisonChipContext,
  ignoreCache,
  showQuotaWithBreakdown = false,
}: AnalyticsQuotaProps): {
  chartWithQuota: TimeSeriesSplineChartSpec;
  quotaSummary: ChartSummaryItemSpec[];
} => {
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { client, clearCache } = useRAQIV2Client(ignoreCache ?? false);

  const quotaMetric = quotaConfig?.type === 'Metric' ? quotaConfig.metric : undefined;
  const staticQuotaConfig: StaticQuotaConfig | undefined =
    quotaConfig?.type === 'Static' ? quotaConfig : undefined;

  const quotaSpec = useMemo(() => {
    if (
      !quotaMetric ||
      mainChart.series.length === 0 ||
      (!showQuotaWithBreakdown && mainSpec.breakdown && mainSpec.breakdown.length > 0)
    ) {
      // By default, mirror benchmark behavior and suppress aggregate quotas
      // for breakdown charts. Explicit opt-in supports charts where one
      // shared quota applies to every displayed breakdown series.
      return null;
    }
    const quotaFilter = mainSpec.filter?.filter((filterDimension) =>
      RAQIV2MetricToSupportedDimensions[quotaMetric].includes(filterDimension.dimension),
    );
    return {
      // breakdown not supported for quota metric
      resource: mainSpec.resource,
      metric: quotaMetric,
      filter: quotaFilter,
      timeSpec: mainSpec.timeSpec,
      granularity: mainSpec.granularity,
      // We don't need to use the page-wide time axis here since quotas are never shown on their own
      timeAxisBounds: null,
    };
  }, [quotaMetric, mainSpec, mainChart, showQuotaWithBreakdown]);

  const quotaRequestOptions = useMemo(
    () => ({
      fetchComparison,
    }),
    [fetchComparison],
  );

  const makeQuotaRequest = useCallback(async () => {
    if (!quotaSpec) {
      return null;
    }
    maybeThrowRAQIV2InternalException(quotaSpec.resource, 'makeQuotaRequest');
    return makeRAQIV2Request(quotaSpec, client, quotaRequestOptions);
  }, [client, quotaRequestOptions, quotaSpec]);

  const { data } = useApiRequest(makeQuotaRequest, {
    invalidateCache: ignoreCache ? clearCache : undefined,
  });

  return useMemo(() => {
    // Static-value quota: delegate to the pure projection helper. No fetch,
    // no double-metric summary — see `applyStaticQuotaToChart` for the
    // suppression rules.
    if (staticQuotaConfig !== undefined) {
      return applyStaticQuotaToChart({
        mainChart,
        breakdown: mainSpec.breakdown,
        config: staticQuotaConfig,
        translationDependencies,
      });
    }

    if (!mainChart || !quotaSpec || !data) {
      return { chartWithQuota: mainChart, quotaSummary: [] };
    }
    const { chart } = genericRAQIV2TimeSeriesSplineChartAdapter({
      responses: data,
      spec: quotaSpec,
      translationDependencies,
      granularity: quotaSpec.granularity ?? RAQIV2MetricGranularity.OneDay,
      showComparisonInChart: true,
      summarySpec: noSummarySpec,
    });

    const quotaSeries = decorateQuotaSeries(chart.series, translationDependencies);
    const summary =
      mainChart.series.length === 0 || chart.series.length === 0
        ? []
        : genericRAQIV2TimeSeriesDoubleMetricSummaryAdapter({
            spec: mainSpec,
            charts: [mainChart, chart],
            translationDependencies,
            granularity: quotaSpec.granularity ?? RAQIV2MetricGranularity.OneDay,
            summarySpec,
            numberContextMetadata: { chartSpec: mainSpec, inRoundedComparisonChipContext },
          });

    const mainSeriesWithoutComparison = mainChart.series.filter(
      (s) => s.type !== SeriesDataTypes.Comparison,
    );
    return {
      chartWithQuota: {
        ...mainChart,
        series: [...mainSeriesWithoutComparison, ...quotaSeries],
      },
      quotaSummary: summary,
    };
  }, [
    data,
    inRoundedComparisonChipContext,
    mainChart,
    mainSpec,
    quotaSpec,
    staticQuotaConfig,
    summarySpec,
    translationDependencies,
  ]);
};
