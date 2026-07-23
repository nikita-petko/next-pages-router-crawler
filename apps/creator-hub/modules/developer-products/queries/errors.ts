import { DeveloperProductsErrorCodes, ErrorResponse } from '@modules/clients/developerProducts';
import { getResponseFromError } from '@modules/clients/utils';

/**
 * Mapping of Developer Products API error codes to their corresponding translation keys
 */
export const developerProductsErrorToDescription: {
  [key in DeveloperProductsErrorCodes]?: string;
} = {
  [DeveloperProductsErrorCodes.InvalidProductId]: 'Error.InvalidProductId',
  [DeveloperProductsErrorCodes.UnauthorizedProductAccess]: 'Error.UnauthorizedProductAccess',
  [DeveloperProductsErrorCodes.InvalidDeveloperProductId]: 'Error.InvalidDeveloperProductId',
  [DeveloperProductsErrorCodes.DuplicateProductName]: 'Error.DuplicateProductName',
  [DeveloperProductsErrorCodes.InvalidUniverseId]: 'Error.InvalidUniverseId',
  [DeveloperProductsErrorCodes.UnauthorizedUniverseAccess]: 'Error.UnauthorizedUniverseAccess',
  [DeveloperProductsErrorCodes.InvalidShopId]: 'Error.InvalidShopId',
  [DeveloperProductsErrorCodes.UnknownError]: 'Error.UnknownError',
  [DeveloperProductsErrorCodes.InvalidPriceInRobux]: 'Error.InvalidPriceInRobux',
  [DeveloperProductsErrorCodes.InvalidPostBody]: 'Error.InvalidPostBody',
  [DeveloperProductsErrorCodes.UnsupportedDeveloperProductUpdate]:
    'Error.UnsupportedDeveloperProductUpdate',
  [DeveloperProductsErrorCodes.InvalidImageFile]: 'ErrorImageUpload.InvalidImageFile',
};

/**
 * Mapping of Developer Products API image upload error codes to their corresponding translation keys
 */
export const developerProductsImageUploadErrorCodes: Record<string, string> = {
  InternalAssetUploadFailed: 'ErrorImageUpload.InternalAssetUploadFailed',
  InternalAssetUploadTookTooLong: 'ErrorImageUpload.InternalAssetUploadTookTooLong',
};

/**
 * Parse the Developer Products Api Error Response and return corresponding translation key
 * @param error the response exception object
 * @returns the translation key for the error code
 */
export const parseDeveloperProductErrorCode = async (error: unknown) => {
  let errorKey;
  const errorResponse = getResponseFromError(error);
  if (errorResponse) {
    try {
      const errorObject = (await errorResponse.json()) as ErrorResponse;
      errorKey = errorObject.hint
        ? developerProductsImageUploadErrorCodes[`${errorObject.errorCode!}${errorObject.hint}`]
        : developerProductsErrorToDescription[errorObject.errorCode!];
    } catch {
      errorKey = undefined;
    }
  }

  return errorKey;
};
