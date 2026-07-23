import React, { FC, useCallback, useMemo } from 'react';
import { BarSeriesEntry, formatChartUnit } from '@modules/charts-generic';
import { Grid } from '@rbx/ui';
import { BarChart, ChartColor, ChartStyleMode } from '@rbx/analytics-ui';
import { RAQIV2QueryFilter } from '@modules/clients/analytics';
import { buildChartUnitOptions } from '../adapters/genericRAQIV2ChartAdapter';
import { type TRAQIV2NumericUIMetric } from '../constants/AnalyticsMetricDisplayConfig';
import useRAQIV2TranslationDependencies from '../hooks/useRAQIV2TranslationDependencies';

const InsightsHorizontalBarChart: FC<{
  barSeries: BarSeriesEntry[];
  metric: TRAQIV2NumericUIMetric;
  filter?: readonly RAQIV2QueryFilter[];
}> = ({ barSeries, metric, filter }) => {
  const translationDependencies = useRAQIV2TranslationDependencies();

  const unit = useMemo(
    () => buildChartUnitOptions({ metric, filter }, translationDependencies),
    [metric, filter, translationDependencies],
  );

  const { seriesInfo, orderedCategories } = useMemo(() => {
    const categories = new Set<string>();
    const series = new Map<
      string,
      { percentage: number | undefined; y: number; category: string; color?: string }[]
    >();
    barSeries.forEach(({ name, data }) => {
      data.forEach((point) => {
        const { name: pointName, color, y, percentage } = point;
        const seriesName = `${name}-${pointName}`;
        const singleSeriesInfo = series.get(seriesName) ?? [];
        singleSeriesInfo.push({
          category: pointName,
          y,
          percentage,
          color,
        });
        series.set(seriesName, singleSeriesInfo);
      });
      data.forEach((point) => {
        categories.add(point.name);
      });
    });
    return {
      seriesInfo: series,
      orderedCategories: Array.from(categories.values()),
    };
  }, [barSeries]);

  const data = useMemo(() => {
    const result = Array.from(seriesInfo.entries()).map(([seriesName, points]) => {
      const dataPoints: Array<[string, number]> = points.map(({ category, y }) => [category, y]);
      const { color } = points[0];
      return {
        name: seriesName,
        dataPoints,
        // Barchart from insights only have red color for now, so it's safe to assume that
        // if color exists, it's red. We should clean this up after launching webblox charts
        color: color ? ChartColor.Red : undefined,
      };
    });

    return {
      orderedCategories,
      series: result,
    };
  }, [orderedCategories, seriesInfo]);

  const tooltipFormatters = useMemo(() => {
    return {
      formatSeriesKeyForPoint({ x }: { x: string }): string {
        return x;
      },
      formatSeriesValueForPoint({ y }: { y: number }): string {
        return formatChartUnit(y, unit, translationDependencies);
      },
    };
  }, [unit, translationDependencies]);

  const dataLabelsFormatter = useCallback(
    ({ y }: { y: number }) => {
      return formatChartUnit(y, unit, translationDependencies);
    },
    [unit, translationDependencies],
  );

  return (
    <Grid item XSmall={12}>
      <BarChart
        data={data}
        chartStyleMode={ChartStyleMode.Minimal}
        forceHideLegends
        tooltipFormatters={tooltipFormatters}
        dataLabelsFormatter={dataLabelsFormatter}
      />
    </Grid>
  );
};

export default InsightsHorizontalBarChart;
