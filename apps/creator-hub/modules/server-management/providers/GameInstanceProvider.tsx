import {
  FunctionComponent,
  useCallback,
  useState,
  useMemo,
  useEffect,
  PropsWithChildren,
} from 'react';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { matchmakingClient } from '@modules/react-query/matchmaking/matchmakingRequests';
import {
  LaunchUpdateRequest,
  ForecastUpdateResponse,
  LaunchUpdateResponse,
  GetUpdateStatusResponse,
  V1GameInstancesForecastUpdatePostRequest,
  V1GameInstancesLaunchUpdatePostRequest,
} from '@rbx/clients/matchmakingApi/v1';
import { GameInstanceStateContext, GameInstanceActionsContext } from './GameInstanceContext';
import GameUpdatePhase from '../types/GameUpdatePhase';
import { POLLING_CONSTANTS } from '../constants';

const GameInstanceProvider: FunctionComponent<PropsWithChildren<object>> = ({ children }) => {
  const [forecastResult, setForecastResult] = useState<ForecastUpdateResponse | undefined>(
    undefined,
  );
  const [updateStatus, setUpdateStatus] = useState<GetUpdateStatusResponse | undefined>(undefined);
  const [isForecasting, setIsForecasting] = useState<boolean>(false);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [isFetchingStatus, setIsFetchingStatus] = useState<boolean>(false);
  const { gameDetails } = useCurrentGame();
  const gameId: number | undefined = useMemo(() => gameDetails?.id, [gameDetails]);

  const handleGetUpdateStatus = useCallback(async (): Promise<GetUpdateStatusResponse> => {
    if (!gameId) {
      throw new Error('Game ID is required to get update status');
    }

    setIsFetchingStatus(true);
    try {
      const request: { universeId: number } = { universeId: gameId };
      const response: GetUpdateStatusResponse = await matchmakingClient.getUpdateStatus(request);
      setUpdateStatus(response);
      return response;
    } catch (error) {
      throw new Error(
        `Failed to get update status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setIsFetchingStatus(false);
    }
  }, [gameId]);

  const handleForecastUpdate = useCallback(async (): Promise<ForecastUpdateResponse> => {
    if (!gameId) {
      throw new Error('Game ID is required to forecast update');
    }

    setIsForecasting(true);
    try {
      const forecastRequest: V1GameInstancesForecastUpdatePostRequest = {
        forecastUpdateRequest: {
          universeId: gameId,
        },
      };

      const response: ForecastUpdateResponse =
        await matchmakingClient.forecastUpdate(forecastRequest);
      setForecastResult(response);
      return response;
    } catch (error) {
      throw new Error(
        `Failed to forecast update: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setIsForecasting(false);
    }
  }, [gameId]);

  const handleLaunchUpdate = useCallback(
    async (request: LaunchUpdateRequest): Promise<LaunchUpdateResponse> => {
      if (!gameId) {
        throw new Error('Game ID is required to launch update');
      }

      setIsLaunching(true);
      try {
        const launchRequest: V1GameInstancesLaunchUpdatePostRequest = {
          launchUpdateRequest: {
            ...request,
            universeId: gameId,
          },
        };
        const response: LaunchUpdateResponse = await matchmakingClient.launchUpdate(launchRequest);
        if (response.updateId) {
          handleGetUpdateStatus();
        }
        return response;
      } catch (error) {
        throw new Error(
          `Failed to launch update: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      } finally {
        setIsLaunching(false);
      }
    },
    [gameId, handleGetUpdateStatus],
  );

  useEffect(() => {
    const isUpdateInProgress: boolean = !!updateStatus?.updateStatusList?.some((gameUpdate) =>
      Object.values(gameUpdate.placeUpdateStatuses ?? {}).some(
        (placeStatus) =>
          placeStatus.phase === GameUpdatePhase.BleedOff ||
          placeStatus.phase === GameUpdatePhase.Migrate,
      ),
    );

    if (isUpdateInProgress) {
      const interval = setInterval(() => {
        handleGetUpdateStatus();
      }, POLLING_CONSTANTS.INTERVAL_MS);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [updateStatus, handleGetUpdateStatus]);

  const actionsValue = useMemo(
    () => ({
      handleForecastUpdate,
      handleLaunchUpdate,
      handleGetUpdateStatus,
    }),
    [handleForecastUpdate, handleLaunchUpdate, handleGetUpdateStatus],
  );

  const stateValue = useMemo(
    () => ({
      forecastResult,
      updateStatus,
      isForecasting,
      isLaunching,
      isFetchingStatus,
    }),
    [forecastResult, updateStatus, isForecasting, isLaunching, isFetchingStatus],
  );

  return (
    <GameInstanceActionsContext.Provider value={actionsValue}>
      <GameInstanceStateContext.Provider value={stateValue}>
        {children}
      </GameInstanceStateContext.Provider>
    </GameInstanceActionsContext.Provider>
  );
};

export default GameInstanceProvider;
