import { useCallback, useMemo } from 'react';
import type { LineChartZones } from '@rbx/analytics-ui';
import { SeriesDataTypes, decorateTooltipSeriesName } from '@rbx/analytics-ui';
import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import {
  translationKey,
  translationKeyWithoutNamespace,
} from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { integerFormattingSpec } from '../../constants/analyticsNumberFormattingSpec';
import useLocale from '../../context/useLocale';
import type { SeriesIntervalMeaning } from '../../enums/SeriesIntervalMeaning';
import {
  millisecondsInInterval,
  shouldAlignComparisonSeriesEndWithMainSeriesStart,
} from '../../enums/SeriesIntervalMeaning';
import ordinalizePercentileByLocale from '../../utils/ordinalizePercentileByLocale';
import formatChartUnit from '../formatChartUnit';
import type { TimeAxisSpec } from '../formatters/common';
import { formatTimestampForChartTooltip, formatShortDateTime } from '../formatters/timeFormatters';
import type { TRangeBenchmarkSpec } from '../types/RangeBenchmarkSpec';
import type { SeriesMetadata } from '../types/SeriesMetadata';
import type { TagFormatterFn, TimeSeriesChartUnitSpec } from '../types/TimeSeriesTypes';

const isTagFormatterFn = (tag: unknown): tag is TagFormatterFn => typeof tag === 'function';

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
  seriesIntervalMeaning: SeriesIntervalMeaning,
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
  const offset = shouldAlignComparisonSeriesEndWithMainSeriesStart(seriesIntervalMeaning)
    ? 0
    : millisecondsInInterval(seriesIntervalMeaning);
  return duration + offset;
};

const useTimeSeriesChartTooltipFormatters = ({
  chartUnitSpec,
  series,
  timeAxisSpec,
  seriesIntervalMeaning,
  granularity,
  rangeBenchmarkSpec,
  seriesMetadata,
  comparisonDateOffsetMs,
}: {
  chartUnitSpec: TimeSeriesChartUnitSpec;
  series: Array<{ type: SeriesDataTypes }>;
  timeAxisSpec: TimeAxisSpec;
  seriesIntervalMeaning?: SeriesIntervalMeaning;
  granularity?: SeriesIntervalMeaning;
  rangeBenchmarkSpec?: TRangeBenchmarkSpec;
  seriesMetadata?: Map<string, SeriesMetadata>;
  comparisonDateOffsetMs?: number;
}) => {
  const locale = useLocale();
  const { translate } = useTranslationWrapper(useTranslation());
  const effectiveSeriesIntervalMeaning = seriesIntervalMeaning ?? granularity;
  if (effectiveSeriesIntervalMeaning === undefined) {
    throw new Error('useTimeSeriesChartTooltipFormatters requires a series interval meaning');
  }

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
          effectiveSeriesIntervalMeaning,
          seriesType,
          comparisonDateOffsetMs,
        );
        formattedName = formatTimestampForChartTooltip(
          effectiveSeriesIntervalMeaning,
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
      hasTotalAndComparisonSeries,
      locale,
      effectiveSeriesIntervalMeaning,
      seriesMetadata,
      timeAxisSpec,
      translate,
      comparisonDateOffsetMs,
    ],
  );

  const formatSeriesValueForPoint = useCallback(
    ({ y }: { y: number }) => {
      return formatChartUnit(y, chartUnitSpec.formattingSpec ?? integerFormattingSpec, {
        locale,
        translate,
      });
    },
    [chartUnitSpec, locale, translate],
  );

  const formatXForPoint = useCallback(
    (x: string | number) =>
      hasTotalAndComparisonSeries
        ? '' // If it's total series with comparison series, we render timestamp within each series toolip. An empty string ensures that we don't render the timestamp in a separate tooltip
        : formatTimestampForChartTooltip(
            effectiveSeriesIntervalMeaning,
            locale,
            new Date(x),
            translate,
            timeAxisSpec,
          ),
    [hasTotalAndComparisonSeries, locale, effectiveSeriesIntervalMeaning, timeAxisSpec, translate],
  );

  const formatRange = useCallback(
    ({ top, bottom, tag, x }: { top: number; bottom: number; tag?: unknown; x: number }) => {
      const unitFormattingSpec = chartUnitSpec.formattingSpec ?? integerFormattingSpec;
      const formattedRange = rangeBenchmarkSpec?.formatter({
        top: formatChartUnit(top, unitFormattingSpec, { locale, translate }),
        bottom: formatChartUnit(bottom, unitFormattingSpec, { locale, translate }),
      });

      let rangeKey = isTagFormatterFn(tag) ? (tag(translate) ?? '') : '';
      if (hasTotalAndComparisonSeries) {
        // Because we don't render timestamp in a separate tooltip, we need to add timestamp at the end of range key
        rangeKey += ` (${formatTimestampForChartTooltip(effectiveSeriesIntervalMeaning, locale, new Date(x), translate, timeAxisSpec)})`;
      }
      return {
        rangeKey,
        rangeValue: formattedRange ?? '',
      };
    },
    [
      chartUnitSpec,
      hasTotalAndComparisonSeries,
      locale,
      rangeBenchmarkSpec,
      effectiveSeriesIntervalMeaning,
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
