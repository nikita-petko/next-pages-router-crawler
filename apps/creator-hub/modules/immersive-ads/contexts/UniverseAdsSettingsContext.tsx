import type { ReactNode } from 'react';
import { createContext, useContext, useReducer, useCallback, useEffect, useMemo } from 'react';
import { PlayWithRewardServingStatus } from '@rbx/client-developer-ads-stats-api/v1';
import developerAdsStatsClient from '@modules/clients/developerAdsStats';
import { getResponseFromError } from '@modules/clients/utils';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';

// Types
export interface UniverseAdsSettingsState {
  isRewardedAdsEnabled: boolean;
  isAppPromoEnabled: boolean;
  isClickOutEnabled: boolean;
  isExcludeLikelyPayersEnabled: boolean;
  pwrServingStatus: PlayWithRewardServingStatus;
  rewardMetadata?: {
    displayDetails?: {
      productName?: string;
      imageAssetId?: number;
    };
    rewardInfo?: {
      productId?: number;
      rewardsFrequencyCapDaily?: number;
      excludeLikelyPayers?: boolean;
    };
  };
  isLoading: boolean;
  isError: boolean;
  errorStatus: number;
}

export enum UniverseAdsSettingsActionType {
  FETCH_INIT = 'FETCH_INIT',
  FETCH_SUCCESS = 'FETCH_SUCCESS',
  FETCH_FAILURE = 'FETCH_FAILURE',
  UPDATE_SUCCESS = 'UPDATE_SUCCESS',
  UPDATE_FAILURE = 'UPDATE_FAILURE',
}

interface UniverseAdsSettingsAction {
  type: UniverseAdsSettingsActionType;
  payload?: Partial<UniverseAdsSettingsState>;
  errorCode?: number;
}

// Initial state
const initialUniverseAdsSettingsState: UniverseAdsSettingsState = {
  isRewardedAdsEnabled: false,
  isAppPromoEnabled: false,
  isClickOutEnabled: false,
  isExcludeLikelyPayersEnabled: false,
  pwrServingStatus: PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_UNSPECIFIED,
  rewardMetadata: undefined,
  isLoading: false,
  isError: false,
  errorStatus: 0,
};

// Reducer
function universeAdsSettingsReducer(
  state: UniverseAdsSettingsState,
  action: UniverseAdsSettingsAction,
): UniverseAdsSettingsState {
  switch (action.type) {
    case UniverseAdsSettingsActionType.FETCH_INIT:
      return { ...state, isLoading: true, isError: false, errorStatus: 0 };
    case UniverseAdsSettingsActionType.FETCH_SUCCESS:
      return { ...state, ...action.payload, isLoading: false, isError: false };
    case UniverseAdsSettingsActionType.FETCH_FAILURE:
      return {
        ...state,
        isLoading: false,
        isError: true,
        errorStatus: action.errorCode ?? 500,
      };
    case UniverseAdsSettingsActionType.UPDATE_SUCCESS:
      return { ...state, isLoading: false, isError: false, errorStatus: 0 };
    case UniverseAdsSettingsActionType.UPDATE_FAILURE:
      return { ...state, isLoading: false };
    default:
      return state;
  }
}

// Context type
interface UniverseAdsSettingsContextType {
  state: UniverseAdsSettingsState;
  fetchUniverseAdsSettings: () => Promise<void>;
  updateUniverseAdsSettings: (
    isRewardedAdsEnabled: boolean,
    isAppPromoEnabled: boolean,
    isClickOutEnabled: boolean,
    isExcludeLikelyPayersEnabled: boolean,
  ) => Promise<void>;
  dispatch: React.Dispatch<UniverseAdsSettingsAction>;
}

// Create context
const UniverseAdsSettingsContext = createContext<UniverseAdsSettingsContextType | undefined>(
  undefined,
);

// Provider props
interface UniverseAdsSettingsProviderProps {
  children: ReactNode;
  universeId: number;
}

// Provider component
export const UniverseAdsSettingsProvider: React.FC<UniverseAdsSettingsProviderProps> = ({
  children,
  universeId,
}) => {
  const [state, dispatch] = useReducer(universeAdsSettingsReducer, initialUniverseAdsSettingsState);

  const fetchUniverseAdsSettings = useCallback(async () => {
    // Page is not loaded, so don't do the API call with incorrect universeId
    if (universeId === uninitializedUniverseId) {
      return;
    }

    try {
      dispatch({ type: UniverseAdsSettingsActionType.FETCH_INIT });
      const response = await developerAdsStatsClient.getUniverseAdsSettings({
        universeId,
      });
      dispatch({
        type: UniverseAdsSettingsActionType.FETCH_SUCCESS,
        payload: response,
      });
    } catch (error) {
      dispatch({
        type: UniverseAdsSettingsActionType.FETCH_FAILURE,
        errorCode: getResponseFromError(error)?.status ?? 500,
      });
    }
  }, [universeId]);

  const updateUniverseAdsSettings = useCallback(
    async (
      isRewardedAdsEnabled: boolean,
      isAppPromoEnabled: boolean,
      isClickOutEnabled: boolean,
      isExcludeLikelyPayersEnabled: boolean,
    ) => {
      if (universeId === uninitializedUniverseId) {
        return;
      }

      try {
        await developerAdsStatsClient.updateUniverseAdsSettings({
          universeId,
          updateUniverseAdsSettingsRequest: {
            isRewardedAdsEnabled,
            isAppPromoEnabled,
            isClickOutEnabled,
            isExcludeLikelyPayersEnabled,
          },
        });

        // Update local state to reflect the changes
        dispatch({
          type: UniverseAdsSettingsActionType.UPDATE_SUCCESS,
        });

        // Update the actual values in state
        dispatch({
          type: UniverseAdsSettingsActionType.FETCH_SUCCESS,
          payload: {
            isRewardedAdsEnabled,
            isAppPromoEnabled,
            isClickOutEnabled,
            isExcludeLikelyPayersEnabled,
          },
        });
      } catch (error) {
        dispatch({
          type: UniverseAdsSettingsActionType.UPDATE_FAILURE,
        });
        throw error; // Re-throw to allow caller to handle
      }
    },
    [universeId],
  );

  // Auto-fetch when universeId changes and shouldFetch is true
  useEffect(() => {
    if (universeId && universeId > 0) {
      void fetchUniverseAdsSettings();
    }
  }, [universeId, fetchUniverseAdsSettings]);

  const contextValue: UniverseAdsSettingsContextType = useMemo(
    () => ({
      state,
      fetchUniverseAdsSettings,
      updateUniverseAdsSettings,
      dispatch,
    }),
    [state, fetchUniverseAdsSettings, updateUniverseAdsSettings],
  );

  return (
    <UniverseAdsSettingsContext.Provider value={contextValue}>
      {children}
    </UniverseAdsSettingsContext.Provider>
  );
};

// Hook to use the context
export const useUniverseAdsSettings = (): UniverseAdsSettingsContextType => {
  const context = useContext(UniverseAdsSettingsContext);
  if (context === undefined) {
    throw new Error('useUniverseAdsSettings must be used within an UniverseAdsSettingsProvider');
  }
  return context;
};
