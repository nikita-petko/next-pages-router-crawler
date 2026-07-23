import { useCallback, useMemo } from 'react';
import { ExperimentProductType } from '../../api/universeExperimentationClientEnums';
import type { ValidExperiment } from '../../api/validExperimentationTypes';
import useVariantsConfigurationProvider from '../context/VariantsConfigurationContext';
import type { ShouldUpdateVariantsBeforeStarting } from '../types/ShouldUpdateVairantsBeforeStarting';
import { CheckingShouldUpdateVariantsError } from '../types/ShouldUpdateVairantsBeforeStarting';

const useShouldUpdateVariantsBeforeStartingForMatchmaking = ({
  experiment,
}: {
  experiment: ValidExperiment & { experimentType: ExperimentProductType.Matchmaking };
}): ShouldUpdateVariantsBeforeStarting => {
  const { getConfigs } = useVariantsConfigurationProvider(ExperimentProductType.Matchmaking);

  const {
    configs: {
      placesInfoToSelect,
      configurationsToSelect,
      isLoadingPlacesWithConfigurations,
      isLoadingConfigurationsForUniverse,
      isPlacesLoading,
    },
    isPlaceCurrentConfigIdMismatchApplied,
    updatePlaceConfigToMatchApplied,
  } = useMemo(() => {
    return getConfigs();
  }, [getConfigs]);

  return useCallback(async () => {
    // If data is still loading, we can't validate yet
    const isLoading =
      isPlacesLoading || isLoadingConfigurationsForUniverse || isLoadingPlacesWithConfigurations;

    if (isLoading) {
      return { shouldUpdateVariants: false };
    }

    const currentPlaceIds = new Set(
      placesInfoToSelect?.map((place) => place.placeId).filter(Boolean),
    );
    const currentConfigIds = new Set(configurationsToSelect?.map((config) => config.id));

    const missingPlaces: number[] = [];
    const missingConfigs: string[] = [];
    const controlVariantMismatches: number[] = [];

    // Find the control variant (baseline)
    const controlVariant = experiment.variants.find(
      (experimentVariant) => experimentVariant.isBaseline,
    );

    // Check all variants for missing place IDs and configuration IDs
    experiment.variants.forEach((experimentVariant) => {
      if (experimentVariant.placeMatchmakingConfigs) {
        experimentVariant.placeMatchmakingConfigs.forEach((placeConfig) => {
          if (placeConfig.placeId && !currentPlaceIds.has(Number(placeConfig.placeId))) {
            if (!missingPlaces.includes(placeConfig.placeId)) {
              missingPlaces.push(placeConfig.placeId);
            }
          }

          if (
            placeConfig.matchmakingScoringConfigId &&
            !currentConfigIds.has(placeConfig.matchmakingScoringConfigId)
          ) {
            if (!missingConfigs.includes(placeConfig.matchmakingScoringConfigId)) {
              missingConfigs.push(placeConfig.matchmakingScoringConfigId);
            }
          }
        });
      }
    });

    // If there are missing places or configs, return error
    if (missingPlaces.length > 0 || missingConfigs.length > 0) {
      return {
        shouldUpdateVariants: false,
        error: CheckingShouldUpdateVariantsError.NO_TARGETING_CONFIG_FOUND,
      };
    }

    // Additional validation for control variant: ensure place configurations match applied configurations
    if (controlVariant?.placeMatchmakingConfigs) {
      controlVariant.placeMatchmakingConfigs.forEach((placeConfig) => {
        const { placeId } = placeConfig;
        const hasConfigMismatch = isPlaceCurrentConfigIdMismatchApplied(placeConfig);

        if (hasConfigMismatch && placeId) {
          if (!controlVariantMismatches.includes(placeId)) {
            controlVariantMismatches.push(placeId);
          }
        }
      });
    }

    // If there are control variant mismatches, update the experiment
    if (controlVariantMismatches.length > 0 && controlVariant) {
      const updatedVariants = experiment.variants.map(({ variantId, ...rest }) => {
        if (rest.isBaseline) {
          // Update the control variant to match currently applied configurations
          const updatedPlaceConfigs = rest.placeMatchmakingConfigs?.map((placeConfig) => {
            if (controlVariantMismatches.includes(placeConfig.placeId)) {
              return updatePlaceConfigToMatchApplied(placeConfig);
            }
            return placeConfig;
          });

          return {
            ...rest,
            placeMatchmakingConfigs: updatedPlaceConfigs,
          };
        }
        return rest;
      });

      return {
        shouldUpdateVariants: true,
        variants: updatedVariants,
        experimentType: ExperimentProductType.Matchmaking,
        error: CheckingShouldUpdateVariantsError.NO_TARGETING_CONFIG_FOUND,
      };
    }

    return {
      shouldUpdateVariants: false,
    };
  }, [
    experiment,
    placesInfoToSelect,
    configurationsToSelect,
    isPlacesLoading,
    isLoadingConfigurationsForUniverse,
    isLoadingPlacesWithConfigurations,
    isPlaceCurrentConfigIdMismatchApplied,
    updatePlaceConfigToMatchApplied,
  ]);
};

export default useShouldUpdateVariantsBeforeStartingForMatchmaking;
