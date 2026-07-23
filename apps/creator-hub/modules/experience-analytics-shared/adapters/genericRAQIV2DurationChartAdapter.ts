import { SeriesDataTypes } from '@rbx/analytics-ui';
import {
  RAQIV2Dimension,
  RAQIV2MetricValueType,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import type { FormattedText, TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type {
  DurationBucket,
  DurationSeriesDataPoint,
  DurationSeriesInfo,
  DurationSplineChartSpec,
} from '@modules/charts-generic/charts/types/DurationSplineChartTypes';
import type { TimeSeriesDataPoint } from '@modules/charts-generic/charts/types/TimeSeriesTypes';
import { getComparisonTimeRange } from '@modules/charts-generic/utils/comparisonChipUtils';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import type { RAQIV2BreakdownValue, RAQIV2MetricValue } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import getAnalyticsMetricDisplayConfig from '../constants/AnalyticsMetricDisplayConfig';
import type { NumericDataPointTransformerType } from '../constants/NumericDataPointTransformerConfig';
import NumericDataPointTransformerConfig from '../constants/NumericDataPointTransformerConfig';
import type { TDurationBucketDimension } from '../constants/RAQIV2DurationBucketDimensions';
import { DurationBucketDimensionToBucketType } from '../constants/RAQIV2DurationBucketDimensions';
import { getUIMetricFromAtomicMetricLike, isComputedMetric } from '../types/ComputedMetric';
import type RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import type { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';
import type { RAQIV2QueryResponses } from '../utils/combineRAQIV2QueryResponses';
import combineRAQIV2QueryResponses from '../utils/combineRAQIV2QueryResponses';
import { buildChartUnitOptions, getBreakdownName } from './genericRAQIV2ChartAdapter';
import type { RAQIV2SummarySpec } from './genericRAQIV2ChartSummaryAdapter';
import { getDefaultSummarySpec, summarizeSeriesInfo } from './genericRAQIV2ChartSummaryAdapter';
import sortRAQIV2SeriesByBreakdowns from './sortRAQIV2SeriesByBreakdowns';

const getNameFromSeries = (
  series: DurationSeriesInfo,
  translationDependencies: RAQIV2TranslationDependencies,
  withComparisonSeries: boolean,
  totalSeriesNameOverride?: TranslationKey,
) => {
  const { isComparisonSeries, isTotalSeries } = series;

  let overriddenName: FormattedText | undefined;
  if (totalSeriesNameOverride && isTotalSeries) {
    const { translate } = translationDependencies;
    overriddenName = translate(totalSeriesNameOverride);
    if (withComparisonSeries) {
      overriddenName = isComparisonSeries
        ? translate(translationKey('Label.Comparison', TranslationNamespace.Analytics), {
            series: overriddenName,
          })
        : translate(
            translationKey('Label.CurrentSeriesComparison', TranslationNamespace.Analytics),
            {
              series: overriddenName,
            },
          );
    }
  }

  return overriddenName ?? series.name;
};

const getDataTypeFromSeries = (series: DurationSeriesInfo): SeriesDataTypes => {
  const { isComparisonSeries, isTotalSeries } = series;
  if (isComparisonSeries) {
    return SeriesDataTypes.Comparison;
  }
  if (isTotalSeries) {
    return SeriesDataTypes.Total;
  }
  return SeriesDataTypes.Normal;
};

const getBucketNumber = (
  bucketValue: string | undefined,
  durationBucketDimension: TDurationBucketDimension,
): number => {
  if (!bucketValue) {
    return Number.NaN;
  }
  switch (durationBucketDimension) {
    case RAQIV2Dimension.ServerAgeBucket: {
      const bucketRange = bucketValue.split('-');
      if (bucketRange.length === 2) {
        return Number.parseInt(bucketRange[1], 10) ?? Number.NaN;
      }
      return Number.NaN;
    }
    case RAQIV2Dimension.SessionTimeBucket:
      return Number.parseInt(bucketValue, 10);
    case RAQIV2Dimension.CohortDay:
      return Number.parseInt(bucketValue, 10);
    default: {
      const exhaustiveCheck: never = durationBucketDimension;
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      throw new Error(`Unhandled duration bucket dimension: ${exhaustiveCheck}`);
    }
  }
};

const buildDurationSeriesInfo = ({
  values,
  durationBucketDimension,
  dataPointTransformerType,
  forComparison = false,
  translationDependencies,
}: {
  values: RAQIV2MetricValue[];
  durationBucketDimension: TDurationBucketDimension;
  dataPointTransformerType?: NumericDataPointTransformerType;
  forComparison?: boolean;
  translationDependencies: RAQIV2TranslationDependencies;
}): DurationSeriesInfo[] => {
  const seriesByBreakdown: Map<
    string,
    {
      series: Array<DurationSeriesDataPoint>;
      breakdownValues: RAQIV2BreakdownValue[];
    }
  > = new Map();

  values.forEach(({ breakdownValue, dataPoints }) => {
    // 1. find bucket for the data point
    const bucketValue = breakdownValue?.find(
      ({ dimension }) => dimension === durationBucketDimension,
    )?.value;
    const bucket = getBucketNumber(bucketValue, durationBucketDimension);
    if (Number.isNaN(bucket)) {
      logAnalyticsError(`received value with invalid duration breakdown`);
      return;
    }

    // 2. retrieve data value, and only pad undefined, other values including nulls get returned directly
    let dataValue = dataPoints?.length ? dataPoints[0].value : null;
    dataValue = dataValue === undefined ? 0 : dataValue;

    // 3. group data points by rest of the 'non-duration' breakdowns into series
    const breakdowns =
      breakdownValue
        ?.filter(({ dimension }) => dimension !== durationBucketDimension)
        .sort(({ dimension: dimensionA }, { dimension: dimensionB }) => {
          if (dimensionA && dimensionB) {
            return dimensionA < dimensionB ? -1 : 1;
          }
          return dimensionA ? -1 : 1;
        }) ?? [];
    const breakdownsKey = JSON.stringify(breakdowns);
    const { series, breakdownValues } = seriesByBreakdown.get(breakdownsKey) ?? {
      series: [],
      breakdownValues: breakdowns,
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
    series.push([bucket as DurationBucket, dataValue, undefined]);
    seriesByBreakdown.set(breakdownsKey, { series, breakdownValues });
  });

  return Array.from(seriesByBreakdown, ([, { series, breakdownValues }]) => {
    const sortedDataPoints = series.sort(([bucketA], [bucketB]) => bucketA - bucketB);
    const transformedDataPoints = dataPointTransformerType
      ? sortedDataPoints.map((_omit, index) =>
          NumericDataPointTransformerConfig[dataPointTransformerType](
            index,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
            sortedDataPoints as unknown as TimeSeriesDataPoint[],
          ),
        )
      : sortedDataPoints;
    return {
      name: getBreakdownName(breakdownValues, translationDependencies),
      dataPoints: transformedDataPoints,
      breakdownValues,
      isComparisonSeries: forComparison,
      isTotalSeries: breakdownValues.length === 0,
    };
  });
};

type GenericRAQIV2DurationSplineChartAdapterProps = {
  responses: RAQIV2QueryResponses;
  spec: RAQIV2ChartSpec;
  durationBucketDimension: TDurationBucketDimension;
  translationDependencies: RAQIV2TranslationDependencies;
  showComparisonChip: boolean;
  showComparisonInChart?: boolean;
  summarySpec?: RAQIV2SummarySpec;
};

const genericRAQIV2DurationChartAdapter = ({
  spec,
  responses,
  durationBucketDimension,
  translationDependencies,
  showComparisonInChart = false,
  showComparisonChip,
  summarySpec,
}: GenericRAQIV2DurationSplineChartAdapterProps) => {
  const displayConfig = isComputedMetric(spec.metric)
    ? null
    : getAnalyticsMetricDisplayConfig(getUIMetricFromAtomicMetricLike(spec.metric));
  if (displayConfig && displayConfig.valueType !== RAQIV2MetricValueType.Numeric) {
    throw new Error(`Duration chart does not support non-numeric metrics`);
  }
  const dataPointTransformerType = displayConfig?.dataPointTransformerType;
  const totalSeriesNameOverride = displayConfig?.totalSeriesNameOverride;
  const { response, comparisonResponse } = combineRAQIV2QueryResponses(responses);

  const mainSeries = buildDurationSeriesInfo({
    values: response?.values ?? [],
    durationBucketDimension,
    translationDependencies,
    dataPointTransformerType,
  });
  const comparisonSeries =
    showComparisonInChart || showComparisonChip
      ? buildDurationSeriesInfo({
          values: comparisonResponse?.values ?? [],
          durationBucketDimension,
          forComparison: true,
          translationDependencies,
          dataPointTransformerType,
        })
      : [];
  const allSeries = showComparisonInChart ? mainSeries.concat(comparisonSeries) : mainSeries;
  const sortedSeries = sortRAQIV2SeriesByBreakdowns(allSeries, spec);

  const chart: DurationSplineChartSpec = {
    unit: buildChartUnitOptions(spec, translationDependencies),
    series: sortedSeries.map((series) => {
      const { dataPoints } = series;
      const withComparisonSeries = showComparisonInChart && comparisonSeries.length > 0;

      return {
        dataPoints,
        name: getNameFromSeries(
          series,
          translationDependencies,
          withComparisonSeries,
          totalSeriesNameOverride,
        ),
        type: getDataTypeFromSeries(series),
      };
    }),
    bucketType: DurationBucketDimensionToBucketType[durationBucketDimension],
  };

  const { comparisonStartDate, comparisonEndDate } = getComparisonTimeRange(
    spec.timeSpec.startTime,
    spec.timeSpec.endTime,
    RAQIV2MetricGranularity.OneDay,
  );

  const summary = summarizeSeriesInfo(
    mainSeries,
    spec,
    summarySpec ?? getDefaultSummarySpec(spec),
    translationDependencies,
    showComparisonChip && comparisonSeries.length
      ? {
          series: comparisonSeries,
          startTime: comparisonStartDate,
          endTime: comparisonEndDate,
        }
      : null,
  );

  return {
    chart,
    summary,
  };
};

export default genericRAQIV2DurationChartAdapter;
