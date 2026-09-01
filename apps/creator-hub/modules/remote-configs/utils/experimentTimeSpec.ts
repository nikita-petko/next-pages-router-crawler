import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import { ExperimentState } from '../api/universeExperimentationClientEnums';
import type { ValidExperiment } from '../api/validExperimentationTypes';

/**
 * Get the time spec for the experiment. Start time and end time will be now if experiment hasn't started or it's still running.
 * @param experiment - The experiment to get the time spec for.
 * @returns The time spec for the experiment.
 */
const getExperimentTimeSpec = (experiment?: ValidExperiment) => {
  const now = new Date();

  switch (experiment?.state) {
    case ExperimentState.Running:
      return {
        rangeType: RAQIV2DateRangeType.Custom,
        startTime: experiment.startedTime,
        endTime: now,
      };
    case ExperimentState.Completed:
    case ExperimentState.Cancelled:
      return {
        rangeType: RAQIV2DateRangeType.Custom,
        startTime: experiment.startedTime,
        endTime: experiment.stoppedTime,
      };
    case ExperimentState.Draft:
    case ExperimentState.Deleted:
    case ExperimentState.Scheduled:
    case undefined:
      // Because querying enrollment stats (via Caaas) requires timeSpec with a start and end time.
      // Use the current time as the start time and endTime if experiment hasn't started or it's still running.
      return {
        rangeType: RAQIV2DateRangeType.Custom,
        startTime: now,
        endTime: now,
      };
    default: {
      const exhaustiveCheck: never = experiment;
      throw new Error(`Unhandled experiment state: ${String(exhaustiveCheck)}`);
    }
  }
};

export default getExperimentTimeSpec;
