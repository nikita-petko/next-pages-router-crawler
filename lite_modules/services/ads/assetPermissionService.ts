/* eslint-disable import/prefer-default-export */
import {
  ApiPermissionStatus,
  AssetConsumerAction,
  SubjectType,
} from '@rbx/client-asset-permissions-api/v1';

import { assetPermissionsClient } from '@clients/assetPermissions';

/**
 * Returns true only when the authenticated `userId` has USE permission on
 * every asset in `assetIds`.
 *
 * This mirrors exactly what ads-management-api's generate flow enforces in
 * `resolveUserReferenceImages`: it checks `ASSET_CONSUMER_ACTION_USE` against
 * `SUBJECT_TYPE_USER` for the authenticated user (never the group), and only
 * treats `ALLOWED`/`HasPermission` as passing. Running the same check up front
 * lets the reference picker fail fast with an ownership error instead of
 * letting the user stage an asset that a later generate call would 403 on.
 *
 * The check is fail-closed: an incomplete result set, a per-asset error, or any
 * status other than `HasPermission` all resolve to `false`.
 */
export const hasUsePermissionForAssets = async (
  userId: number,
  assetIds: number[],
): Promise<boolean> => {
  if (assetIds.length === 0) {
    return true;
  }

  const response = await assetPermissionsClient.assetPermissionsBatchCheckAssetPermissions({
    assetPermissionsBatchCheckAssetPermissionsRequest: {
      requests: assetIds.map((assetId) => ({
        action: AssetConsumerAction.Use,
        assetId,
        subject: {
          subjectId: String(userId),
          subjectType: SubjectType.User,
        },
      })),
    },
  });

  const results = response.results ?? [];
  if (results.length !== assetIds.length) {
    return false;
  }

  return results.every(
    (result) => result.error == null && result.value?.status === ApiPermissionStatus.HasPermission,
  );
};
