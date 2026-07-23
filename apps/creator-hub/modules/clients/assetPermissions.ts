/*
 * NOTE(lucaswang 02-15-2023): Part of the task https://roblox.atlassian.net/browse/DSA-900
 * which introduces a new eslint rule to disallow importing private components from other modules.
 * Should refactor to export private component in the corresponding module's index.ts.
 */
import { AssetPermissionResponseModel } from '@modules/creations';
import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  AssetConsumerAction,
  AssetPermissionsApi,
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
} from '@rbx/clients/assetPermissionsApi';
import { getBEDEV2ServiceBasePath } from './utils';

const basePath = getBEDEV2ServiceBasePath('asset-permissions-api');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const assetPermissionsApi = new AssetPermissionsApi(configuration);

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
    includeAccessStatus: boolean = false,
    returnCountOnly: boolean = false,
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
    assetIds: number[], // Remove with migrateAssetPermissionsParams
    assetsGrantRequests: AssetGrantRequest[],
    enableDeepAccessCheck: boolean,
    subjectType: SubjectType,
    subjectId: string,
    action: AssetConsumerAction,
    migrateAssetPermissionsParams: boolean, // Remove with migrateAssetPermissionsParams
  ) {
    let batchGrantPermissionsRequest;
    if (migrateAssetPermissionsParams) {
      batchGrantPermissionsRequest = {
        requests: assetsGrantRequests,
        enableDeepAccessCheck,
        subjectId,
        subjectType,
        action,
      };
    } else {
      batchGrantPermissionsRequest = {
        assetIds,
        subjectId,
        subjectType,
        action,
      };
    }
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

  async getIsUserEligibleForBeta(userId: number) {
    const response = await assetPermissionsApi.assetPermissionsGetIsUserEligibleForBeta({ userId });
    return response?.isEligible ?? false;
  },

  async getIsGroupEligibleForBeta(groupId: number) {
    const response = await assetPermissionsApi.assetPermissionsGetIsGroupEligibleForBeta({
      groupId,
    });
    return response?.isEligible ?? false;
  },

  async batchGetAssetAccessProperties(requests: GetAssetAccessPropertiesRequest[]) {
    const request: AssetPermissionsBatchGetAssetAccessPropertiesOperationRequest = {
      assetPermissionsBatchGetAssetAccessPropertiesRequest: { requests },
    };
    const response =
      await assetPermissionsApi.assetPermissionsBatchGetAssetAccessProperties(request);
    return response;
  },
};

export default assetPermissionsApiClient;
