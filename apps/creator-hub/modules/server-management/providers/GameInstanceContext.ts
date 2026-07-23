import { createContext } from 'react';
import {
  ForecastUpdateResponse,
  GetUpdateStatusResponse,
  LaunchUpdateRequest,
  LaunchUpdateResponse,
} from '@rbx/clients/matchmakingApi/v1';

export interface GameStateContextValue {
  forecastResult: ForecastUpdateResponse | undefined;
  updateStatus: GetUpdateStatusResponse | undefined;
  isForecasting: boolean;
  isLaunching: boolean;
  isFetchingStatus: boolean;
}

export interface GameInstanceActionsContextValue {
  handleForecastUpdate: () => Promise<ForecastUpdateResponse>;
  handleLaunchUpdate: (request: LaunchUpdateRequest) => Promise<LaunchUpdateResponse>;
  handleGetUpdateStatus: () => Promise<GetUpdateStatusResponse>;
}

export const GameInstanceStateContext = createContext<GameStateContextValue>({
  forecastResult: undefined,
  updateStatus: undefined,
  isForecasting: false,
  isLaunching: false,
  isFetchingStatus: false,
});

export const GameInstanceActionsContext = createContext<GameInstanceActionsContextValue>({
  handleForecastUpdate: async () => Promise.reject(new Error('Context not initialized')),
  handleLaunchUpdate: async () => Promise.reject(new Error('Context not initialized')),
  handleGetUpdateStatus: async () => Promise.reject(new Error('Context not initialized')),
});
