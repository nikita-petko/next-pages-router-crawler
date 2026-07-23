import TTimeRangeSpec from '../types/TimeRangeSpec';
import { snapToLatestEndTime, snapToLatestStartTime } from './snapToLatestTimestep';

const calculateTimeRangeFromSpec = (spec: TTimeRangeSpec): { startTime: Date; endTime: Date } => {
  if (spec.type === 'explicit') {
    return {
      startTime: snapToLatestStartTime(spec.startTime, spec.granularity),
      endTime: snapToLatestEndTime(spec.endTime, spec.granularity),
    };
  }
  const now = new Date();
  return {
    startTime: snapToLatestStartTime(
      new Date(now.getTime() - spec.lookbackSeconds * 1000),
      spec.granularity,
    ),
    endTime: snapToLatestEndTime(now, spec.granularity),
  };
};

export default calculateTimeRangeFromSpec;
