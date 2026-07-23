import React, { useMemo } from 'react';
import { Options, SeriesTreemapOptions } from 'highcharts';
import GenericSeriesChart from './GenericSeriesChart';
import { ChartStyleMode, ChartType } from './types/BaseChart';
import {
  OnTreemapRootNodeChanged,
  SingleTreemapSeries,
  TreemapTooltipFormatter,
} from './types/TreemapChart';
import { useTreemapChartOptions } from './highchart-options/chartOptions';
import { useTreemapPlotOptions } from './highchart-options/plotOptions';
import { useTreemapTooltipOptions } from './highchart-options/tooltipOptions';
import { useTreemapColorAxisOptions } from './highchart-options/colorAxisOptions';
import { useTreemapBreadcrumbOptions } from './highchart-options/breadcrumbsOptions';
import { DataLabelsFormatter } from './formatters/dataLabelsFormatters';
import { getProcessedTreemapData } from './utils/treemapUtils';

type TreemapChartProps = {
  data: SingleTreemapSeries;
  tooltipFormatter: TreemapTooltipFormatter;
  chartStyleMode?: ChartStyleMode;
  /**
   * Optional data labels formatter for showing labels inside treemap nodes
   */
  formatDataLabel?: DataLabelsFormatter;
  /**
   * If not specified, the chart will use the default height (360px for Normal mode)
   */
  height?: number;
  /**
   * Minimum percentage of root total for a node to be shown individually (e.g. 0.1 for 0.1%).
   * Nodes below this are grouped into an "Other" node per parent, bottom-up.
   */
  minDisplayPercentage?: number;
  /** Root label (e.g. first breadcrumb). When data has a single root node, that node's name is used; when multiple roots, this is used. */
  rootName?: string;
  /**
   * When true (default), each node's color reflects its share among siblings.
   * When false, each node's color reflects its share of the root total.
   */
  colorBySiblingProportion?: boolean;
  onChartLoad?: () => void;
  onRootNodeChanged?: OnTreemapRootNodeChanged;
};

const TreemapChart = ({
  data,
  tooltipFormatter,
  formatDataLabel,
  chartStyleMode = ChartStyleMode.Normal,
  height,
  rootName: rootNameProp,
  minDisplayPercentage,
  colorBySiblingProportion,
  onChartLoad,
  onRootNodeChanged,
}: TreemapChartProps) => {
  const chartOptions = useTreemapChartOptions({ chartStyleMode, onChartLoad, height });
  const tooltipOptions = useTreemapTooltipOptions(tooltipFormatter);
  const colorAxisOptions = useTreemapColorAxisOptions();
  const breadcrumbOptions = useTreemapBreadcrumbOptions();

  const series: SeriesTreemapOptions[] = useMemo(() => {
    const {
      data: seriesData,
      rootId,
      rootName,
    } = getProcessedTreemapData(data, {
      minDisplayPercentage,
      rootName: rootNameProp,
      colorBySiblingProportion,
    });

    return [
      {
        type: ChartType.Treemap,
        name: rootName,
        id: rootId,
        rootId,
        data: seriesData,
        breadcrumbs: breadcrumbOptions,
      },
    ];
  }, [data, minDisplayPercentage, rootNameProp, colorBySiblingProportion, breadcrumbOptions]);

  const plotOptions = useTreemapPlotOptions({ formatDataLabel, onRootNodeChanged });

  const highchartsOptions: Options = useMemo(
    () => ({
      series,
      plotOptions,
      chart: chartOptions,
      tooltip: tooltipOptions,
      colorAxis: colorAxisOptions,
      title: { style: { display: 'none' } },
      credits: { enabled: false },
    }),
    [series, plotOptions, chartOptions, tooltipOptions, colorAxisOptions],
  );

  return <GenericSeriesChart options={highchartsOptions} />;
};

TreemapChart.displayName = 'TreemapChart';
export default React.memo(TreemapChart);
