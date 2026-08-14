import type {
  AssetConsumerAction,
  AssetPermissionsGrantAssetPermissionsRequest,
  AssetPermissionsRevokeAssetPermissionsOperationRequest,
  AssetPermissionsListUniverseAssetPermissionsRequest,
  BatchCheckAssetPermissionsRequest,
  CheckAssetPermissionResult,
  SubjectActionRequest,
  SubjectType,
  AssetPermissionsUpdateUserSettingsOperationRequest,
  AssetPermissionsGetUserSettingsRequest,
  AssetPermissionsUpdateUserSettingsRequest,
  AssetPermissionsGetGroupSettingsRequest,
  AssetPermissionsUpdateGroupSettingsRequest,
  AssetGrantRequest,
  GetAssetAccessPropertiesRequest,
  AssetPermissionsBatchGetAssetAccessPropertiesOperationRequest,
  AssetPermissionsGetAssetDependenciesRequest,
  AssetPermissionRequestStatus,
  AssetPermissionRequestResponse,
  ListAssetPermissionRequestsResponse,
  AssetPermissionRequestActionResponse,
} from '@rbx/client-asset-permissions-api/v1';
import {
  AssetPermissionsApi,
  AssetPermissionRequestsApi,
} from '@rbx/client-asset-permissions-api/v1';
/*
 * NOTE(lucaswang 02-15-2023): Part of the task https://roblox.atlassian.net/browse/DSA-900
 * which introduces a new eslint rule to disallow importing private components from other modules.
 * Should refactor to export private component in the corresponding module's index.ts.
 */
import type { AssetPermissionResponseModel } from '@modules/creations/developerItem/common/types';
import { createClientConfiguration } from './utils/createClientConfiguration';

const configuration = createClientConfiguration('asset-permissions-api', 'bedev2');

const assetPermissionsApi = new AssetPermissionsApi(configuration);
const assetPermissionRequestsApi = new AssetPermissionRequestsApi(configuration);

// Asset access request types come from the generated client (@rbx/client-asset-permissions-api).
// `AssetPermissionRequest` is the app-facing alias for the generated per-item response type.
// As of client v1.3.3 requestId is a string (int64, string-serialized to avoid JS precision loss)
// and the response no longer carries requesterName — names are resolved via the users/groups APIs.
export type {
  AssetPermissionRequestResponse,
  ListAssetPermissionRequestsResponse,
  AssetPermissionRequestActionResponse,
  AssetPermissionRequestStatus,
};
export type AssetPermissionRequest = AssetPermissionRequestResponse;

const assetPermissionsApiClient = {
  async batchCheckAssetPermissions(
    assetPermissionChecks: {
      assetId: number;
      subject: SubjectType;
      subjectId: string;
      permissionType: AssetConsumerAction;
    }[],
  ): Promise<CheckAssetPermissionResult[] | null | undefined> {
    const request: BatchCheckAssetPermissionsRequest = {
      requests: assetPermissionChecks.map((value) => {
        return {
          action: value.permissionType,
          assetId: value.assetId,
          subject: {
            subjectId: value.subjectId,
            subjectType: value.subject,
          },
        };
      }),
    };
    return (
      await assetPermissionsApi.assetPermissionsBatchCheckAssetPermissions({
        assetPermissionsBatchCheckAssetPermissionsRequest: request,
      })
    ).results;
  },

  async getAssetDependencies(
    assetId: number,
    includeAccessStatus = false,
    returnCountOnly = false,
  ) {
    const request: AssetPermissionsGetAssetDependenciesRequest = {
      assetId,
      includeAccessStatus,
      returnCountOnly,
    };
    const response = await assetPermissionsApi.assetPermissionsGetAssetDependencies(request);
    return response;
  },

  async getAssetEligibilityStatus(assetId: number) {
    const response = await assetPermissionsApi.assetPermissionsGetActionGatingStatus({ assetId });
    return response;
  },

  async getAssetPermissions(assetId: number) {
    const response = await assetPermissionsApi.assetPermissionsGetAssetPermissions({ assetId });
    // oxlint-disable-next-line no-unsafe-type-assertion -- results type is compatible but broader
    return response.results as AssetPermissionResponseModel[];
  },

  grantAssetPermissions(
    assetId: number,
    subjectActionsRequest?: SubjectActionRequest[],
    grantToDependencies?: boolean,
    parentVersionNumber?: number,
    enableDeepAccessCheck?: boolean,
  ) {
    const request: AssetPermissionsGrantAssetPermissionsRequest = { assetId };
    if (subjectActionsRequest) {
      request.assetPermissionsRevokeAssetPermissionsRequest = {
        requests: subjectActionsRequest,
        grantToDependencies,
        parentVersionNumber,
        enableDeepAccessCheck,
      };
    }

    return assetPermissionsApi.assetPermissionsGrantAssetPermissions(request);
  },

  listUniverseAssetPermissions(universeId: number, maxPageSize: number, pageToken?: string) {
    const request: AssetPermissionsListUniverseAssetPermissionsRequest = {
      universeId,
      maxPageSize,
      pageToken,
    };
    return assetPermissionsApi.assetPermissionsListUniverseAssetPermissions(request);
  },

  batchGrantAssetPermissions(
    assetsGrantRequests: AssetGrantRequest[],
    enableDeepAccessCheck: boolean,
    subjectType: SubjectType,
    subjectId: string,
    action: AssetConsumerAction,
  ) {
    const batchGrantPermissionsRequest = {
      requests: assetsGrantRequests,
      enableDeepAccessCheck,
      subjectId,
      subjectType,
      action,
    };
    const request = { assetPermissionsBatchGrantPermissionsRequest: batchGrantPermissionsRequest };
    return assetPermissionsApi.assetPermissionsBatchGrantPermissions(request);
  },

  revokeAssetPermissions(assetId: number, subjectActionsRequest?: SubjectActionRequest[]) {
    const request: AssetPermissionsRevokeAssetPermissionsOperationRequest = { assetId };
    if (subjectActionsRequest) {
      request.assetPermissionsRevokeAssetPermissionsRequest = { requests: subjectActionsRequest };
    }

    return assetPermissionsApi.assetPermissionsRevokeAssetPermissions(request);
  },

  async getUserPermissionSettings(userId: number) {
    const request: AssetPermissionsGetUserSettingsRequest = {
      userId,
    };
    const response = await assetPermissionsApi.assetPermissionsGetUserSettings(request);
    return response;
  },

  async getGroupPermissionSettings(groupId: number) {
    const request: AssetPermissionsGetGroupSettingsRequest = {
      groupId,
    };
    const response = await assetPermissionsApi.assetPermissionsGetGroupSettings(request);
    return response;
  },

  async updateUserPermissionSettings(
    userId: number,
    assetPermissionsUpdateUserSettingsRequest: AssetPermissionsUpdateUserSettingsRequest,
  ) {
    const request: AssetPermissionsUpdateUserSettingsOperationRequest = {
      userId,
      assetPermissionsUpdateUserSettingsRequest,
    };
    return assetPermissionsApi.assetPermissionsUpdateUserSettings(request);
  },

  async updateGroupPermissionSettings(
    groupId: number,
    assetPermissionsUpdateUserSettingsRequest: AssetPermissionsUpdateUserSettingsRequest,
  ) {
    const request: AssetPermissionsUpdateGroupSettingsRequest = {
      groupId,
      assetPermissionsUpdateUserSettingsRequest,
    };
    return assetPermissionsApi.assetPermissionsUpdateGroupSettings(request);
  },

  async batchGetAssetAccessProperties(requests: GetAssetAccessPropertiesRequest[]) {
    const request: AssetPermissionsBatchGetAssetAccessPropertiesOperationRequest = {
      assetPermissionsBatchGetAssetAccessPropertiesRequest: { requests },
    };
    const response =
      await assetPermissionsApi.assetPermissionsBatchGetAssetAccessProperties(request);
    return response;
  },

  // ── Asset access requests ────────────────────────────────────────────────
  listOwnerAssetPermissionRequests(
    params: {
      status?: AssetPermissionRequestStatus;
      assetId?: number;
      limit?: number;
      cursor?: string;
    } = {},
  ) {
    return assetPermissionRequestsApi.assetPermissionRequestsListOwnerAssetPermissionRequests(
      params,
    );
  },

  listRequesterAssetPermissionRequests(
    params: {
      status?: AssetPermissionRequestStatus;
      limit?: number;
      cursor?: string;
    } = {},
  ) {
    return assetPermissionRequestsApi.assetPermissionRequestsListRequesterAssetPermissionRequests(
      params,
    );
  },

  approveAssetPermissionRequest(requestId: string) {
    return assetPermissionRequestsApi.assetPermissionRequestsApproveAssetPermissionRequest({
      requestId,
    });
  },

  rejectAssetPermissionRequest(requestId: string) {
    return assetPermissionRequestsApi.assetPermissionRequestsRejectAssetPermissionRequest({
      requestId,
    });
  },
};

export default assetPermissionsApiClient;
