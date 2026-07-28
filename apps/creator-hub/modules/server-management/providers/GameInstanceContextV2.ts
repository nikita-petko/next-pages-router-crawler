import { createContext } from 'react';
import type {
  ForecastRestartResponse,
  ListRestartStatusesResponse,
  LaunchRestartResponse,
  RestartsLaunchRestartRequest,
} from '@rbx/client-server-management-service/v1';

export interface GameInstanceV2StateContextValue {
  forecastResult: ForecastRestartResponse | undefined;
  restartStatuses: ListRestartStatusesResponse | undefined;
  isForecasting: boolean;
  isLaunching: boolean;
  isFetchingStatus: boolean;
}

export interface GameInstanceV2ActionsContextValue {
  handleForecastRestart: () => Promise<ForecastRestartResponse>;
  handleLaunchRestart: (request: RestartsLaunchRestartRequest) => Promise<LaunchRestartResponse>;
  handleListRestartStatuses: () => Promise<ListRestartStatusesResponse>;
}

export const GameInstanceV2StateContext = createContext<GameInstanceV2StateContextValue>({
  forecastResult: undefined,
  restartStatuses: undefined,
  isForecasting: false,
  isLaunching: false,
  isFetchingStatus: false,
});

export const GameInstanceV2ActionsContext = createContext<GameInstanceV2ActionsContextValue>({
  handleForecastRestart: async () => {
    throw new Error('Context not initialized');
  },
  handleLaunchRestart: async () => {
    throw new Error('Context not initialized');
  },
  handleListRestartStatuses: async () => {
    throw new Error('Context not initialized');
  },
});
