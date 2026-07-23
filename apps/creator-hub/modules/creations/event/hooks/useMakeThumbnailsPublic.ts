import { useCallback } from 'react';
import { AssetConsumerAction, SubjectType } from '@rbx/client-asset-permissions-api/v1';
import type { EventMedia } from '@rbx/client-virtual-events-api/v1';
import { useTranslation } from '@rbx/intl';
import assetPermissionsApiClient from '@modules/clients/assetPermissions';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';

const useMakeThumbnailsPublic = () => {
  const { translate } = useTranslation();
  const failedUploadMessage = translate('Error.EEFailedToUploadThumbnail');
  const { settings } = useSettings(); // Remove with migrateAssetPermissionsParams

  return useCallback(
    async (rankedThumbnails: EventMedia[]) => {
      try {
        const thumbnailIds: number[] = [];
        rankedThumbnails.forEach((thumbnail) => {
          if (!thumbnail.mediaId) {
            throw new Error(failedUploadMessage);
          } else {
            thumbnailIds.push(thumbnail.mediaId);
          }
        });
        // For thumbnails, we shouldn't need to grant permissions to dependencies.
        const assetGrantRequests = thumbnailIds.map((assetId) => {
          return {
            assetId,
            grantToDependencies: false,
          };
        });
        // Mimicking previous behavior here, Creators should have direct access to the thumbnail they're calling this API for.
        const enableDeepAccessCheck = false;

        const response = await assetPermissionsApiClient.batchGrantAssetPermissions(
          thumbnailIds,
          assetGrantRequests,
          enableDeepAccessCheck,
          SubjectType.All,
          '',
          AssetConsumerAction.Use,
          settings.migrateAssetPermissionsParams ?? false,
        );
        if (response.errors?.length) {
          throw new Error(failedUploadMessage);
        }
      } catch (e) {
        const parsedError = await tryParseResponseError(e);
        const message = parsedError?.message ?? failedUploadMessage;
        throw new Error(message, { cause: e });
      }
    },
    [failedUploadMessage, settings.migrateAssetPermissionsParams],
  );
};

export default useMakeThumbnailsPublic;
