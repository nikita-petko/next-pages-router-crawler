import { ErrorResponse } from '@rbx/clients/commerceApi';

/**
 * Parse the Commerce Api Error Response and return failure reason
 * @param errorResponse the response exception object
 * @returns the failure reason
 */
const parseCommerceErrorResponse = async (errorResponse: Response | undefined | null) => {
  if (errorResponse) {
    try {
      const errorObject = (await errorResponse.json()) as ErrorResponse;
      return errorObject ?? null;
    } catch {
      return null;
    }
  }
  return null;
};

export default parseCommerceErrorResponse;
