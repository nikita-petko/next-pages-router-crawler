import type { ErrorResponse } from '@rbx/clients/priceConfigurationApi/v1';
import type { ResponseError } from '@rbx/clients';

export function isPriceConfigurationApiResponseError(error: Error): error is ResponseError {
  return typeof error === 'object' && error?.name === 'ResponseError';
}

export async function parsePriceConfigurationErrorResponse(
  error: ResponseError,
): Promise<ErrorResponse | undefined> {
  if (error.response) {
    try {
      const errorResponse = await error.response.json();
      return errorResponse;
    } catch (e) {
      // eslint-disable-next-line no-console -- keeping this error for development, should never occur
      console.error('Failed to parse error response:', e);
    }
  }
  return undefined;
}
