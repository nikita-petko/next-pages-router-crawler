import { ExperimentProductType, ExperimentState } from '../api/universeExperimentationClientEnums';
import type { ExperimentMetric } from '../api/universeExperimentationClientEnums';
import type {
  ValidExperimentVariantsResults,
  ValidExperiment,
  ValidExperimentConfiguration,
  ValidExperimentStateInfo,
  ValidExperimentMetricResult,
} from '../api/validExperimentationTypes';

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

export const getExperimentTargetingConfigKey = (
  experimentConfiguration: ValidExperimentConfiguration,
) => {
  const { experimentType } = experimentConfiguration;
  switch (experimentType) {
    case ExperimentProductType.Configs: {
      const firstVariant = experimentConfiguration.variants[0];
      return firstVariant.configEntry.key;
    }
    case ExperimentProductType.Matchmaking: {
      return 'Scoring Configuration';
    }
    default: {
      const exhaustiveCheck: never = experimentType;
      throw new Error(`Unhandled experiment product type: ${String(exhaustiveCheck)}`);
    }
  }
};

const millisecondsPerDay = 1000 * 60 * 60 * 24;

// Experiment running days are based on calendar days, not elapsed 24-hour periods.
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

export const getExperimentRunningDays = (experiment: ValidExperiment): number => {
  const { state } = experiment;
  switch (state) {
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
      const exhaustiveCheck: never = state;
      throw new Error(`Unhandled experiment state: ${String(exhaustiveCheck)}`);
    }
  }
};

export const isExperimentStatsSig = ({
  experiment,
  experimentVariantsResults,
}: {
  experiment: ValidExperiment;
  experimentVariantsResults?: ValidExperimentVariantsResults;
}) => {
  if (!experimentVariantsResults) {
    return false;
  }
  const { goalMetrics, variants, learningMetrics } = experiment;
  return [...goalMetrics, ...learningMetrics].some((metric) =>
    variants.some(
      (variant) =>
        experimentVariantsResults.variantResults.get(variant.variantId)?.get(metric)
          ?.isStatisticallySignificant === true,
    ),
  );
};

export type ExperimentHarmMetricResult = {
  variantId: string;
  metric: ExperimentMetric;
  lift: number;
};

export const getExperimentHarmMetricResults = (
  experimentVariantsResults?: ValidExperimentVariantsResults,
): ExperimentHarmMetricResult[] => {
  if (!experimentVariantsResults) {
    return [];
  }

  const harmMetricResults: ExperimentHarmMetricResult[] = [];

  experimentVariantsResults.variantResults.forEach((metricResults, variantId) => {
    metricResults.forEach((result: ValidExperimentMetricResult, metric) => {
      if (!result.isHarmDetected || result.lift === undefined) {
        return;
      }

      harmMetricResults.push({ variantId, metric, lift: result.lift });
    });
  });

  return harmMetricResults;
};

export const getMostHarmfulExperimentMetric = (
  harmMetricResults: ExperimentHarmMetricResult[],
): ExperimentHarmMetricResult | undefined => {
  if (harmMetricResults.length === 0) {
    return undefined;
  }

  return harmMetricResults.reduce((mostHarmful, current) =>
    Math.abs(current.lift) > Math.abs(mostHarmful.lift) ? current : mostHarmful,
  );
};

export const getUniqueHarmfulExperimentMetricsCount = (
  harmMetricResults: ExperimentHarmMetricResult[],
): number => {
  return new Set(harmMetricResults.map(({ metric }) => metric)).size;
};

export const getExperimentHarmSummary = (
  experimentVariantsResults?: ValidExperimentVariantsResults,
): {
  harmMetricResults: ExperimentHarmMetricResult[];
  harmingMetricsCount: number;
  mostHarmfulMetric?: ExperimentHarmMetricResult;
} => {
  const harmMetricResults = getExperimentHarmMetricResults(experimentVariantsResults);

  return {
    harmMetricResults,
    harmingMetricsCount: getUniqueHarmfulExperimentMetricsCount(harmMetricResults),
    mostHarmfulMetric: getMostHarmfulExperimentMetric(harmMetricResults),
  };
};

export const isExperimentHarmDetected = (
  experimentVariantsResults?: ValidExperimentVariantsResults,
): boolean => {
  if (!experimentVariantsResults) {
    return false;
  }

  return Array.from(experimentVariantsResults.variantResults.values()).some((metricResults) =>
    Array.from(metricResults.values()).some((result) => result.isHarmDetected),
  );
};

export const isExperimentRunningAndDurationMet = (
  experiment: ValidExperimentStateInfo & { durationDays: number },
) => {
  if (experiment.state !== ExperimentState.Running) {
    return false;
  }

  return (
    experiment.startedTime.getTime() + experiment.durationDays * 24 * 60 * 60 * 1000 <= Date.now()
  );
};
