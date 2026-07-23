import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { TExplicitTimeRangeSpec } from '@modules/charts-generic';

export enum TimeRangeType {
  Explicit = 'explicit',
  Relative = 'relative',
}

type TExplicitTimeRangeSpecWithType = TExplicitTimeRangeSpec & {
  type: TimeRangeType.Explicit;
  granularity: RAQIV2MetricGranularity;
};

type TRelativeTimeRangeSpec = {
  type: TimeRangeType.Relative;
  lookbackSeconds: number;
  granularity: RAQIV2MetricGranularity;
};

type TTimeRangeSpec = TExplicitTimeRangeSpecWithType | TRelativeTimeRangeSpec;

export default TTimeRangeSpec;
