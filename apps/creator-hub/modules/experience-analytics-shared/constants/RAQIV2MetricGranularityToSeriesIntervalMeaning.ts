import type { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { SeriesIntervalMeaning } from '@modules/charts-generic/enums/SeriesIntervalMeaning';

const raqiV2MetricGranularityToSeriesIntervalMeaning = (
  granularity: RAQIV2MetricGranularity,
): SeriesIntervalMeaning => granularity;

export default raqiV2MetricGranularityToSeriesIntervalMeaning;
