import type {
  ScopeInfo,
  V1ApiKeyCloudAuthIdGetRequest,
  V1ApiKeyPostRequest,
  V1ApiKeyCloudAuthIdDeleteRequest,
  V1ApiKeyCloudAuthIdRegeneratePostRequest,
  V1ApiKeyPatchRequest,
  V1ApiKeysPostRequest,
  V1ScopesGetRequest,
  V1CanUseApiKeysPostRequest,
} from '@rbx/client-cloud-authentication-service/v1';
import {
  RobloxOpencloudCloudauthenticationserviceV1CloudAuthenticationServiceAPIApi as CloudAuthServiceApi,
  RobloxOpencloudCloudauthenticationserviceV1beta1CloudAuthenticationServiceAPIApi as CloudAuthServiceBetaApi,
  CloudAuthBadStatus,
} from '@rbx/client-cloud-authentication-service/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type {
  CreateApiKeyResponse,
  GetApiKeyResponse,
  GetScopesResponse,
  DeleteApiKeyResponse,
  RegenerateApiKeyResponse,
  UpdateApiKeyResponse,
  ListApiKeysResponse,
  CanUseApiKeysResponse,
  RobloxOpencloudScopeconfigurationV2Scope as Scope,
  RobloxOpencloudScopeconfigurationV2ScopeType as ScopeType,
  RobloxOpencloudScopeconfigurationV2TargetPart as TargetPart,
  RobloxOpencloudScopeconfigurationV2TargetType as TargetType,
  RobloxOpencloudScopeconfigurationV2Operation as Operation,
  RobloxOpencloudScopeconfigurationV2Product as Product,
  RobloxOpencloudScopeconfigurationV2RiskLevel as RiskLevel,
  CloudAuthInfo,
  ScopeInfo,
} from '@rbx/client-cloud-authentication-service/v1';

export { CloudAuthBadStatus };

export enum ListApiKeySortOrder {
  Asc = 'Asc',
  Desc = 'Desc',
}

export class CloudAuthenticationClient {
  private cloudAuthApi: CloudAuthServiceApi;

  private cloudAuthBetaApi: CloudAuthServiceBetaApi;

  constructor() {
    const configuration = createClientConfiguration('cloud-authentication', 'bedev2');

    this.cloudAuthApi = new CloudAuthServiceApi(configuration);
    this.cloudAuthBetaApi = new CloudAuthServiceBetaApi(configuration);
  }

  canUseApiKeys(groupId?: number) {
    const request: V1CanUseApiKeysPostRequest = {
      canUseApiKeysRequest: {
        groupId,
      },
    };
    return this.cloudAuthBetaApi.v1CanUseApiKeysPost(request);
  }

  getScopes(groupId?: number) {
    const request: V1ScopesGetRequest = {
      groupId,
    };
    return this.cloudAuthApi.v1ScopesGet(request);
  }

  getApiKeyById(cloudAuthId: string) {
    const request: V1ApiKeyCloudAuthIdGetRequest = {
      cloudAuthId,
    };
    return this.cloudAuthApi.v1ApiKeyCloudAuthIdGet(request);
  }

  createApiKey(
    name?: string,
    description?: string,
    isEnabled?: boolean,
    expirationTime?: string,
    groupId?: number,
    allowedCidrs?: Array<string>,
    scopes?: Array<ScopeInfo>,
  ) {
    const request: V1ApiKeyPostRequest = {
      createApiKeyRequest: {
        cloudAuthUserConfiguredProperties: {
          name,
          description,
          isEnabled,
          expirationTime,
          allowedCidrs,
          scopes,
        },
        groupId,
      },
    };
    return this.cloudAuthApi.v1ApiKeyPost(request);
  }

  deleteApiKeyById(cloudAuthId: string) {
    const request: V1ApiKeyCloudAuthIdDeleteRequest = {
      cloudAuthId,
    };
    return this.cloudAuthApi.v1ApiKeyCloudAuthIdDelete(request);
  }

  regenerateApiKeyById(cloudAuthId: string) {
    const request: V1ApiKeyCloudAuthIdRegeneratePostRequest = {
      cloudAuthId,
    };
    return this.cloudAuthApi.v1ApiKeyCloudAuthIdRegeneratePost(request);
  }

  updateApiKey(
    cloudAuthId?: string,
    name?: string,
    description?: string,
    isEnabled?: boolean,
    expirationTime?: string,
    allowedCidrs?: Array<string>,
    scopes?: Array<ScopeInfo>,
  ) {
    const request: V1ApiKeyPatchRequest = {
      updateApiKeyRequest: {
        cloudAuthId,
        cloudAuthUserConfiguredProperties: {
          name,
          description,
          isEnabled,
          expirationTime,
          allowedCidrs,
          scopes,
        },
      },
    };
    return this.cloudAuthApi.v1ApiKeyPatch(request);
  }

  getApiKeys(
    cursor?: string,
    limit?: number,
    sortOrder?: keyof typeof ListApiKeySortOrder,
    groupId?: number,
  ) {
    const reverse = sortOrder === ListApiKeySortOrder.Asc;

    const request: V1ApiKeysPostRequest = {
      listApiKeysRequest: {
        cursor,
        limit,
        reverse,
        groupId,
      },
    };
    return this.cloudAuthApi.v1ApiKeysPost(request);
  }
}

const cloudAuthenticationClient = new CloudAuthenticationClient();
export default cloudAuthenticationClient;
