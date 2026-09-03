import type { Operation } from '@rbx/client-assets-upload-api/v1';

/**
 * TODO STM-8914: Runtime operation responses include metadata.errors, but the assets-api
 * swagger (and @rbx/client-assets-upload-api Operation type) omit metadata today.
 * Delete this type and use Operation from the client package once metadata is added
 * to the swagger and a new client is published.
 */
type OperationMetadataError = {
  fieldMask?: {
    paths?: string[];
  };
  error?: {
    code?: string;
    message?: string;
  };
};

/**
 * TODO STM-8914: Extends the generated Operation type with undocumented metadata fields.
 * Replace with Operation once @rbx/client-assets-upload-api includes metadata.
 */
export type AssetsUploadOperationWithMetadata = Operation & {
  metadata?: {
    errors?: OperationMetadataError[];
    progress?: number;
  };
};

/**
 * Compiles and fetches the error messages from the metadata object.
 * If no metadata errors exist, return the error object message.
 * If both are missing, return the fallback message.
 */
export function getAssetsUploadOperationErrorMessage(
  operation: AssetsUploadOperationWithMetadata | undefined,
  fallback: string,
): string {
  const metadataErrors = operation?.metadata?.errors;
  if (!Array.isArray(metadataErrors)) {
    return operation?.error?.message ?? fallback;
  }

  const messages = metadataErrors
    .map((entry) => entry.error?.message)
    .filter((message): message is string => Boolean(message));

  if (messages.length > 0) {
    return messages.join(', ');
  }

  return operation?.error?.message ?? fallback;
}
