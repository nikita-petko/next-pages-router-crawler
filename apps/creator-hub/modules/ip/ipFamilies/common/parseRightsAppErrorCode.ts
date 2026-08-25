import type { ErrorResponseAppErrorCodeEnum } from '@rbx/client-rights/v1';
import { ErrorResponseFromJSON } from '@rbx/client-rights/v1';
import { getResponseFromError } from '@modules/clients/utils';

/**
 * Parses the backend app_error_code from a failed rights API call. Returns undefined when the
 * error is not a parseable rights ErrorResponse.
 */
const parseRightsAppErrorCode = async (
  error: unknown,
): Promise<ErrorResponseAppErrorCodeEnum | undefined> => {
  const response = getResponseFromError(error);
  if (!response) {
    return undefined;
  }
  try {
    const { appErrorCode } = ErrorResponseFromJSON(await response.clone().json());
    return appErrorCode;
  } catch {
    return undefined;
  }
};

export default parseRightsAppErrorCode;
