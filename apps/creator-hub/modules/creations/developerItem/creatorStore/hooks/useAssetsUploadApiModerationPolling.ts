import { useCallback } from 'react';
import { ModerationState } from '@rbx/client-assets-upload-api/v1';
import { useTranslation } from '@rbx/intl';
import assetsUploadApiClient, { FieldMask } from '@modules/clients/assetsupload';

const MODERATION_RESULT_FIELD_MASK_ARRAY = [FieldMask.MODERATION_RESULT];
const MODERATION_POLLING_MAX_RETRIES = 5; // Do not poll for more than 5 seconds.
const MODERATION_POLLING_INTERVAL_SECONDS = 1;

export interface AssetsUploadApiModerationPollingContext {
  pollForAssetModerationApproval: (assetId: number) => Promise<void>;
}

export const getAssetModerationState = async (assetId: number): Promise<ModerationState> => {
  const assetDetails = await assetsUploadApiClient.getAsset(
    assetId,
    MODERATION_RESULT_FIELD_MASK_ARRAY,
  );

  return assetDetails.moderationResult?.moderationState ?? ModerationState.Unspecified;
};

const useAssetsUploadApiModerationPolling = (
  maxRetries: number = MODERATION_POLLING_MAX_RETRIES,
  intervalSeconds: number = MODERATION_POLLING_INTERVAL_SECONDS,
): AssetsUploadApiModerationPollingContext => {
  const { translate } = useTranslation();

  const pollForAssetModerationApproval = useCallback(
    async (assetId: number) => {
      let currentAttempt = 0;

      while (true) {
        const moderationState = await getAssetModerationState(assetId);

        if (moderationState === ModerationState.Approved) {
          return;
        }

        if (moderationState === ModerationState.Rejected) {
          throw new Error(translate('Message.ImageModerated'));
        }

        // We continue here since it shouldn't be breaking behavior if the moderation hasn't finished
        if (currentAttempt > maxRetries) {
          return;
        }

        await new Promise<void>((resolve) => {
          setTimeout(resolve, 1000 * intervalSeconds);
        });
        currentAttempt += 1;
      }
    },
    [intervalSeconds, maxRetries, translate],
  );

  return {
    pollForAssetModerationApproval,
  };
};

export default useAssetsUploadApiModerationPolling;
