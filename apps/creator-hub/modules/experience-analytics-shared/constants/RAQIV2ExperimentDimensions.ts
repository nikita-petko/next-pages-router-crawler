import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
const ExperimentDimensions = [
  RAQIV2Dimension.Experiment,
  RAQIV2Dimension.ExperimentVariant,
  RAQIV2Dimension.ExperimentMetric,
] as const;

export const isExperimentDimension = (
  dimension: TRAQIV2Dimension,
): dimension is TExperimentDimension => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
  return ExperimentDimensions.includes(dimension as TExperimentDimension);
};

export type TExperimentDimension = (typeof ExperimentDimensions)[number];
