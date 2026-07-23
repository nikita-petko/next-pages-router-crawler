import type { ErrorResponse } from '@rbx/client-developer-subscriptions-api/v1';
import experienceSubscriptionsFailureReasonToDescription from '../constants/ExperienceSubscriptionErrorDescription';

export type ParsedExperienceSubscriptionError = {
  errorKey: string;
  errorObject?: ErrorResponse;
};

const parseExperienceSubscriptionErrorCode = async (
  errorResponse: Response | undefined | null,
): Promise<ParsedExperienceSubscriptionError> => {
  let errorKey = 'Error.SubscriptionError';
  let errorObject: ErrorResponse | undefined;

  if (errorResponse) {
    try {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- response.json() returns unknown; ErrorResponse shape is validated by usage below
      errorObject = (await errorResponse.json()) as ErrorResponse;
      errorKey =
        experienceSubscriptionsFailureReasonToDescription[errorObject.failureReason ?? 0] ??
        'Error.SubscriptionError';
    } catch {
      errorKey = 'Error.SubscriptionError';
    }
  }

  return { errorKey, errorObject };
};

export default parseExperienceSubscriptionErrorCode;
