import { StatusCodes } from '@rbx/core';
import { EligibilityType } from '@modules/clients/experienceQuestionnaire';
import { getResponseFromError } from '@modules/clients/utils';
import useQuestionnaireErrorToast from '@modules/questionnaire/hooks/useQuestionnaireErrorToast';
import { useUniverseEligibility } from '@modules/questionnaire/utils/queries';
import QuestionnaireState from '../constants/questionnaireState';

// Not memoised: the result is a numeric enum member, compared by value, so there is nothing to
// stabilise.
const resolveQuestionnaireState = (
  isPending: boolean,
  error: unknown,
  eligibility: EligibilityType | undefined,
): QuestionnaireState => {
  if (error != null) {
    return getResponseFromError(error)?.status === StatusCodes.FORBIDDEN
      ? QuestionnaireState.Forbidden
      : QuestionnaireState.Disabled;
  }

  if (isPending) {
    return QuestionnaireState.Loading;
  }

  return eligibility && eligibility !== EligibilityType.None
    ? QuestionnaireState.Enabled
    : QuestionnaireState.NotEligible;
};

/**
 * Resolves eligibility only. The per-user `getQuestionnaireStatus` check belongs to
 * `ExperienceQuestionnaireContainer`, which runs it alongside this hook.
 */
const useQuestionnaireFeature = (universeId?: number) => {
  // `NaN` (an unready route) and `0` are not requestable; `undefined` holds the page loading.
  const validUniverseId = universeId != null && universeId > 0 ? universeId : undefined;
  const { data, error, isPending } = useUniverseEligibility(validUniverseId);

  useQuestionnaireErrorToast(error);

  return {
    currentQuestionnaireState: resolveQuestionnaireState(isPending, error, data?.eligibility),
  };
};

export default useQuestionnaireFeature;
