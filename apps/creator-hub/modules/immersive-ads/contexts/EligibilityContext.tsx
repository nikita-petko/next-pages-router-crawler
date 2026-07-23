import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import developerAdsStatsClient, { ModerationStatus } from '@modules/clients/developerAdsStats';
import { getErrorStatus } from '@modules/clients/utils/errorHelpers';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';

// Types
export interface EligibilityCriteriaState {
  isUniverseEligible: boolean;
  isUniverseOwner: boolean;
  isUniverseOwnerVerified: boolean;
  isUniverseOwnerAgeEligible: boolean;
  isExperienceNotRestricted: boolean;
  isUniverseOwner2FAEnabled: boolean;
  isUniversePublic: boolean;
  isExperienceGuidelinesCompleted: boolean;
  isExperienceGuidelinesApproved: boolean;
  experienceGuidelinesModerationStatus: ModerationStatus;
  isUniverseOverAnalyticsThreshold: boolean;
  doesExperienceNotContainFreeFormUgc: boolean;
  doesExperienceNotContainAiInteraction: boolean;
  isUniverseSuspendedFromRewardedAds: boolean;
  showRewardedAdsToggle: boolean;
  showPwRSettings: boolean;
  showClickOutToggle: boolean;
  showAppPromoToggle: boolean;
  defaultPwRFrequencyCap: number;
}

interface AsyncState {
  isLoading: boolean;
  isFetched: boolean;
  isError: boolean;
  errorStatus: number;
}

// Initial states
const initialEligibilityState: EligibilityCriteriaState = {
  isUniverseEligible: false,
  isUniverseOwner: false,
  isUniverseOwnerVerified: false,
  isUniverseOwnerAgeEligible: false,
  isExperienceNotRestricted: false,
  isUniverseOwner2FAEnabled: false,
  isUniversePublic: false,
  isExperienceGuidelinesCompleted: false,
  isExperienceGuidelinesApproved: false,
  experienceGuidelinesModerationStatus: ModerationStatus.Unspecified,
  isUniverseOverAnalyticsThreshold: false,
  doesExperienceNotContainFreeFormUgc: false,
  doesExperienceNotContainAiInteraction: false,
  isUniverseSuspendedFromRewardedAds: false,
  showRewardedAdsToggle: false,
  showPwRSettings: false,
  showClickOutToggle: false,
  showAppPromoToggle: false,
  defaultPwRFrequencyCap: 3,
};

const initialAsyncState: AsyncState = {
  isLoading: false,
  isFetched: false,
  isError: false,
  errorStatus: 0,
};

// Context type
interface EligibilityContextType {
  eligibilityState: EligibilityCriteriaState & AsyncState;
  fetchEligibilityCriteria: () => Promise<void>;
  requestQuestionnaireReview: (universeId: number) => Promise<void>;
}

// Create context
const EligibilityContext = createContext<EligibilityContextType | undefined>(undefined);

// Provider props
interface EligibilityProviderProps {
  children: React.ReactNode;
  universeId: number;
}

// Provider component
export const EligibilityProvider: React.FC<EligibilityProviderProps> = ({
  children,
  universeId,
}) => {
  const [eligibilityState, setEligibilityState] =
    useState<EligibilityCriteriaState>(initialEligibilityState);
  const [asyncState, setAsyncState] = useState<AsyncState>(initialAsyncState);

  const fetchEligibilityCriteria = useCallback(async () => {
    // Page is not loaded, so don't do the API call with incorrect universeId
    if (universeId === uninitializedUniverseId) {
      return;
    }

    try {
      setAsyncState({ isLoading: true, isFetched: false, isError: false, errorStatus: 0 });

      const response = await developerAdsStatsClient.getUniverseSuitabilityCriteria({
        universeId,
      });

      // Merge response with defaults to handle undefined values
      setEligibilityState({ ...initialEligibilityState, ...response });
      setAsyncState({ isLoading: false, isFetched: true, isError: false, errorStatus: 0 });
    } catch (error) {
      const errorCode = getErrorStatus(error, 500);
      setAsyncState({ isLoading: false, isFetched: true, isError: true, errorStatus: errorCode });
    }
  }, [universeId]);

  const requestQuestionnaireReview = useCallback(async (targetUniverseId: number) => {
    if (targetUniverseId === uninitializedUniverseId || targetUniverseId <= 0) {
      return;
    }
    await developerAdsStatsClient.triageSubmissionModeration({ universeId: targetUniverseId });
  }, []);

  // Auto-fetch when universeId changes
  useEffect(() => {
    if (universeId && universeId > 0) {
      void fetchEligibilityCriteria();
    }
  }, [universeId, fetchEligibilityCriteria]);

  const contextValue: EligibilityContextType = useMemo(
    () => ({
      eligibilityState: { ...eligibilityState, ...asyncState },
      fetchEligibilityCriteria,
      requestQuestionnaireReview,
    }),
    [eligibilityState, asyncState, fetchEligibilityCriteria, requestQuestionnaireReview],
  );

  return <EligibilityContext.Provider value={contextValue}>{children}</EligibilityContext.Provider>;
};

// Hook to use the context
export const useEligibility = (): EligibilityContextType => {
  const context = useContext(EligibilityContext);
  if (context === undefined) {
    throw new Error('useEligibility must be used within an EligibilityProvider');
  }
  return context;
};

export { ModerationStatus };
