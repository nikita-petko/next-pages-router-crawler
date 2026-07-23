import type { PlaceInfo } from '@modules/matchmaking/types/PlaceInfo';
import type {
  ConfigurationBriefInfo,
  DefaultSignalsWeights,
} from '@modules/matchmaking/types/ConfigurationInfo';
import { MatchmakingScoringConfiguration } from '@rbx/clients/matchmakingApi/v1';
import { ValidConfigEntryValueType } from '../../api/universeConfigsClientEnums';
import {
  ExperimentMetric,
  ExperimentProductType,
} from '../../api/universeExperimentationClientEnums';
import { ValidExperimentConfigurationForCreation } from '../../api/validExperimentationTypes';

export type PlaceScoringConfig = {
  placeId: number | undefined;
  matchmakingScoringConfigId: string | undefined;
  usePlatformDefault: boolean | undefined;
};

export type VariantFormDataInExperience = Pick<
  ValidExperimentConfigurationForCreation['variants'][number],
  'label' | 'weight' | 'isBaseline'
> & { value: string };

export type VariantFormDataMatchmaking = Pick<
  ValidExperimentConfigurationForCreation['variants'][number],
  'label' | 'weight' | 'isBaseline'
> & { placeScoringConfigs: Array<PlaceScoringConfig> };

export type ConfigurationStepFormDataInExperience = {
  chosenConfig: {
    key: string;
    valueType: ValidConfigEntryValueType;
    description?: string;
  } | null;
  variants: Array<VariantFormDataInExperience>;
};

export type ConfigurationStepFormDataMatchmaking = {
  matchmakingVariants: Array<VariantFormDataMatchmaking>;
};

export type SetupStepFormData = {
  type: ExperimentProductType;
  name: string;
  exposurePercent: number;
  goalMetric: ExperimentMetric | null;
  durationDays: number;
};

export const setupStepFormDataKeys = [
  'type',
  'name',
  'exposurePercent',
  'goalMetric',
  'durationDays',
] as const satisfies ReadonlyArray<keyof SetupStepFormData>;

export type ConfigurationStepFormData = ConfigurationStepFormDataInExperience &
  ConfigurationStepFormDataMatchmaking;

export const configurationStepFormDataKeys = [
  'chosenConfig',
  'variants',
  'matchmakingVariants',
] as const satisfies ReadonlyArray<keyof ConfigurationStepFormData>;

export type SchedulingStepFormData = {
  scheduledAt: Date | null;
};

export type ExperimentFormData = SetupStepFormData &
  ConfigurationStepFormData &
  SchedulingStepFormData;

export type ConfigurationStepFormSelectorsDataMatchmaking = {
  // the followings used in the matchmaking experiment variants configurator
  placesInfoToSelect: PlaceInfo[];
  configurationsToSelect: ConfigurationBriefInfo[];
  placesToAppliedConfigurationMap: Map<number, string>;
  isPlacesLoading: boolean;
  isLoadingPlacesWithConfigurations: boolean;
  isLoadingConfigurationsForUniverse: boolean;
  // the followings used in the matchmaking experiment variants configuration review table
  allScoringConfigs: MatchmakingScoringConfiguration[];
  defaultSignalWeights: DefaultSignalsWeights;
  placeInfoToConfigMap: Map<PlaceInfo, MatchmakingScoringConfiguration> | undefined;
};
