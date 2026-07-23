import { useCallback, useMemo } from 'react';
import type { LineChartZones } from '@rbx/analytics-ui';
import { SeriesDataTypes, decorateTooltipSeriesName } from '@rbx/analytics-ui';
import type { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import {
  translationKey,
  translationKeyWithoutNamespace,
} from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useLocale from '../../context/useLocale';
import {
  millisecondsInInterval,
  shouldAlignComparisonSeriesEndWithMainSeriesStart,
} from '../../utils/granularityUtils';
import ordinalizePercentileByLocale from '../../utils/ordinalizePercentileByLocale';
import formatChartUnit from '../formatChartUnit';
import type { TimeAxisSpec } from '../formatters/common';
import { formatTimestampForChartTooltip, formatShortDateTime } from '../formatters/timeFormatters';
import type { TRangeBenchmarkSpec } from '../types/RangeBenchmarkSpec';
import type { SeriesMetadata } from '../types/SeriesMetadata';
import type { TimeSeriesChartUnitSpec } from '../types/TimeSeriesTypes';

const getZoneTypeForPoint = (
  x: number,
  zones?: Array<{ start: number; end: number | null; type: SeriesDataTypes }>,
  baseType?: SeriesDataTypes,
): SeriesDataTypes | undefined => {
  if (!zones || zones.length === 0) {
    return baseType;
  }
  const matchingZone = zones.find(
    (zone) => x >= zone.start && (zone.end === null || x <= zone.end),
  );
  return matchingZone?.type ?? baseType;
};

export const getPeriodComparisonSeriesDateOffset = (
  startDate: Date,
  endDate: Date,
  granularity: RAQIV2MetricGranularity,
  type?: SeriesDataTypes,
  comparisonDateOffsetMs?: number,
) => {
  if (type !== SeriesDataTypes.Comparison) {
    return 0;
  }
  if (comparisonDateOffsetMs !== undefined) {
    return comparisonDateOffsetMs;
  }
  const duration = endDate.getTime() - startDate.getTime();
  const offset = shouldAlignComparisonSeriesEndWithMainSeriesStart(granularity)
    ? 0
    : millisecondsInInterval(granularity);
  return duration + offset;
};

const useTimeSeriesChartTooltipFormatters = ({
  chartUnitSpec,
  series,
  timeAxisSpec,
  granularity,
  rangeBenchmarkSpec,
  seriesMetadata,
  comparisonDateOffsetMs,
}: {
  chartUnitSpec: TimeSeriesChartUnitSpec;
  series: Array<{ type: SeriesDataTypes }>;
  timeAxisSpec: TimeAxisSpec;
  granularity: RAQIV2MetricGranularity;
  rangeBenchmarkSpec?: TRangeBenchmarkSpec;
  seriesMetadata?: Map<string, SeriesMetadata>;
  comparisonDateOffsetMs?: number;
}) => {
  const locale = useLocale();
  const { translate } = useTranslationWrapper(useTranslation());

  const hasTotalAndComparisonSeries = useMemo(() => {
    const hasTotalSeries = series.some(({ type }) => type === SeriesDataTypes.Total);
    const hasComparisonSeries = series.some(({ type }) => type === SeriesDataTypes.Comparison);
    return hasTotalSeries && hasComparisonSeries;
  }, [series]);

  const formatSeriesKeyForPoint = useCallback(
    ({
      seriesName,
      x,
      seriesType,
      seriesId,
      zones,
    }: {
      seriesName: string;
      x: string | number;
      seriesType?: SeriesDataTypes;
      seriesId?: string;
      zones?: LineChartZones;
    }) => {
      const actualZoneType =
        typeof x === 'number' ? getZoneTypeForPoint(x, zones, seriesType) : seriesType;

      const metadata = seriesMetadata?.get(seriesId ?? '');
      if (actualZoneType === SeriesDataTypes.Benchmark && metadata) {
        const { metric, percentile } = metadata;
        if (metric === RAQIV2Metric.UniqueAbuseReportSubmittersPer1000PlaytimeHours) {
          return translate(
            translationKeyWithoutNamespace('Label.VariableBenchmarkLegendTop10kExperiences'),
            {
              num: ordinalizePercentileByLocale(Number(percentile), locale),
            },
          );
        }
      }

      let formattedName = seriesName;

      if (hasTotalAndComparisonSeries && typeof x === 'number') {
        const offset = getPeriodComparisonSeriesDateOffset(
          timeAxisSpec.startDate,
          timeAxisSpec.endDate,
          granularity,
          seriesType,
          comparisonDateOffsetMs,
        );
        formattedName = formatTimestampForChartTooltip(
          granularity,
          locale,
          new Date(x - offset),
          translate,
          timeAxisSpec,
        );
      }

      if (actualZoneType === SeriesDataTypes.Noise) {
        const noisyLabel = translate(
          translationKey('Label.NoisyData', TranslationNamespace.Analytics),
        );
        return decorateTooltipSeriesName(formattedName, noisyLabel);
      }

      return formattedName;
    },
    [
      comparisonDateOffsetMs,
      hasTotalAndComparisonSeries,
      locale,
      granularity,
      seriesMetadata,
      timeAxisSpec,
      translate,
    ],
  );

  const formatSeriesValueForPoint = useCallback(
    ({ y }: { y: number }) => {
      return formatChartUnit(y, chartUnitSpec, { locale, translate });
    },
    [chartUnitSpec, locale, translate],
  );

  const formatXForPoint = useCallback(
    (x: string | number) =>
      hasTotalAndComparisonSeries
        ? '' // If it's total series with comparison series, we render timestamp within each series toolip. An empty string ensures that we don't render the timestamp in a separate tooltip
        : formatTimestampForChartTooltip(granularity, locale, new Date(x), translate, timeAxisSpec),
    [hasTotalAndComparisonSeries, locale, granularity, timeAxisSpec, translate],
  );

  const formatRange = useCallback(
    ({ top, bottom, tag, x }: { top: number; bottom: number; tag?: unknown; x: number }) => {
      const formattedRange = rangeBenchmarkSpec?.formatter({
        top: formatChartUnit(top, chartUnitSpec, { locale, translate }),
        bottom: formatChartUnit(bottom, chartUnitSpec, { locale, translate }),
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      let rangeKey = typeof tag === 'function' ? tag(translate) : '';
      if (hasTotalAndComparisonSeries) {
        // Because we don't render timestamp in a separate tooltip, we need to add timestamp at the end of range key
        rangeKey += ` (${formatTimestampForChartTooltip(granularity, locale, new Date(x), translate, timeAxisSpec)})`;
      }
      return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
        rangeKey,
        rangeValue: formattedRange ?? '',
      };
    },
    [
      chartUnitSpec,
      hasTotalAndComparisonSeries,
      locale,
      rangeBenchmarkSpec,
      granularity,
      timeAxisSpec,
      translate,
    ],
  );

  const formatXForAnnotationTooltip = useCallback(
    (x: string | number) => {
      return formatShortDateTime(new Date(x), locale);
    },
    [locale],
  );

  return useMemo(
    () => ({
      tooltipFormatters: {
        formatXForPoint,
        formatSeriesKeyForPoint,
        formatSeriesValueForPoint,
        formatRange,
      },
      formatXForAnnotationTooltip,
    }),
    [
      formatRange,
      formatSeriesKeyForPoint,
      formatSeriesValueForPoint,
      formatXForAnnotationTooltip,
      formatXForPoint,
    ],
  );
};

export default useTimeSeriesChartTooltipFormatters;
