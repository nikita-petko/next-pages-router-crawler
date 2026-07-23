import React, { createContext, FunctionComponent, useCallback, useMemo } from 'react';
import useConfigurationManagement from '@modules/matchmaking/hooks/useConfigurationManagement';
import useUniversePlaces from '@modules/matchmaking/hooks/useUniversePlaces';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { useTranslation } from '@rbx/intl';
import {
  ValidMatchmakingExperimentConfigurationForCreation,
  ValidPlaceScoringConfig,
} from '../../api/validExperimentationTypes';
import { ExperimentProductType } from '../../api/universeExperimentationClientEnums';
import { VariantsConfigurationContextType } from './VariantsConfigurationContext';
import {
  ConfigurationStepFormDataMatchmaking,
  ConfigurationStepFormSelectorsDataMatchmaking,
  PlaceScoringConfig,
} from '../types/FormData';
import {
  ROBLOX_DEFAULT_MATCHMAKING_SCORING_CONFIG_ID,
  UNINITIALIZED_PLACE_ID,
  MATCHMAKING_VARIANT_RELATIVE_WEIGHT_UNIT_WEIGHT,
} from '../utils/getDefaultFormData';

export const VariantsConfigurationForMatchmakingContext = createContext<
  VariantsConfigurationContextType<ExperimentProductType.Matchmaking>
>({
  getConfigs: () => {
    throw new Error('Not implemented');
  },
  transformVariantsFormDataToValidVariants: () => {
    throw new Error('Not implemented');
  },
  transformValidVariantsToFormData: () => {
    throw new Error('Not implemented');
  },
});

export const VariantsConfigurationForMatchmakingProvider: FunctionComponent<
  React.PropsWithChildren
> = ({ children }) => {
  const { translate } = useTranslationWrapper(useTranslation());

  // Source string: Roblox Default
  const RobloxDefaultScoringConfigName = translate(
    translationKey(
      'Label.ExperimentCreation.RobloxDefaultScoringConfig',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const { placesInfo, isPlacesLoading } = useUniversePlaces();
  const {
    defaultSignalWeights,
    allScoringConfigs,
    allConfigurationBriefInfoList,
    placeInfoToConfigMap,
    placesWithAppliedConfigurations,
    isLoadingPlacesWithConfigurations,
    isLoadingConfigurationsForUniverse,
    refreshConfigurations,
  } = useConfigurationManagement();

  const getConfigs = useCallback(() => {
    // Create the map from places to applied configurations
    const placesToAppliedConfigurationMap = new Map<number, string>();

    // add the existing applied configuration to place to configuration map
    if (placesWithAppliedConfigurations) {
      placesWithAppliedConfigurations.forEach((placeConfig) => {
        if (placeConfig.placeId && placeConfig.configurationName) {
          // Find the configuration ID by name
          const config = allConfigurationBriefInfoList?.find(
            (c) => c.name === placeConfig.configurationName,
          );
          if (config) {
            placesToAppliedConfigurationMap.set(placeConfig.placeId, config.id);
          }
        }
      });
    }

    // Add ROBLOX DEFAULT for places not in placesWithAppliedConfiguration
    if (placesInfo) {
      placesInfo.forEach((place) => {
        if (place.placeId && !placesToAppliedConfigurationMap.has(place.placeId)) {
          placesToAppliedConfigurationMap.set(
            place.placeId,
            ROBLOX_DEFAULT_MATCHMAKING_SCORING_CONFIG_ID,
          );
        }
      });
    }

    const configs: ConfigurationStepFormSelectorsDataMatchmaking = {
      placesInfoToSelect: placesInfo || [],
      configurationsToSelect: [
        { id: ROBLOX_DEFAULT_MATCHMAKING_SCORING_CONFIG_ID, name: RobloxDefaultScoringConfigName }, // inject the ROBLOX DEFAULT CONFIGURATION as an option here
        ...(allConfigurationBriefInfoList || []),
      ],
      placesToAppliedConfigurationMap,
      isPlacesLoading,
      isLoadingPlacesWithConfigurations,
      isLoadingConfigurationsForUniverse,
      allScoringConfigs: allScoringConfigs || [],
      defaultSignalWeights: defaultSignalWeights || {},
      placeInfoToConfigMap,
    };

    // Utility functions that operate on the current config data
    const getPlaceCurrentAppliedConfigId = (placeId: number | undefined): string => {
      return placeId
        ? (placesToAppliedConfigurationMap.get(Number(placeId)) ??
            ROBLOX_DEFAULT_MATCHMAKING_SCORING_CONFIG_ID)
        : ROBLOX_DEFAULT_MATCHMAKING_SCORING_CONFIG_ID;
    };

    const isPlaceCurrentConfigIdMismatchApplied = (
      placeConfig: PlaceScoringConfig | ValidPlaceScoringConfig,
    ): boolean => {
      const { placeId } = placeConfig;
      const appliedConfigId = getPlaceCurrentAppliedConfigId(placeId);
      const currentConfigId = placeConfig.matchmakingScoringConfigId;

      return appliedConfigId !== currentConfigId;
    };

    const updatePlaceConfigToMatchApplied = <
      T extends PlaceScoringConfig | ValidPlaceScoringConfig,
    >(
      placeConfig: T,
    ): T => {
      const { placeId } = placeConfig;
      const appliedConfigId = getPlaceCurrentAppliedConfigId(placeId);

      return {
        ...placeConfig,
        matchmakingScoringConfigId: appliedConfigId,
        usePlatformDefault: appliedConfigId === ROBLOX_DEFAULT_MATCHMAKING_SCORING_CONFIG_ID,
      } as T;
    };

    return {
      configs,
      refresh: refreshConfigurations,
      getPlaceCurrentAppliedConfigId,
      isPlaceCurrentConfigIdMismatchApplied,
      updatePlaceConfigToMatchApplied,
    };
  }, [
    placesInfo,
    allConfigurationBriefInfoList,
    placesWithAppliedConfigurations,
    isPlacesLoading,
    isLoadingPlacesWithConfigurations,
    isLoadingConfigurationsForUniverse,
    RobloxDefaultScoringConfigName,
    allScoringConfigs,
    defaultSignalWeights,
    placeInfoToConfigMap,
    refreshConfigurations,
  ]);

  const transformVariantsFormDataToValidVariants = useCallback(
    ({
      matchmakingVariants,
    }: ConfigurationStepFormDataMatchmaking): ValidMatchmakingExperimentConfigurationForCreation => {
      if (!matchmakingVariants || matchmakingVariants.length === 0) {
        return {
          experimentType: ExperimentProductType.Matchmaking,
          variants: [],
        };
      }

      const validVariants = matchmakingVariants.map((variant) => {
        return {
          label: variant.label,
          weight: MATCHMAKING_VARIANT_RELATIVE_WEIGHT_UNIT_WEIGHT,
          isBaseline: variant.isBaseline,
          placeMatchmakingConfigs: variant.placeScoringConfigs.map((placeScoringConfig) => {
            return {
              placeId: placeScoringConfig.placeId ?? UNINITIALIZED_PLACE_ID,
              matchmakingScoringConfigId:
                placeScoringConfig.matchmakingScoringConfigId ??
                ROBLOX_DEFAULT_MATCHMAKING_SCORING_CONFIG_ID,
              usePlatformDefault: placeScoringConfig.usePlatformDefault ?? true,
            };
          }),
        };
      });

      return {
        experimentType: ExperimentProductType.Matchmaking,
        variants: validVariants,
      };
    },
    [],
  );

  const transformValidVariantsToFormData: (
    variants: ValidMatchmakingExperimentConfigurationForCreation['variants'],
  ) => ConfigurationStepFormDataMatchmaking = useCallback((variants) => {
    if (variants.length === 0) {
      return {
        matchmakingVariants: [],
      };
    }

    return {
      matchmakingVariants: variants.map((variant) => {
        return {
          label: variant.label,
          weight: MATCHMAKING_VARIANT_RELATIVE_WEIGHT_UNIT_WEIGHT,
          isBaseline: variant.isBaseline,
          placeScoringConfigs: variant.placeMatchmakingConfigs.map((configEntry) => {
            const placeConfig = configEntry;
            return {
              placeId: placeConfig.placeId,
              matchmakingScoringConfigId: placeConfig.matchmakingScoringConfigId,
              usePlatformDefault: placeConfig.usePlatformDefault,
            };
          }),
        };
      }),
    };
  }, []);

  const value = useMemo(() => {
    return {
      getConfigs,
      transformVariantsFormDataToValidVariants,
      transformValidVariantsToFormData,
    };
  }, [getConfigs, transformVariantsFormDataToValidVariants, transformValidVariantsToFormData]);

  return (
    <VariantsConfigurationForMatchmakingContext.Provider value={value}>
      {children}
    </VariantsConfigurationForMatchmakingContext.Provider>
  );
};
