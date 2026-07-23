import { SeriesIntervalMeaning } from '@modules/charts-generic';
import { FetchComparisonSeriesMode } from './makeRAQIV2Request';

const getFetchComparison = (
  showComparison: boolean,
  seriesIntervalMeaning: SeriesIntervalMeaning,
) => {
  return showComparison
    ? { mode: FetchComparisonSeriesMode.Combined, seriesIntervalMeaning }
    : undefined;
};

export default getFetchComparison;
