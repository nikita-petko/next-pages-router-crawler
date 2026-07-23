import type { ErrorResponse } from '@modules/clients/passes';
import { GamePassErrorCode } from '@modules/clients/passes';
import { getResponseFromError } from '@modules/clients/utils';

/**
 * Mapping of Game Passes API error codes to their corresponding translation keys
 */
export const gamePassErrorToDescription: {
  [key in GamePassErrorCode]?: string;
} = {
  [GamePassErrorCode.FileTooLarge]: 'Error.FileTooLarge',
};

/**
 * Parse the Game Passes API Error Response and return corresponding translation key
 * @param error the response exception object
 * @returns the translation key for the error code
 */
export const parseGamePassErrorCode = async (error: unknown) => {
  let errorKey;
  const errorResponse = getResponseFromError(error);
  if (errorResponse) {
    try {
      // oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- response.json() is untyped
      const errorObject = (await errorResponse.json()) as ErrorResponse;
      errorKey =
        gamePassErrorToDescription[errorObject.errorCode ?? GamePassErrorCode.InternalError];
    } catch {
      errorKey = undefined;
    }
  }

  return errorKey;
};
