import { useContext } from 'react';
import { ValidConfigEntry } from '../../api/validTypes';
import {
  ValidConfigsExperimentConfigurationForCreation,
  ValidExperimentVariantByExperimentType,
  ValidMatchmakingExperimentConfigurationForCreation,
  ValidPlaceScoringConfig,
} from '../../api/validExperimentationTypes';
import { ExperimentProductType } from '../../api/universeExperimentationClientEnums';
import { VariantsConfigurationForInExperienceContext } from './VariantsConfigurationForInExperienceProvider';
import { VariantsConfigurationForMatchmakingContext } from './VariantsConfigurationForMatchMakingProvider';
import {
  ConfigurationStepFormDataInExperience,
  ConfigurationStepFormDataMatchmaking,
  ConfigurationStepFormSelectorsDataMatchmaking,
  PlaceScoringConfig,
} from '../types/FormData';

type TConfigs = {
  [ExperimentProductType.Configs]: {
    configs: Array<ValidConfigEntry>;
  };
  [ExperimentProductType.Matchmaking]: {
    configs: ConfigurationStepFormSelectorsDataMatchmaking;
    getPlaceCurrentAppliedConfigId: (placeId: number | undefined) => string;
    isPlaceCurrentConfigIdMismatchApplied: (
      placeConfig: PlaceScoringConfig | ValidPlaceScoringConfig,
    ) => boolean;
    updatePlaceConfigToMatchApplied: <T extends PlaceScoringConfig | ValidPlaceScoringConfig>(
      placeConfig: T,
    ) => T;
  };
};

export type TFormData = {
  [ExperimentProductType.Configs]: ConfigurationStepFormDataInExperience;
  [ExperimentProductType.Matchmaking]: ConfigurationStepFormDataMatchmaking;
};

type ValidExperimentConfigurationForCreation = {
  [ExperimentProductType.Configs]: ValidConfigsExperimentConfigurationForCreation;
  [ExperimentProductType.Matchmaking]: ValidMatchmakingExperimentConfigurationForCreation;
};

export type VariantsConfigurationContextType<TProductType extends ExperimentProductType> = {
  /**
   * Retrieves the valid configuration entries for the specified product type (e.g., in-experience, matchmaking).
   * Returns an object containing the configs data and a refresh function.
   */
  getConfigs: () => TConfigs[TProductType] & { refresh: () => void };
  /**
   * Converts form data into an array of valid experiment variants for the given product type.
   * The returned array matches the format expected by the experiment API.
   */
  transformVariantsFormDataToValidVariants: (
    formData: TFormData[TProductType],
  ) => ValidExperimentConfigurationForCreation[TProductType];
  /**
   * Converts an array of valid experiment variants into form data for the given product type.
   * The returned form data matches the format expected by the experiment form.
   */
  transformValidVariantsToFormData: (
    variants: Array<ValidExperimentVariantByExperimentType[TProductType]>,
  ) => TFormData[TProductType];
};

// Function overloads for better type safety
function useVariantsConfigurationProvider(
  productType: ExperimentProductType.Configs,
): VariantsConfigurationContextType<ExperimentProductType.Configs>;
function useVariantsConfigurationProvider(
  productType: ExperimentProductType.Matchmaking,
): VariantsConfigurationContextType<ExperimentProductType.Matchmaking>;
function useVariantsConfigurationProvider(
  productType: ExperimentProductType,
):
  | VariantsConfigurationContextType<ExperimentProductType.Configs>
  | VariantsConfigurationContextType<ExperimentProductType.Matchmaking>;
function useVariantsConfigurationProvider(
  productType: ExperimentProductType,
):
  | VariantsConfigurationContextType<ExperimentProductType.Configs>
  | VariantsConfigurationContextType<ExperimentProductType.Matchmaking> {
  const inExperienceContext = useContext(VariantsConfigurationForInExperienceContext);
  const matchmakingContext = useContext(VariantsConfigurationForMatchmakingContext);

  switch (productType) {
    case ExperimentProductType.Configs:
      return inExperienceContext;
    case ExperimentProductType.Matchmaking:
      return matchmakingContext;
    default: {
      const exhaustiveCheck: never = productType;
      throw new Error(`Unknown product type: ${exhaustiveCheck}`);
    }
  }
}

export default useVariantsConfigurationProvider;
