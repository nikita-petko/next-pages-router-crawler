import { RAQIV2Dimension, TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';

const ExperimentDimensions = [
  RAQIV2Dimension.Experiment,
  RAQIV2Dimension.ExperimentVariant,
  RAQIV2Dimension.ExperimentMetric,
] as const;

export const isExperimentDimension = (
  dimension: TRAQIV2Dimension,
): dimension is TExperimentDimension => {
  return ExperimentDimensions.includes(dimension as TExperimentDimension);
};

export type TExperimentDimension = (typeof ExperimentDimensions)[number];
