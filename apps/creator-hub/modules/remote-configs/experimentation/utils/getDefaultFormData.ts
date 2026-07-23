import type { NonEmptyArray } from '@modules/charts-generic/types/NonEmptyArray';
import {
  ExperimentMetric,
  ExperimentProductType,
} from '../../api/universeExperimentationClientEnums';
import type { ExperimentFormData } from '../types/FormData';

export const UNINITIALIZED_PLACE_ID = -1;
export const ROBLOX_DEFAULT_MATCHMAKING_SCORING_CONFIG_ID = '';
export const MATCHMAKING_VARIANT_RELATIVE_WEIGHT_UNIT_WEIGHT = 1;
export const defaultGoalMetrics: NonEmptyArray<ExperimentMetric> = [
  ExperimentMetric.PlaytimePerUser,
  ExperimentMetric.AverageRevenuePerUser,
];

export const getDefaultFormData = (type: ExperimentProductType): ExperimentFormData => {
  const base = {
    type,
    name: '',
    exposurePercent: 100,
    variants: [],
    chosenConfig: null,
    matchmakingVariants: [],
    scheduledAt: null,
    goalMetric: null,
    durationDays: 14,
    targetingClauses: [],
  };
  switch (type) {
    case ExperimentProductType.Configs:
      return {
        ...base,
        variants: [
          { label: 'Control', isBaseline: true, weight: 50, value: '' },
          { label: 'Treatment', isBaseline: false, weight: 50, value: '' },
        ],
      };
    case ExperimentProductType.Matchmaking:
      return {
        ...base,
        matchmakingVariants: [
          {
            label: 'Control',
            isBaseline: true,
            weight: MATCHMAKING_VARIANT_RELATIVE_WEIGHT_UNIT_WEIGHT,
            placeScoringConfigs: [
              {
                placeId: undefined,
                matchmakingScoringConfigId: ROBLOX_DEFAULT_MATCHMAKING_SCORING_CONFIG_ID,
                usePlatformDefault: true, // variant index 0 default to Roblox Default
              },
            ],
          },
          {
            label: 'Variant 1',
            isBaseline: false,
            weight: MATCHMAKING_VARIANT_RELATIVE_WEIGHT_UNIT_WEIGHT,
            placeScoringConfigs: [
              {
                placeId: undefined,
                matchmakingScoringConfigId: undefined,
                usePlatformDefault: undefined,
              },
            ],
          },
        ],
      };
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unknown experiment type: ${String(exhaustiveCheck)}`);
    }
  }
};
