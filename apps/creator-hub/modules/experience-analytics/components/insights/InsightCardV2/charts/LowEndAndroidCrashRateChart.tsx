import type { FC } from 'react';
import { useMemo } from 'react';
import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { insightsChartColor } from '@modules/charts-generic/charts/constants';
import type { BarSeriesEntry } from '@modules/charts-generic/charts/types/HorizontalBarChartTypes';
import SeriesTypes from '@modules/charts-generic/charts/types/SeriesTypes';
import InsightsHorizontalBarChart from '@modules/experience-analytics-shared/components/InsightsHorizontalBarChart';
import getAnalyticsMetricDisplayConfig from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import type { LowEndAndroidCrashRateSpec } from '@modules/experience-analytics-shared/types/insights';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const METRIC = RAQIV2Metric.ClientCrashRate15m;

/**
 * NOTE (@bxu - 2024/08/15): We utilized the escape hatch to create a HorizontalBarChart directly here instead of
 * a generic RAQIV2 chart because:
 * 1. It does not need to exist in Explore Mode
 * 2. Nor will it exist in other pages
 * 3. Data for this insight is pre-computed in data pipelines.
 *
 * If there are more use cases for a chart that compares between multiple RAQI series with a horizontal
 * bar chart, we can replace this component completely with that.
 */
const LowEndAndroidCrashRateChart: FC<{ spec: LowEndAndroidCrashRateSpec }> = ({ spec }) => {
  const { translate } = useRAQIV2TranslationDependencies();

  const barSeries: BarSeriesEntry[] = useMemo(
    () => [
      {
        type: SeriesTypes.Bar,
        data: [
          {
            name: translate(
              translationKey('Chart.Label.LowEndAndroid', TranslationNamespace.Insights),
            ),
            y: spec.chartInfo.lowEndAndroidCrashRate,
            percentage: spec.chartInfo.lowEndAndroidCrashRate,
            color: insightsChartColor.red,
          },
          {
            name: translate(translationKey('Chart.Label.Overall', TranslationNamespace.Insights)),
            y: spec.chartInfo.totalCrashRate,
            percentage: spec.chartInfo.totalCrashRate,
          },
        ],
        name: translate(getAnalyticsMetricDisplayConfig(METRIC).localizedName),
      },
    ],
    [spec, translate],
  );

  return <InsightsHorizontalBarChart barSeries={barSeries} metric={METRIC} />;
};

export default LowEndAndroidCrashRateChart;
