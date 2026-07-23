import { ErrorResponse } from '@rbx/clients/developerSubscriptionsApi';
import experienceSubscriptionsFailureReasonToDescription from '../constants/ExperienceSubscriptionErrorDescription';
import { isExperienceSubscriptionVerbatimErrorMessage } from '../constants/experienceSubscriptionVerbatimErrorMessages';

export type ParsedExperienceSubscriptionError = {
  errorKey: string;
  serverErrorMessage?: string | null;
  errorObject?: ErrorResponse;
};

/**
 * Parse the Developer Subscription API error response: translation key, optional verbatim
 * server message (only for allowlisted `errorMessage` strings), and parsed body for callers.
 */
const parseExperienceSubscriptionErrorCode = async (
  errorResponse: Response | undefined | null,
): Promise<ParsedExperienceSubscriptionError> => {
  let errorKey = 'Error.SubscriptionError';
  let serverErrorMessage: string | null | undefined;
  let errorObject: ErrorResponse | undefined;

  if (errorResponse) {
    try {
      errorObject = (await errorResponse.json()) as ErrorResponse;
      if (isExperienceSubscriptionVerbatimErrorMessage(errorObject.errorMessage)) {
        serverErrorMessage = errorObject.errorMessage?.trim() ?? null;
      }
      errorKey =
        experienceSubscriptionsFailureReasonToDescription[errorObject.failureReason ?? 0] ??
        'Error.SubscriptionError';
    } catch {
      errorKey = 'Error.SubscriptionError';
    }
  }

  return { errorKey, serverErrorMessage, errorObject };
};

export default parseExperienceSubscriptionErrorCode;
