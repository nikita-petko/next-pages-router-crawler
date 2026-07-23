import React, { useMemo, memo } from 'react';
import { Options, SeriesMapOptions, TopoJSON } from 'highcharts';
import GenericSeriesChart from './GenericSeriesChart';
import { SingleMapSeries } from './types/MapChart';
import { ChartStyleMode, ChartType } from './types/BaseChart';
import { useMapChartChartOptions } from './highchart-options/chartOptions';
import { useMapChartPlotOptions } from './highchart-options/plotOptions';
import useMapNavigationOptions from './highchart-options/mapNavigationOptions';
import {
  MapChartLegendLabelFormatter,
  useMapChartLegendTitleAndCreditOptions,
} from './highchart-options/legendCreditAndTitleOptions';
import useMapChartColorAxisOptions from './highchart-options/colorAxisOptions';
import { MapSeriesPointFormatter } from './formatters/tooltipFormatters';
import { useMapChartTooltipOptions } from './highchart-options/tooltipOptions';
import { useChartIsInAbnormalState } from './context/ChartIsInAbnormalStateContext';

/**
 * MapChart only accepts a restricted set of properties: https://www.highcharts.com/docs/maps/map-collection#map-properties
 * To comply with this restriction, we define data points as an array of [HCKey, Value] tuples along with TopoJSON map data.
 */
type MapChartProps<HCKey extends string, Value extends number> = {
  data: {
    // Unlike other chart types, we allow only a single series for MapChart (at least for now)
    singleSeries: SingleMapSeries<HCKey, Value>;
    topoJSON: TopoJSON;
    colorAxisSplit: Value[];
  };

  tooltipFormatter: MapSeriesPointFormatter;

  legendLabelFormatter: MapChartLegendLabelFormatter;

  chartStyleMode?: ChartStyleMode;
  /**
   * If not specified, the chart will be rendered with a chartStyleMode dependent default height
   */
  height?: number;

  onChartLoad?: () => void;
};

const MapChart = <HCKey extends string, Value extends number>({
  data,
  tooltipFormatter,
  onChartLoad,
  legendLabelFormatter,
  height,
  chartStyleMode = ChartStyleMode.Normal,
}: MapChartProps<HCKey, Value>) => {
  const isChartInAbnormalState = useChartIsInAbnormalState();

  const series: Array<SeriesMapOptions> = useMemo(() => {
    if (isChartInAbnormalState) {
      return [];
    }
    const { name, dataPoints } = data.singleSeries;
    return [
      {
        name,
        data: dataPoints.map(([key, value]) => [key, value]),
        type: ChartType.Map,
      },
    ];
  }, [data.singleSeries, isChartInAbnormalState]);

  const plotOptions = useMapChartPlotOptions();

  const chartOptions = useMapChartChartOptions({
    chartStyleMode,
    onChartLoad,
    height,
    topoJSONData: data.topoJSON,
  });

  const tooltipOptions = useMapChartTooltipOptions(tooltipFormatter);

  const mapNavigationOptions = useMapNavigationOptions();
  const colorAxisOptions = useMapChartColorAxisOptions({
    splits: data.colorAxisSplit,
  });

  const legendTitleAndCreditOptions = useMapChartLegendTitleAndCreditOptions({
    chartStyleMode,
    formatLegendLabel: legendLabelFormatter,
  });

  const highchartsOptions: Options = useMemo(() => {
    return {
      series,
      plotOptions,
      chart: chartOptions,
      mapNavigation: mapNavigationOptions,
      colorAxis: colorAxisOptions,
      tooltip: tooltipOptions,
      ...legendTitleAndCreditOptions,
    };
  }, [
    chartOptions,
    colorAxisOptions,
    legendTitleAndCreditOptions,
    mapNavigationOptions,
    plotOptions,
    series,
    tooltipOptions,
  ]);

  return <GenericSeriesChart options={highchartsOptions} constructorType='mapChart' />;
};

export default memo(MapChart);
