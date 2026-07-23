import { useCallback, useEffect, useState } from 'react';
import experienceQuestionnaireClient, {
  EligibilityType,
  GetQuestionnaireStatusForUserResponse,
  GetUniverseEligibilityResponse,
} from '@modules/clients/experienceQuestionnaire';
import networkRequestManager from '@modules/questionnaire/implementations/QuestionnaireNetworkRequestManager';
import useQuestionnaireToast from '@modules/questionnaire/hooks/useQuestionnaireToast';
import { getResponseFromError } from '@modules/clients/utils';
import { StatusCodes } from '@rbx/core';
import QuestionnaireState from '../constants/questionnaireState';

const useQuestionnaireFeature = (universeId?: number) => {
  const { showToastNetworkError, showToastUserError } = useQuestionnaireToast();
  const [currentQuestionnaireState, setCurrentQuestionnaireState] = useState<QuestionnaireState>(
    QuestionnaireState.Loading,
  );

  const attemptGetEligibility = useCallback(
    async (localUniverseId: number, isMounted: boolean) => {
      try {
        const eligibilityResponseObj =
          await networkRequestManager.attemptNetworkRequestWithRetry<GetUniverseEligibilityResponse>(
            () => experienceQuestionnaireClient.getUniverseEligibility(localUniverseId),
          );

        if (isMounted) {
          if (
            eligibilityResponseObj.eligibility &&
            eligibilityResponseObj.eligibility !== EligibilityType.None
          ) {
            setCurrentQuestionnaireState(QuestionnaireState.Enabled);
          } else {
            setCurrentQuestionnaireState(QuestionnaireState.NotEligible);
          }
        }
      } catch (e) {
        networkRequestManager.handleNetworkRequestFailure(
          e,
          showToastUserError,
          showToastNetworkError,
        );

        const status = getResponseFromError(e)?.status;

        if (isMounted) {
          if (status != null && status === StatusCodes.FORBIDDEN) {
            setCurrentQuestionnaireState(QuestionnaireState.Forbidden);
          } else {
            setCurrentQuestionnaireState(QuestionnaireState.Disabled);
          }
        }
      }
    },
    [setCurrentQuestionnaireState, showToastUserError, showToastNetworkError],
  );

  const attemptGetQuestionnaireStatus = useCallback(
    async (localUniverseId: number, isMounted: boolean) => {
      try {
        const questionnaireStatusResponseObj =
          await networkRequestManager.attemptNetworkRequestWithRetry<GetQuestionnaireStatusForUserResponse>(
            () => experienceQuestionnaireClient.getQuestionnaireStatus(),
          );

        if (isMounted) {
          if (questionnaireStatusResponseObj.isEnabled) {
            attemptGetEligibility(localUniverseId, isMounted);
          } else {
            setCurrentQuestionnaireState(QuestionnaireState.Disabled);
          }
        }
      } catch (e) {
        networkRequestManager.handleNetworkRequestFailure(
          e,
          showToastUserError,
          showToastNetworkError,
        );

        if (isMounted) {
          setCurrentQuestionnaireState(QuestionnaireState.Disabled);
        }
      }
    },
    [
      attemptGetEligibility,
      setCurrentQuestionnaireState,
      showToastUserError,
      showToastNetworkError,
    ],
  );

  useEffect(() => {
    let isMounted = true;
    setCurrentQuestionnaireState(QuestionnaireState.Loading);

    if (universeId) {
      attemptGetQuestionnaireStatus(universeId, isMounted);
    }

    return () => {
      isMounted = false;
    };
  }, [attemptGetQuestionnaireStatus, universeId]);

  return { currentQuestionnaireState };
};

export default useQuestionnaireFeature;
