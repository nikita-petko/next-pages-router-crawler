import type { FunctionComponent } from 'react';
import React, { useCallback, useState, useMemo, useEffect } from 'react';
import type {
  MatchmakingScoringConfiguration,
  MockServerSignalValues,
} from '@rbx/client-matchmaking-api/v1';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { matchmakingClient } from '@modules/react-query/matchmaking/matchmakingRequests';
import { numOfFakeServers } from '../constants';
import useUniversePlaces from '../hooks/useUniversePlaces';
import type {
  ConfigurationBriefInfo,
  ConfigurationDetailedInfo,
  CustomSignal,
  DefaultSignalsWeights,
  PlaceConfigurationInfo,
} from '../types/ConfigurationInfo';
import type { PlaceInfo } from '../types/PlaceInfo';
import {
  getAppliedPlaceInfoFromConfigId,
  getConfigurationDetailedInfo,
  getDefaultConfigName,
} from '../utils/ConfigurationUtils';
import MatchmakingConfigurationContext from './MatchmakingConfigurationContext';

export interface MatchmakingConfigurationProviderProps {
  configurationId?: string;
}

const MatchmakingConfigurationProvider: FunctionComponent<
  React.PropsWithChildren<MatchmakingConfigurationProviderProps>
> = ({ configurationId, children }) => {
  const { gameDetails } = useCurrentGame();
  const { placesInfo, isPlacesLoading } = useUniversePlaces();
  const [isLoadingConfigurationsForUniverse, setIsLoadingConfigurationsForUniverse] =
    useState<boolean>(false);
  const [isLoadingPlacesWithConfigurations, setIsLoadingPlacesWithConfigurations] =
    useState<boolean>(false);
  const [isLoadingCurrentConfiguration, setIsLoadingCurrentConfiguration] =
    useState<boolean>(false);
  const [fetchConfigurationsError, setFetchConfigurationsError] = useState<Error | null>(null);
  const [allScoringConfigs, setAllScoringConfigs] = useState<
    MatchmakingScoringConfiguration[] | undefined
  >(undefined);
  const [currentConfiguration, setCurrentConfiguration] = useState<
    MatchmakingScoringConfiguration | undefined
  >(undefined);
  const [placeIdToConfigMap, setPlaceIdToConfigMap] = useState<
    Map<number, MatchmakingScoringConfiguration> | undefined
  >(undefined);
  const [isUpdatingConfigurations, setIsUpdatingConfigurations] = useState<boolean>(false);
  const [updateConfigurationsError, setUpdateConfigurationsError] = useState<Error | null>(null);
  const [isUpdatingCustomSignals, setIsUpdatingCustomSignals] = useState<boolean>(false);
  const [updateCustomSignalsError, setUpdateCustomSignalsError] = useState<Error | null>(null);
  const [defaultSignalWeights, setDefaultSignalWeights] = useState<
    DefaultSignalsWeights | undefined
  >(undefined);
  const [defaultServerValues, setDefaultServerValues] = useState<
    MockServerSignalValues[] | undefined
  >(undefined);

  const gameId = useMemo(() => {
    return gameDetails?.id;
  }, [gameDetails]);

  useEffect(() => {
    matchmakingClient.getDefaultWeights().then((response) => {
      setDefaultSignalWeights(response.weights ?? undefined);
    });
    matchmakingClient.getDefaultServer({ count: numOfFakeServers }).then((response) => {
      setDefaultServerValues(response.exampleGameSignalValues ?? undefined);
    });
  }, []);

  const getPlacesWithScoringConfigurations = useCallback(
    (currentGameId: number) => {
      setIsLoadingPlacesWithConfigurations(true);
      if (!isPlacesLoading) {
        matchmakingClient
          .getPlacesWithScoringConfigurationsByUniverseId({
            universeId: currentGameId,
          })
          .then((response) => {
            const { placeScoringConfigurations } = response;
            // parse response object into a map keyed by the Place's information to scoring configuration
            if (placeScoringConfigurations) {
              const placeIdToConfigurationMap = new Map<number, MatchmakingScoringConfiguration>();
              Object.entries(placeScoringConfigurations).forEach((placeToConfig) => {
                const placeId = parseInt(placeToConfig[0], 10);
                placeIdToConfigurationMap.set(placeId, placeToConfig[1]);
              });
              setPlaceIdToConfigMap(placeIdToConfigurationMap);
            }
            setFetchConfigurationsError(null);
          })
          .catch(() => {
            setPlaceIdToConfigMap(undefined);
            setFetchConfigurationsError(Error('Failed to fetch current scoring configuration'));
          })
          .finally(() => {
            setIsLoadingPlacesWithConfigurations(false);
          });
      }
    },
    [isPlacesLoading],
  );

  const placeInfoToConfigMap = useMemo(() => {
    const scoringConfigurationsByPlaceMap = new Map<PlaceInfo, MatchmakingScoringConfiguration>();
    if (placesInfo) {
      if (placeIdToConfigMap) {
        placeIdToConfigMap.forEach((config, placeId) => {
          const place = placesInfo.find((placeInfo) => placeInfo.placeId === placeId);
          if (place) {
            scoringConfigurationsByPlaceMap.set(place, config);
          }
        });
        return scoringConfigurationsByPlaceMap;
      }
    }
    return scoringConfigurationsByPlaceMap;
  }, [placeIdToConfigMap, placesInfo]);

  const getAppliedPlaceInfoForConfiguration = useCallback(
    (configId: string | null | undefined): Map<number, PlaceInfo> => {
      return getAppliedPlaceInfoFromConfigId(configId, placeInfoToConfigMap);
    },
    [placeInfoToConfigMap],
  );

  const getScoringConfigurationsForUniverse = useCallback((currentGameId: number) => {
    setIsLoadingConfigurationsForUniverse(true);
    matchmakingClient
      .getScoringConfigurationsByUniverseId({
        universeId: currentGameId,
      })
      .then((response) => {
        const { scoringConfigurations } = response;
        if (scoringConfigurations) {
          setAllScoringConfigs(scoringConfigurations);
        }
        setFetchConfigurationsError(null);
      })
      .catch(() => {
        setAllScoringConfigs(undefined);
        setFetchConfigurationsError(Error('Failed to fetch current scoring configuration'));
      })
      .finally(() => {
        setIsLoadingConfigurationsForUniverse(false);
      });
  }, []);

  const getConfigurationById = useCallback(
    async (configId: string, silent: boolean = false): Promise<void> => {
      if (!silent) {
        setIsLoadingCurrentConfiguration(true);
      }
      try {
        const response = await matchmakingClient.getScoringConfigurationByScoringConfigurationId({
          scoringConfigurationId: configId,
        });
        const { scoringConfiguration } = response;
        setCurrentConfiguration(scoringConfiguration);
        setFetchConfigurationsError(null);
      } catch {
        setCurrentConfiguration(undefined);
        setFetchConfigurationsError(Error('Failed to fetch current scoring configuration'));
      } finally {
        if (!silent) {
          setIsLoadingCurrentConfiguration(false);
        }
      }
    },
    [],
  );

  const allConfigurationBriefInfoList = useMemo(() => {
    if (allScoringConfigs) {
      const allConfigs: ConfigurationBriefInfo[] = allScoringConfigs?.map((config) => {
        const appliedPlaces = getAppliedPlaceInfoForConfiguration(config.id);
        return {
          name: config.name ?? '',
          id: config.id ?? '',
          appliedPlaces,
          modifiedTime: config.updatedTime,
        };
      });
      return allConfigs;
    }
    return;
  }, [allScoringConfigs, getAppliedPlaceInfoForConfiguration]);

  useEffect(() => {
    if (gameId) {
      getPlacesWithScoringConfigurations(gameId);
    }
  }, [gameId, getPlacesWithScoringConfigurations]);

  useEffect(() => {
    if (gameId && !isPlacesLoading) {
      getScoringConfigurationsForUniverse(gameId);
    }
  }, [gameId, getScoringConfigurationsForUniverse, isPlacesLoading]);

  useEffect(() => {
    if (configurationId) {
      getConfigurationById(configurationId);
    }
  }, [configurationId, getConfigurationById]);

  const placesWithAppliedConfigurations = useMemo(() => {
    const appliedPlacesConfig: PlaceConfigurationInfo[] = [];
    if (!isPlacesLoading && placeInfoToConfigMap !== undefined) {
      placeInfoToConfigMap.forEach((config, placeInfo) => {
        const configInfo = {
          placeName: placeInfo?.name ?? undefined,
          placeId: placeInfo?.placeId ?? undefined,
          thumbnailUrl: placeInfo?.thumbnailUrl ?? undefined,
          configurationName: config.name ?? undefined,
          modifiedTime: config.updatedTime,
        };
        appliedPlacesConfig.push(configInfo);
      });
    }
    return appliedPlacesConfig;
  }, [isPlacesLoading, placeInfoToConfigMap]);

  const currentConfigurationDetailedInfo: ConfigurationDetailedInfo | undefined = useMemo(() => {
    if (
      currentConfiguration === undefined ||
      isLoadingCurrentConfiguration ||
      isLoadingPlacesWithConfigurations
    ) {
      return;
    }
    const value = getConfigurationDetailedInfo(currentConfiguration, placeInfoToConfigMap);
    return value;
  }, [
    currentConfiguration,
    isLoadingCurrentConfiguration,
    isLoadingPlacesWithConfigurations,
    placeInfoToConfigMap,
  ]);

  const getCustomSignals = (
    customSignals: CustomSignal[] | undefined | null,
  ):
    | {
        [key: string]: number;
      }
    | undefined => {
    if (!customSignals) {
      return undefined;
    }
    const signalsMap = new Map(customSignals.map((signal) => [signal.name, signal.weight ?? 0]));
    return Object.fromEntries(signalsMap);
  };

  const handleAddConfiguration = useCallback(async (): Promise<string | undefined> => {
    if (!gameId) {
      return undefined;
    }
    try {
      const response = await matchmakingClient.createScoringConfiguration({
        createMatchmakingScoringConfigurationRequest: {
          universeId: gameId,
          name: getDefaultConfigName(allConfigurationBriefInfoList),
          matchmakingSignalWeights: defaultSignalWeights,
          customSignalWeights: {},
          // customSignalWeights: getCustomSignals(configuration?.customSignals),
          // matchmakingSignalWeights: configuration?.defaultSignals,
        },
      });
      const { scoringConfiguration } = response;
      setUpdateConfigurationsError(null);
      setIsUpdatingConfigurations(false);
      getScoringConfigurationsForUniverse(gameId);
      return scoringConfiguration?.id ?? undefined;
    } catch (e) {
      const catchedError = e as Error;
      setUpdateConfigurationsError(catchedError);
      setIsUpdatingConfigurations(false);
    }
    return undefined;
  }, [
    allConfigurationBriefInfoList,
    defaultSignalWeights,
    gameId,
    getScoringConfigurationsForUniverse,
  ]);

  const handleUpdateConfiguration = useCallback(
    async (configuration: ConfigurationDetailedInfo) => {
      if (!gameId) {
        return false;
      }
      try {
        await matchmakingClient.updateScoringConfiguration({
          scoringConfigurationId: configuration.id,
          updateMatchmakingScoringConfigurationRequest: {
            scoringConfigurationId: configuration.id,
            name: configuration?.name,
            customSignalWeights: getCustomSignals(configuration.customSignals),
            matchmakingSignalWeights: configuration.defaultSignals,
          },
        });
        setUpdateConfigurationsError(null);
        setIsUpdatingConfigurations(false);
        getScoringConfigurationsForUniverse(gameId);
        return true;
      } catch (e) {
        const catchedError = e as Error;
        setUpdateConfigurationsError(catchedError);
        setIsUpdatingConfigurations(false);
        return false;
      }
    },
    [gameId, getScoringConfigurationsForUniverse],
  );

  const handleDeleteConfiguration = useCallback(
    async (scoringConfigurationId: string) => {
      try {
        await matchmakingClient.deleteScoringConfiguration({
          scoringConfigurationId,
        });
        setUpdateConfigurationsError(null);
        setIsUpdatingConfigurations(false);
        if (gameId) {
          getScoringConfigurationsForUniverse(gameId);
        }
        return true;
      } catch (e) {
        const catchedError = e as Error;
        setUpdateConfigurationsError(catchedError);
        setIsUpdatingConfigurations(false);
      }
      return false;
    },
    [gameId, getScoringConfigurationsForUniverse],
  );

  const handleAddConfigurationForPlace = useCallback(
    (scoringConfigurationId: string | undefined, placeId: number | undefined) => {
      if (!placeId || !scoringConfigurationId) {
        return false;
      }
      setIsUpdatingConfigurations(true);
      matchmakingClient
        .setScoringConfigurationForPlace({
          setPlaceMatchmakingScoringConfigurationRequest: {
            placeId,
            scoringConfigurationId,
          },
        })
        .then(() => {
          setUpdateConfigurationsError(null);
          if (gameId) {
            getPlacesWithScoringConfigurations(gameId);
          }
        })
        .catch((e) => {
          const catchedError = e as Error;
          setUpdateConfigurationsError(catchedError);
        })
        .finally(() => {
          setIsUpdatingConfigurations(false);
        });
      if (updateConfigurationsError) {
        return false;
      }
      return true;
    },
    [gameId, getPlacesWithScoringConfigurations, updateConfigurationsError],
  );

  const handleDeleteConfigurationForPlaceId = useCallback(
    (placeId: number | undefined) => {
      if (!placeId) {
        return false;
      }
      setIsUpdatingConfigurations(true);
      matchmakingClient
        .deleteScoringConfigurationFromPlace({
          placeId,
        })
        .then(() => {
          setUpdateConfigurationsError(null);
          if (gameId) {
            getPlacesWithScoringConfigurations(gameId);
          }
        })
        .catch((e) => {
          const catchedError = e as Error;
          setUpdateConfigurationsError(catchedError);
        })
        .finally(() => {
          setIsUpdatingConfigurations(false);
        });
      if (updateConfigurationsError) {
        return false;
      }
      return true;
    },
    [gameId, getPlacesWithScoringConfigurations, updateConfigurationsError],
  );

  const handleApplyConfigurationToPlaceIds = useCallback(
    (configId: string, placeIds: number[]) => {
      // get existing places where config is applied
      const currentConfig = allConfigurationBriefInfoList?.find(
        (config) => config?.id === configId,
      );
      if (currentConfig) {
        const { appliedPlaces } = currentConfig;
        const duplicateMap = new Map(appliedPlaces);
        const placesToAdd: number[] = [];
        placeIds.forEach((id) => {
          if (!duplicateMap?.has(id)) {
            // new entry
            placesToAdd.push(id);
          }
          duplicateMap.delete(id);
        });
        // remaining entries should be deleted
        const placesToDelete = Array.from(duplicateMap.keys());
        if (placesToAdd.length === 0 && placesToDelete.length === 0) {
          return true;
        }
        if (placesToDelete.length > 0) {
          placesToDelete.forEach((placeId) => handleDeleteConfigurationForPlaceId(placeId));
        }
        if (placesToAdd.length > 0) {
          placesToAdd.forEach((placeId) => handleAddConfigurationForPlace(configId, placeId));
        }
        if (updateConfigurationsError) {
          return false;
        }
        if (gameId) {
          getPlacesWithScoringConfigurations(gameId);
        }
        return true;
      }
      return true;
    },
    [
      allConfigurationBriefInfoList,
      gameId,
      getPlacesWithScoringConfigurations,
      handleAddConfigurationForPlace,
      handleDeleteConfigurationForPlaceId,
      updateConfigurationsError,
    ],
  );

  const handleAddCustomSignal = useCallback(
    async (signalConfiguration: CustomSignal, scoringConfigurationId: string | undefined) => {
      if (!scoringConfigurationId) {
        return false;
      }
      try {
        await matchmakingClient.createCustomSignal({
          scoringConfigurationId,
          createCustomMatchmakingSignalRequest: {
            scoringConfigurationId,
            signalConfiguration,
          },
        });
        // Use silent refresh to avoid showing loading screen and losing user's local state
        // Fire-and-forget: refresh in background to sync provider state, but don't block on it
        // Local state is already updated via onConfirm callback, so UI remains responsive
        getConfigurationById(scoringConfigurationId, true).catch(() => {
          // Silently handle refresh errors - local state is already correct
        });
        setUpdateCustomSignalsError(null);
        setIsUpdatingCustomSignals(false);
        return true;
      } catch (e) {
        const catchedError = e as Error;
        setUpdateCustomSignalsError(catchedError);
        setIsUpdatingCustomSignals(false);
      }
      return false;
    },
    [getConfigurationById],
  );

  const handleUpdateCustomSignal = useCallback(
    async (
      signalConfiguration: CustomSignal,
      signalName: string,
      scoringConfigurationId: string | undefined,
    ) => {
      if (!scoringConfigurationId) {
        return false;
      }
      try {
        await matchmakingClient.updateCustomSignal({
          scoringConfigurationId,
          signalName,
          updateCustomMatchmakingSignalRequest: {
            scoringConfigurationId,
            signalConfiguration,
          },
        });
        // Use silent refresh to avoid showing loading screen and losing user's local state
        getConfigurationById(scoringConfigurationId, true);
        setUpdateCustomSignalsError(null);
        setIsUpdatingCustomSignals(false);
        return true;
      } catch (e) {
        const catchedError = e as Error;
        setUpdateCustomSignalsError(catchedError);
        setIsUpdatingCustomSignals(false);
      }
      return false;
    },
    [getConfigurationById],
  );

  const handleDeleteCustomSignal = useCallback(
    async (scoringConfigurationId: string, signalName: string) => {
      try {
        await matchmakingClient.deleteCustomSignal({
          scoringConfigurationId,
          signalName,
        });
        // Use silent refresh to avoid showing loading screen and losing user's local state
        getConfigurationById(scoringConfigurationId, true);
        setUpdateCustomSignalsError(null);
        setIsUpdatingCustomSignals(false);
        return true;
      } catch (e) {
        const catchedError = e as Error;
        setUpdateCustomSignalsError(catchedError);
        setIsUpdatingCustomSignals(false);
      }
      return false;
    },
    [getConfigurationById],
  );

  const refreshConfigurations = useCallback(() => {
    if (gameId) {
      getScoringConfigurationsForUniverse(gameId);
      getPlacesWithScoringConfigurations(gameId);
    }
  }, [gameId, getScoringConfigurationsForUniverse, getPlacesWithScoringConfigurations]);

  const providerValue = useMemo(() => {
    return {
      allConfigurationBriefInfoList,
      defaultSignalWeights,
      defaultServerValues,
      currentConfigurationDetailedInfo,
      placesWithAppliedConfigurations,
      refreshConfigurations,
      handleAddConfiguration,
      handleUpdateConfiguration,
      handleDeleteConfiguration,
      handleAddConfigurationForPlace,
      handleDeleteConfigurationForPlaceId,
      handleApplyConfigurationToPlaceIds,
      handleAddCustomSignal,
      handleUpdateCustomSignal,
      handleDeleteCustomSignal,
      isLoadingConfigurationsForUniverse,
      isLoadingCurrentConfiguration,
      isLoadingPlacesWithConfigurations,
      fetchConfigurationsError,
      isUpdatingConfigurations,
      updateConfigurationsError,
      isUpdatingCustomSignals,
      updateCustomSignalsError,
      allScoringConfigs,
      placeInfoToConfigMap,
    };
  }, [
    allConfigurationBriefInfoList,
    defaultSignalWeights,
    defaultServerValues,
    currentConfigurationDetailedInfo,
    placesWithAppliedConfigurations,
    placeInfoToConfigMap,
    refreshConfigurations,
    handleAddConfiguration,
    handleUpdateConfiguration,
    handleDeleteConfiguration,
    handleAddConfigurationForPlace,
    handleDeleteConfigurationForPlaceId,
    handleApplyConfigurationToPlaceIds,
    handleAddCustomSignal,
    handleUpdateCustomSignal,
    handleDeleteCustomSignal,
    isLoadingConfigurationsForUniverse,
    isLoadingCurrentConfiguration,
    isLoadingPlacesWithConfigurations,
    fetchConfigurationsError,
    isUpdatingConfigurations,
    updateConfigurationsError,
    isUpdatingCustomSignals,
    updateCustomSignalsError,
    allScoringConfigs,
  ]);

  return (
    <MatchmakingConfigurationContext.Provider value={providerValue}>
      {children}
    </MatchmakingConfigurationContext.Provider>
  );
};

export default MatchmakingConfigurationProvider;
