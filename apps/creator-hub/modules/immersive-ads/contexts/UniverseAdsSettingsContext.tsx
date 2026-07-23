import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
  useMemo,
} from 'react';
import developerAdsStatsClient from '@modules/clients/developerAdsStats';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';
import { PlayWithRewardServingStatus } from '@rbx/clients/developerAdsStatsApi';
import { useEligibility } from './EligibilityContext';

// Types
export interface UniverseAdsSettingsState {
  isAppPromoEnabled: boolean;
  isClickOutEnabled: boolean;
  isExcludeLikelyPayersEnabled: boolean;
  pwrServingStatus: PlayWithRewardServingStatus;
  rewardMetadata?: {
    displayDetails?: {
      productName?: string;
      imageAssetId?: number;
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
      return { ...state, ...action.payload!, isLoading: false };
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
      return {
        ...state,
        isLoading: false,
        isError: true,
        errorStatus: action.errorCode ?? 500,
      };
    default:
      return state;
  }
}

// Context type
interface UniverseAdsSettingsContextType {
  state: UniverseAdsSettingsState;
  fetchUniverseAdsSettings: () => Promise<void>;
  updateUniverseAdsSettings: (
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
  const { eligibilityState } = useEligibility();
  const [state, dispatch] = useReducer(universeAdsSettingsReducer, initialUniverseAdsSettingsState);

  const fetchUniverseAdsSettings = useCallback(async () => {
    // Page is not loaded, so don't do the API call with incorrect universeId
    if (universeId === uninitializedUniverseId || !eligibilityState.showRewardedAdsToggle) {
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
      const err = error as { status?: number };
      const errorCode = err?.status ?? 500;
      dispatch({
        type: UniverseAdsSettingsActionType.FETCH_FAILURE,
        errorCode,
      });
    }
  }, [universeId, eligibilityState.showRewardedAdsToggle]);

  const updateUniverseAdsSettings = useCallback(
    async (
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
            isAppPromoEnabled,
            isClickOutEnabled,
            isExcludeLikelyPayersEnabled,
          },
        });
      } catch (error) {
        const err = error as { status?: number };
        const errorCode = err?.status ?? 500;
        dispatch({
          type: UniverseAdsSettingsActionType.UPDATE_FAILURE,
          errorCode,
        });
        throw error; // Re-throw to allow caller to handle
      }
    },
    [universeId],
  );

  // Auto-fetch when universeId changes and shouldFetch is true
  useEffect(() => {
    if (universeId && universeId > 0 && eligibilityState.showRewardedAdsToggle) {
      fetchUniverseAdsSettings();
    }
  }, [universeId, eligibilityState.showRewardedAdsToggle, fetchUniverseAdsSettings]);

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
