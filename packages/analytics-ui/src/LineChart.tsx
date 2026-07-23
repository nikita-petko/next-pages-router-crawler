import React, { useMemo } from 'react';
import type { Options, SeriesAreasplinerangeOptions, SeriesSplineOptions } from 'highcharts';
import Highcharts from 'highcharts';
import { makeStyles, useTheme } from '@rbx/ui';
import type { AnnotationProps } from './annotations/WithAnnnotations';
import WithAnnotations from './annotations/WithAnnnotations';
import { getChartThemedColors } from './color';
import { useChartIsInAbnormalState } from './context/ChartIsInAbnormalStateContext';
import type {
  RangePointFormatterFn,
  SeriesKeyForPointFormatter,
  SeriesValueForPointFormatter,
} from './formatters/tooltipFormatters';
import {
  getRangePointFormatter,
  usePerSeriesTooltipPointFormatter,
} from './formatters/tooltipFormatters';
import GenericSeriesChart from './GenericSeriesChart';
import {
  useAnnotationsOptions,
  useAnnotationsCallback,
} from './highchart-options/annotationsOptions';
import { useLineChartChartOptions } from './highchart-options/chartOptions';
import useLegendTitleAndCreditOptions from './highchart-options/legendCreditAndTitleOptions';
import { useLineChartPlotOptions } from './highchart-options/plotOptions';
import {
  useNarrowWidthResponsiveRulesOptions,
  useSmallHeightResponsiveRulesOptions,
} from './highchart-options/responsiveRulesOptions';
import buildSeriesRangeOptions from './highchart-options/seriesRangeOptions';
import { getLineStyleOptionsByDataType } from './highchart-options/seriesStylesOptions';
import { useLineChartTooltipOptions } from './highchart-options/tooltipOptions';
import type { AxisType, XAxisFormatter } from './highchart-options/xAxisOptions';
import { useLineChartXAxisOptions } from './highchart-options/xAxisOptions';
import type { YAxisConfig } from './highchart-options/yAxisOptions';
import { useLineChartYAxisOptions } from './highchart-options/yAxisOptions';
import getLineChartZonesOptions from './highchart-options/zonesOptions';
import showLocalizedTime from './showLocalizedTimeForGranularity';
import { ChartStyleMode, ChartType, SeriesDataTypes } from './types/BaseChart';
import type { ChartUpdatePolicy } from './types/BaseChart';
import type { SingleLineSeries, LineRange } from './types/LineChart';
import useCyclingTimeSeriesLegendItemClickHandler from './useCyclingTimeSeriesLegendItemClickHandler';
import type { SelectionCallback } from './useOnSelectChartRegion';

const zoneSymbol = 'zone-symbol';

// Empty path symbol named 'zone' used for zone series. Hoisted to module
// scope so it isn't recreated on every `LineChart` render and to satisfy
// `unicorn/consistent-function-scoping`.
const zonePath = (): [] => [];

const useStyles = makeStyles()(() => ({
  zoneSeriesClassName: {
    // disable pointer events (i.e. click, hover for zone series
    // so zone legends cannot be interacted with
    pointerEvents: 'none',
  },
}));

type LineChartProps<X extends number, Y extends number, RangeTag> = {
  data: {
    series: Array<SingleLineSeries<X, Y>>;
    range?: LineRange<X, Y, RangeTag>;
  };

  /**
   * Formatters for content appear in tooltips
   * Tooltip next to the hovered point has format: colored-dot formated-key formated-value
   * Tooltip close to the x-axis has format: formated-x-value
   */
  tooltipFormatters: {
    formatSeriesKeyForPoint: SeriesKeyForPointFormatter<X>;
    formatSeriesValueForPoint: SeriesValueForPointFormatter<Y>;
    formatXForPoint: (x: number | string) => string;
    formatRange?: RangePointFormatterFn<RangeTag, X>;
  };

  xAxisFormatter: XAxisFormatter;
  xAxisType: AxisType;
  xAxisTickPositions?: number[];
  xAxisBounds?: [number, number];

  yAxisConfigs?: YAxisConfig[];

  zoneLegendItemFormatter?: (type: SeriesDataTypes) => string;

  chartStyleMode?: ChartStyleMode;
  /**
   * If not specified, the chart will be rendered with a chartStyleMode dependent default height
   */
  height?: number;

  onSelectChartRegion?: SelectionCallback<X>;
  onChartLoad?: () => void;
  chartUpdatePolicy?: ChartUpdatePolicy;
} & AnnotationProps;

const LineChart = <X extends number, Y extends number, RangeTag>({
  data,
  xAxisFormatter,
  xAxisTickPositions,
  xAxisType,
  xAxisBounds,
  yAxisConfigs,
  onSelectChartRegion,
  onChartLoad,
  onAnnotationsPositionsUpdated,
  annotations,
  height,
  tooltipFormatters,
  zoneLegendItemFormatter,
  chartStyleMode = ChartStyleMode.Normal,
  chartUpdatePolicy,
}: LineChartProps<X, Y, RangeTag>) => {
  const {
    classes: { zoneSeriesClassName },
  } = useStyles();
  const theme = useTheme();
  const isChartInAbnormalState = useChartIsInAbnormalState();
  const { updateSeriesLegendItemClickHandlers } = useCyclingTimeSeriesLegendItemClickHandler();

  // Register the empty 'zone' path symbol on first render.
  Highcharts.SVGRenderer.prototype.symbols[zoneSymbol] ??= zonePath;

  const perSeriesPointFormatter = usePerSeriesTooltipPointFormatter({
    formatSeriesKeyForPoint: tooltipFormatters.formatSeriesKeyForPoint,
    formatSeriesValueForPoint: tooltipFormatters.formatSeriesValueForPoint,
  });

  const {
    series,
    minYAxisOverride,
  }: {
    series: Array<SeriesSplineOptions | SeriesAreasplinerangeOptions>;
    minYAxisOverride?: number;
  } = useMemo(() => {
    if (isChartInAbnormalState) {
      return { series: [] };
    }

    const { series: givenSeries, range } = data;

    let minDataPoint = Infinity;
    let zoneTypes: Set<SeriesDataTypes> | undefined;
    const results: Array<SeriesSplineOptions | SeriesAreasplinerangeOptions> = [];

    givenSeries.forEach(
      (
        {
          id,
          name,
          dataPoints,
          type,
          zones,
          custom,
          yAxisId,
          color,
          showMarker,
          opacity,
          showInLegend,
        },
        idx,
      ) => {
        minDataPoint = Math.min(
          minDataPoint,
          ...dataPoints.map((point) => point[1]).filter((point) => point !== null),
        );

        // Expand zones for styling: include line segments connecting to noisy points
        const expandedZones = zones?.map((zone) => {
          const timestamps = dataPoints.map((point) => point[0]);
          const startIdx = timestamps.findIndex((t) => t === zone.start);
          const endIdx =
            zone.end === null ? timestamps.length - 1 : timestamps.findIndex((t) => t === zone.end);

          // Safety check: if zone timestamps not found in dataPoints, return with numeric end
          if (startIdx === -1 || endIdx === -1) {
            return {
              ...zone,
              end: zone.end ?? timestamps[timestamps.length - 1],
            };
          }

          // Extend zone to include line segment before (if not first point)
          const expandedStart = startIdx > 0 ? timestamps[startIdx - 1] : zone.start;

          // Extend zone to include line segment after (if not last point)
          const expandedEnd =
            endIdx < timestamps.length - 1
              ? timestamps[endIdx + 1]
              : (zone.end ?? timestamps[timestamps.length - 1]);

          return {
            ...zone,
            start: expandedStart,
            end: expandedEnd,
          };
        });

        // 1. Create series options for each provided series
        const result: SeriesSplineOptions = {
          id,
          name,
          data: dataPoints,
          custom: {
            ...custom,
            seriesType: type, // Add series type to custom metadata
            zones, // Keep original zones for tooltip formatter (unexpanded)
          },
          type: ChartType.Spline,
          zIndex: givenSeries.length - idx,
          ...getLineStyleOptionsByDataType(theme, type, color, showMarker, opacity),
          ...(expandedZones ? getLineChartZonesOptions(theme, expandedZones, type) : {}),
          tooltip: {
            pointFormatter: perSeriesPointFormatter,
          },
          yAxis: yAxisId,
          ...(showInLegend === undefined ? {} : { showInLegend }),
        };
        results.push(result);

        // 2. If zones are defined, gather all zone types from the series that will be included in the final results.
        zones?.forEach(({ type: zoneType }) => {
          zoneTypes ??= new Set();
          zoneTypes.add(zoneType);
        });
        if (zoneTypes?.size) {
          zoneTypes.add(type);
        }
      },
    );

    // To display legends for zones, we add a dummy series with no data points for each
    // zone type. Each dummy series uses the empty path symbol defined above and renders
    // legends with their respective zone line style and color. They don't show up in tooltips
    // either because we skip tooltip for points with no data
    let zoneSeriesResults: SeriesSplineOptions[] = [];
    if (zoneTypes?.size) {
      const dedupedZoneTypesWithLegends = Array.from(
        new Set(
          Array.from(zoneTypes).map((type) => {
            // line charts don't differentiate between Total and Normal, so we treat them as the same
            // otherwise we will have two duplicate legends for Total and Normal
            if (type === SeriesDataTypes.Total) {
              return SeriesDataTypes.Normal;
            }
            return type;
          }),
        ),
      ).filter((zoneType) => {
        const legendLabel = zoneLegendItemFormatter?.(zoneType) ?? '';
        return legendLabel !== '';
      });

      // Only show legends if there are multiple distinct types with labels (meaningful distinction)
      // If all zones are the same type or only have one type with a label, don't show any legend
      zoneSeriesResults =
        dedupedZoneTypesWithLegends.length > 1
          ? dedupedZoneTypesWithLegends
              .sort((t1, t2) => {
                if (t1 === SeriesDataTypes.Normal) {
                  return -1;
                }
                if (t2 === SeriesDataTypes.Normal) {
                  return 1;
                }
                return 0;
              })
              .map((zoneType, idx) => ({
                id: `zone-${idx}-${zoneType}`,
                name: zoneLegendItemFormatter?.(zoneType) ?? '',
                data: [],
                type: ChartType.Spline,
                marker: {
                  symbol: zoneSymbol,
                },
                dashStyle: getLineStyleOptionsByDataType(theme, zoneType).dashStyle,
                color: getChartThemedColors(theme).zoneLegendSymbol,
                legendIndex: results.length,
                className: zoneSeriesClassName,
              }))
          : [];
    }

    if (range) {
      const { formatRange } = tooltipFormatters;

      // include range series
      const rangeResult = buildSeriesRangeOptions({
        range,
        theme,
        rangeFormatter: formatRange ? getRangePointFormatter({ formatRange }) : undefined,
      });
      results.push(rangeResult);
    }

    return {
      series: results.concat(zoneSeriesResults),
      minYAxisOverride: minDataPoint !== Infinity && minDataPoint < 0 ? minDataPoint : undefined,
    };
  }, [
    data,
    isChartInAbnormalState,
    perSeriesPointFormatter,
    theme,
    tooltipFormatters,
    zoneLegendItemFormatter,
    zoneSeriesClassName,
  ]);

  const { annotationOptions, plotBandsOptions } = useAnnotationsOptions(
    isChartInAbnormalState ? undefined : annotations,
  );

  const plotOptions = useLineChartPlotOptions();

  const xAxisOptions = useLineChartXAxisOptions({
    axisType: xAxisType,
    tickPositions: xAxisTickPositions,
    xAxisFormatter,
    plotBandsOptions,
    xAxisBounds: isChartInAbnormalState ? undefined : xAxisBounds,
  });

  const yAxisOptions = useLineChartYAxisOptions({
    chartStyleMode,
    yAxisConfigs,
    minYAxisOverride,
    isAnnotationOn: !!annotations?.length,
  });

  const onChartRender = useAnnotationsCallback({
    annotations,
    onAnnotationsPositionsUpdated,
  });
  const chartOptions = useLineChartChartOptions({
    onSelectChartRegion,
    onChartLoad,
    onChartRender,
    chartStyleMode,
    height,
  });

  const tooltipOptions = useLineChartTooltipOptions({
    formatX: tooltipFormatters.formatXForPoint,
  });

  const legendTitleAndCreditOptions = useLegendTitleAndCreditOptions({
    chartStyleMode,
  });
  const smallHeightResponsiveRulesOptions = useSmallHeightResponsiveRulesOptions();
  const narrowWidthResponsiveRulesOptions = useNarrowWidthResponsiveRulesOptions();

  const highchartsOptions = useMemo(() => {
    const options: Options = {
      series,
      annotations: annotationOptions,
      plotOptions,
      chart: chartOptions,
      xAxis: xAxisOptions,
      yAxis: yAxisOptions,
      tooltip: tooltipOptions,
      responsive: {
        rules: [
          smallHeightResponsiveRulesOptions,
          ...(chartStyleMode === ChartStyleMode.Minimal ? [] : [narrowWidthResponsiveRulesOptions]),
        ],
      },
      ...legendTitleAndCreditOptions,
    };

    updateSeriesLegendItemClickHandlers(options);

    return options;
  }, [
    series,
    chartStyleMode,
    annotationOptions,
    plotOptions,
    chartOptions,
    xAxisOptions,
    yAxisOptions,
    tooltipOptions,
    smallHeightResponsiveRulesOptions,
    narrowWidthResponsiveRulesOptions,
    legendTitleAndCreditOptions,
    updateSeriesLegendItemClickHandlers,
  ]);

  return (
    <GenericSeriesChart
      options={highchartsOptions}
      showLocalizedTime={xAxisType.type === 'datetime' && showLocalizedTime(xAxisType.granularity)}
      chartUpdatePolicy={chartUpdatePolicy}
    />
  );
};

export default WithAnnotations(React.memo(LineChart));
