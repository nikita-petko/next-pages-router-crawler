import {
  ErrorCode,
  instanceOfBatchUpdateShopItemsErrorResponse,
  type BatchUpdateShopItemsErrorResponse,
} from '@rbx/client-shops-api/v1';
import { getResponseFromError } from '@modules/clients/utils';

const PUBLISH_FAILED = 'Message.SaveFailed';
const PUBLISH_PERMISSION_DENIED = 'Message.PublishPermissionDenied';
const PUBLISH_MODERATED_TEXT = 'Message.PublishModeratedText';

function isBatchUpdateShopItemsError(body: unknown): body is BatchUpdateShopItemsErrorResponse {
  return (
    typeof body === 'object' && body !== null && instanceOfBatchUpdateShopItemsErrorResponse(body)
  );
}

/**
 * Maps a `BatchUpdateShopItemsErrorResponse` to a translation key.
 * Distinct messages for moderated category names (422 + `ModeratedText`) and
 * permission denial (403); everything else falls back to a generic message.
 */
export async function getPublishErrorMessageKey(error: unknown): Promise<string> {
  const response = getResponseFromError(error);
  const status = response?.status;

  if (status === 403) {
    return PUBLISH_PERMISSION_DENIED;
  }

  if (status === 422 && response) {
    try {
      const body: unknown = await response.clone().json();
      if (isBatchUpdateShopItemsError(body) && body.errorCode === ErrorCode.ModeratedText) {
        return PUBLISH_MODERATED_TEXT;
      }
    } catch {
      // Fall through to the generic message when the body can't be parsed.
    }
  }

  return PUBLISH_FAILED;
}
