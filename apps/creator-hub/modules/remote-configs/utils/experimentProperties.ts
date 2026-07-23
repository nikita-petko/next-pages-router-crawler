import { ExperimentProductType, ExperimentState } from '../api/universeExperimentationClientEnums';
import {
  ValidExperiment,
  ValidExperimentConfiguration,
  ValidExperimentStateInfo,
} from '../api/validExperimentationTypes';
import {
  isPValueStatsig,
  PValueByExperimentMetricAndVariant,
} from '../experimentation/hooks/usePValueForExperimentMetrics';

/**
 * Get the time spec for the experiment. Start time and end time will be now if experiment hasn't started or it's still running.
 * @param experiment - The experiment to get the time spec for.
 * @returns The time spec for the experiment.
 */
export const getExperimentTimeSpec = (experiment?: ValidExperiment) => {
  const now = new Date();

  switch (experiment?.state) {
    case ExperimentState.Running:
      return {
        startTime: experiment.startedTime,
        endTime: now,
      };
    case ExperimentState.Completed:
    case ExperimentState.Cancelled:
      return {
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
        startTime: now,
        endTime: now,
      };
    default: {
      const exhaustiveCheck: never = experiment;
      throw new Error(`Unhandled experiment state: ${exhaustiveCheck}`);
    }
  }
};

export const isExperimentEditable = (experimentState: ExperimentState) => {
  return experimentState === ExperimentState.Draft || experimentState === ExperimentState.Scheduled;
};

export const isExperimentReschedulatbleOnly = (experimentState: ExperimentState) => {
  return experimentState === ExperimentState.Scheduled;
};

export const isExperimentStoppable = (experimentState: ExperimentState) => {
  return experimentState === ExperimentState.Running;
};

export const hasExperimentStarted = (experimentState: ExperimentState) => {
  return !isExperimentEditable(experimentState);
};

export const isExperimentStartable = isExperimentEditable;

export const isExperimentDeletable = (experimentState: ExperimentState) => {
  return (
    experimentState === ExperimentState.Draft ||
    experimentState === ExperimentState.Scheduled ||
    experimentState === ExperimentState.Completed
  );
};

export const isExperimentVariantWinnerChangeable = (experimentState: ExperimentState) => {
  return experimentState === ExperimentState.Completed;
};

export const getExperimentTargetingConfigKey = (
  experimentConfiguration: ValidExperimentConfiguration,
) => {
  switch (experimentConfiguration.experimentType) {
    case ExperimentProductType.Configs: {
      const firstVariant = experimentConfiguration.variants[0];
      return firstVariant.configEntry.key;
    }
    case ExperimentProductType.Matchmaking: {
      return 'Scoring Configuration';
    }
    default: {
      const exhaustiveCheck: never = experimentConfiguration;
      throw new Error(`Unhandled experiment product type: ${exhaustiveCheck}`);
    }
  }
};

export const getExperimentRunningDays = (experiment: ValidExperiment): number => {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  // experiment running days is the number of calendar days since the experiment started
  // get date without time components
  const getDateWithoutTime = (date: Date): Date => {
    const newDate = new Date(date);
    newDate.setUTCDate(date.getUTCDate());
    newDate.setUTCHours(0, 0, 0, 0);
    return newDate;
  };

  const getStartOfNextDay = (date: Date): Date => {
    const newDate = new Date(date);
    newDate.setUTCDate(date.getUTCDate() + 1);
    newDate.setUTCHours(0, 0, 0, 0);
    return newDate;
  };

  // Compare calendar days (date without time components)
  switch (experiment.state) {
    case ExperimentState.Running: {
      const todayDate = getStartOfNextDay(new Date());
      const startDate = getDateWithoutTime(experiment.startedTime);
      return Math.floor((todayDate.getTime() - startDate.getTime()) / millisecondsPerDay);
    }
    case ExperimentState.Completed:
    case ExperimentState.Cancelled: {
      const endDate = getStartOfNextDay(experiment.stoppedTime);
      const startDate = getDateWithoutTime(experiment.startedTime);
      return Math.floor((endDate.getTime() - startDate.getTime()) / millisecondsPerDay);
    }
    case ExperimentState.Scheduled:
    case ExperimentState.Deleted:
    case ExperimentState.Draft:
      return 0;
    default: {
      const exhaustiveCheck: never = experiment;
      throw new Error(`Unhandled experiment state: ${exhaustiveCheck}`);
    }
  }
};

export const isExperimentStatsSig = ({
  experiment,
  pValueByExperimentMetricAndVariant,
}: {
  experiment: ValidExperiment;
  pValueByExperimentMetricAndVariant: PValueByExperimentMetricAndVariant;
}) => {
  const { goalMetrics, variants, learningMetrics } = experiment;
  return [...goalMetrics, ...learningMetrics].some((metric) =>
    variants.some((variant) => {
      const pValue = pValueByExperimentMetricAndVariant.get(metric)?.[variant.variantId];
      return pValue !== undefined && isPValueStatsig(pValue);
    }),
  );
};

export const isExperimentRunningAndDurationMet = (
  experiment: ValidExperimentStateInfo & { durationDays: number },
) => {
  if (experiment.state !== ExperimentState.Running) return false;

  return (
    experiment.startedTime.getTime() + experiment.durationDays * 24 * 60 * 60 * 1000 <=
    new Date().getTime()
  );
};
