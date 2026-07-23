import { useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { SeriesDataTypes, decorateTooltipSeriesName, LineChartZones } from '@rbx/analytics-ui';
import {
  translationKey,
  translationKeyWithoutNamespace,
  useTranslationWrapper,
} from '@modules/analytics-translations';
import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ordinalizePercentileByLocale from '../../utils/ordinalizePercentileByLocale';
import {
  millisecondsInInterval,
  SeriesIntervalMeaning,
  shouldAlignComparisonSeriesEndWithMainSeriesStart,
} from '../../enums/SeriesIntervalMeaning';
import useLocale from '../../context/useLocale';
import { TimeSeriesChartUnitSpec } from '../types/TimeSeriesTypes';
import { formatTimestampForChartTooltip, TimeAxisSpec } from '../formatters';
import { TRangeBenchmarkSpec } from '../types/RangeBenchmarkSpec';
import { formatShortDateTime } from '../formatters/timeFormatters';
import formatChartUnit from '../formatChartUnit';
import { SeriesMetadata } from '../types/SeriesMetadata';

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

const getPeriodComparisonSeriesDateOffset = (
  startDate: Date,
  endDate: Date,
  seriesIntervalMeaning: SeriesIntervalMeaning,
  type?: SeriesDataTypes,
) => {
  if (type !== SeriesDataTypes.Comparison) {
    return 0;
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
  rangeBenchmarkSpec,
  seriesMetadata,
}: {
  chartUnitSpec: TimeSeriesChartUnitSpec;
  series: Array<{ type: SeriesDataTypes }>;
  timeAxisSpec: TimeAxisSpec;
  seriesIntervalMeaning: SeriesIntervalMeaning;
  rangeBenchmarkSpec?: TRangeBenchmarkSpec;
  seriesMetadata?: Map<string, SeriesMetadata>;
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
          seriesIntervalMeaning,
          seriesType,
        );
        formattedName = formatTimestampForChartTooltip(
          seriesIntervalMeaning,
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
      seriesIntervalMeaning,
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
        : formatTimestampForChartTooltip(
            seriesIntervalMeaning,
            locale,
            new Date(x),
            translate,
            timeAxisSpec,
          ),
    [hasTotalAndComparisonSeries, locale, seriesIntervalMeaning, timeAxisSpec, translate],
  );

  const formatRange = useCallback(
    ({ top, bottom, tag, x }: { top: number; bottom: number; tag?: unknown; x: number }) => {
      const formattedRange = rangeBenchmarkSpec?.formatter({
        top: formatChartUnit(top, chartUnitSpec, { locale, translate }),
        bottom: formatChartUnit(bottom, chartUnitSpec, { locale, translate }),
      });

      let rangeKey = typeof tag === 'function' ? tag(translate) : '';
      if (hasTotalAndComparisonSeries) {
        // Because we don't render timestamp in a separate tooltip, we need to add timestamp at the end of range key
        rangeKey += ` (${formatTimestampForChartTooltip(seriesIntervalMeaning, locale, new Date(x), translate, timeAxisSpec)})`;
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
      seriesIntervalMeaning,
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
