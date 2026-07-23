import { Configuration } from '@rbx/clients-core';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  ApplicationApi,
  AuthorizationApi,
  DiscoveryApi,
  ScopeApi,
  ApplicationAuthorizationsApiModelsPartialScopeInfo,
  ApplicationCreateApplicationForUserRequest,
  ApplicationAuthorizationsApiModelsResponseCreatedApplicationResponse as CreatedApplicationResponse,
  ApplicationDeleteApplicationRequest,
  ApplicationUpdateApplicationRequest,
  ApplicationUploadApplicationImageRequest as UploadImageRequest,
  ApplicationAuthorizationsApiModelsResponseImageResponse as UploadImageResponse,
  ApplicationAuthorizationsApiModelsResponseApplication as ApplicationResponse,
  ApplicationListApplicationsForUserRequest,
  ApplicationAuthorizationsApiModelsResponseApplicationsResponse as ApplicationsResponse,
  ApplicationGetApplicationRequest,
  ApplicationAuthorizationsApiModelsResponseScopeConfigurationResponse as ScopeConfigurationResponse,
  ApplicationRegenerateApplicationSecretRequest,
  ApplicationAuthorizationsApiModelsResponseApplicationSecretResponse as ApplicationSecretResponse,
  RobloxOpenCloudScopeManagementModelsAuthenticationSystem,
  RobloxOpenCloudScopeManagementModelsScopeType,
  RobloxOpenCloudScopeManagementModelsOperation,
  ApplicationAuthorizationsApiModelsResponseApplicationManagementMetadataResponse,
  ApplicationAuthorizationsApiModelsResponseTarget as ApplicationOwnerTarget,
  ApplicationCreateApplicationForGroupRequest,
  ApplicationListApplicationsForGroupRequest,
  ApplicationAuthorizationsApiModelsResponseErrorResponse as ApplicationErrorResponse,
  ApplicationAuthorizationsApiModelsEnumErrorCode as ApplicationErrorResponseCode,
  ApplicationPublishApplicationRequest,
  ApplicationAuthorizationsApiModelsResponseApplicationVersionInfo,
  ApplicationCreateApplicationForUserOperationRequest,
  ApplicationUpdateApplicationOperationRequest,
} from '@rbx/client-application-authorizations-api/v1';
import { getBEDEV2ServiceBasePath } from './utils';

export {
  ApplicationAuthorizationsApiModelsEnumTargetType as ApplicationOwnerTargetTypeEnum,
  ApplicationAuthorizationsApiModelsEnumAuthorizationAction as ApplicationAuthorizationActionEnum,
} from '@rbx/clients/applicationAuthorizationsApi/v1';

export type {
  ApplicationAuthorizationsApiModelsPartialScopeInfo as PartialScopeInfo,
  ApplicationCreateApplicationForUserRequest,
  CreatedApplicationResponse,
  ApplicationDeleteApplicationRequest,
  ApplicationUpdateApplicationRequest,
  ApplicationResponse,
  ApplicationListApplicationsForUserRequest,
  ApplicationsResponse,
  ApplicationGetApplicationRequest,
  ScopeConfigurationResponse,
  ApplicationRegenerateApplicationSecretRequest,
  ApplicationSecretResponse,
  RobloxOpenCloudScopeManagementModelsScopeType as OAuthScopeType,
  RobloxOpenCloudScopeManagementModelsOperation as OAuthOperationModel,
  ApplicationOwnerTarget,
  ApplicationErrorResponse,
  ApplicationPublishApplicationRequest,
  ApplicationAuthorizationsApiModelsResponseApplicationVersionInfo as AppVersionInfo,
};

export enum EApplicationErrorResponseFields {
  PrivacyPolicyUri = 'privacyPolicyUri',
  TermsOfServiceUri = 'termsOfServiceUri',
  Summary = 'summary',
  Name = 'name',
}

export { RobloxOpenCloudScopeManagementModelsAuthenticationSystem, ApplicationErrorResponseCode };

export class ApplicationAuthorizationClient {
  private applicationApi;

  private scopeApi;

  constructor(basePathAuth: string = getBEDEV2ServiceBasePath('oauth')) {
    this.applicationApi = new ApplicationApi(
      new Configuration({
        robloxSiteDomain: process.env.robloxSiteDomain,
        basePath: basePathAuth,
        credentials: 'include',
        unifiedLogger: unifiedLoggerClient,
      }),
    );

    this.scopeApi = new ScopeApi(
      new Configuration({
        robloxSiteDomain: process.env.robloxSiteDomain,
        basePath: basePathAuth,
        credentials: 'include',
        unifiedLogger: unifiedLoggerClient,
      }),
    );
  }

  createApplicationForUser(
    request: ApplicationCreateApplicationForUserOperationRequest,
  ): Promise<CreatedApplicationResponse> {
    return this.applicationApi.applicationCreateApplicationForUser(request);
  }

  createApplicationForGroup(
    request: ApplicationCreateApplicationForGroupRequest,
  ): Promise<CreatedApplicationResponse> {
    return this.applicationApi.applicationCreateApplicationForGroup(request);
  }

  getApplication(request: ApplicationGetApplicationRequest): Promise<ApplicationResponse> {
    return this.applicationApi.applicationGetApplication(request);
  }

  updateApplication(
    request: ApplicationUpdateApplicationOperationRequest,
  ): Promise<ApplicationResponse> {
    return this.applicationApi.applicationUpdateApplication(request);
  }

  uploadApplicationImage(request: UploadImageRequest): Promise<UploadImageResponse> {
    return this.applicationApi.applicationUploadApplicationImage(request);
  }

  deleteApplication(request: ApplicationDeleteApplicationRequest): Promise<void> {
    return this.applicationApi.applicationDeleteApplication(request);
  }

  listApplicationsForUser(
    request: ApplicationListApplicationsForUserRequest,
  ): Promise<ApplicationsResponse> {
    return this.applicationApi.applicationListApplicationsForUser(request);
  }

  listApplicationsForGroup(
    request: ApplicationListApplicationsForGroupRequest,
  ): Promise<ApplicationsResponse> {
    return this.applicationApi.applicationListApplicationsForGroup(request);
  }

  getScopeConfiguration(): Promise<ScopeConfigurationResponse> {
    return this.scopeApi.scopeGetScopeConfiguration();
  }

  regenerateApplicationSecret(
    request: ApplicationRegenerateApplicationSecretRequest,
  ): Promise<ApplicationSecretResponse> {
    return this.applicationApi.applicationRegenerateApplicationSecret(request);
  }

  getMetadataInformation(): Promise<ApplicationAuthorizationsApiModelsResponseApplicationManagementMetadataResponse> {
    return this.applicationApi.applicationGetApplicationManagementMetadata();
  }

  publishApplication(request: ApplicationPublishApplicationRequest): Promise<void> {
    return this.applicationApi.applicationPublishApplication(request);
  }
}

const applicationAuthorizationClient = new ApplicationAuthorizationClient();
export default applicationAuthorizationClient;

const basePath = getBEDEV2ServiceBasePath('oauth');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});
const authorizationApi = new AuthorizationApi(configuration);
const discoveryApi = new DiscoveryApi(configuration);

export const ApplicationAuthorizationsClient = { authorizationApi, discoveryApi };
