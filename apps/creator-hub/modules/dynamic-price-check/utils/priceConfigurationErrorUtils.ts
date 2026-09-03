import type { ErrorResponse } from '@rbx/client-price-configuration-api/v1';
import type { ResponseError } from '@rbx/clients-core';

export function isPriceConfigurationApiResponseError(error: Error): error is ResponseError {
  return typeof error === 'object' && error?.name === 'ResponseError';
}

export async function parsePriceConfigurationErrorResponse(
  error: ResponseError,
): Promise<ErrorResponse | undefined> {
  if (error.response) {
    try {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- response.json() is untyped
      return (await error.response.json()) as ErrorResponse;
    } catch (e) {
      console.error('Failed to parse error response:', e);
    }
  }
  return undefined;
}
