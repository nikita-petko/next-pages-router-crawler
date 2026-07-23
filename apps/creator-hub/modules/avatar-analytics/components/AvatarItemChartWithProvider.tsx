import React, { FC, useMemo } from 'react';

import {
  DailyTimeSeriesAlignedToUTCMidnight,
  useTimeSeriesChartTooltipFormatters,
  useXAxisFormatter,
  useLocale,
} from '@modules/charts-generic';
import { AvatarItemMetric } from '@modules/clients/analytics';
import {
  useExperienceAnalyticsCurrentXAxisGranularity,
  useOnSelectChartRegion,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
import { ChartStyleMode, LineChart } from '@rbx/analytics-ui';
import { AvatarItemChartSpec } from '../types/AvatarItemChartTypes';
import avatarItemChartAdapters from '../adapters/avatarItemChartAdapters';
import { useAvatarAnalyticsMetricsSalesData } from '../context/AvatarAnalyticsMetricsSalesProvider';
import { useAvatarAnalyticsMetricsRevenueData } from '../context/AvatarAnalyticsMetricsRevenueProvider';

const MetricToDataState = (metric: AvatarItemMetric) => {
  switch (metric) {
    case AvatarItemMetric.SalesCount:
      return useAvatarAnalyticsMetricsSalesData;
    case AvatarItemMetric.Revenue:
      return useAvatarAnalyticsMetricsRevenueData;
    default: {
      const exhaustiveCheck: never = metric;
      throw new Error(`Unhandled metric: ${exhaustiveCheck}`);
    }
  }
};

type AvatarItemChartWithProviderProps = {
  spec: AvatarItemChartSpec;
};

const AvatarItemChartWithProvider: FC<AvatarItemChartWithProviderProps> = ({ spec }) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const locale = useLocale();
  const seriesIntervalMeaning = DailyTimeSeriesAlignedToUTCMidnight;
  const xAxisGranularity = useExperienceAnalyticsCurrentXAxisGranularity();
  const onSelectChartRegion = useOnSelectChartRegion();

  const { data } = MetricToDataState(spec.metric)();

  const { chart } = useMemo(() => {
    return avatarItemChartAdapters({
      response: data,
      translate,
      locale,
      spec,
      seriesIntervalMeaning,
    });
  }, [data, locale, seriesIntervalMeaning, spec, translate]);

  const xAxisFormatter = useXAxisFormatter(
    locale,
    seriesIntervalMeaning,
    xAxisGranularity,
    ChartStyleMode.Normal,
  );

  const { tooltipFormatters } = useTimeSeriesChartTooltipFormatters({
    chartUnitSpec: chart.unit,
    seriesIntervalMeaning,
    series: chart.series,
    timeAxisSpec: {
      startDate: spec.startDate,
      endDate: spec.endDate,
    },
  });

  const xAxisType = useMemo(
    () => ({
      type: 'datetime' as const,
      granularity: xAxisGranularity,
    }),
    [xAxisGranularity],
  );

  return (
    <LineChart
      data={chart}
      tooltipFormatters={tooltipFormatters}
      xAxisFormatter={xAxisFormatter}
      xAxisType={xAxisType}
      onSelectChartRegion={onSelectChartRegion}
    />
  );
};

export default AvatarItemChartWithProvider;
