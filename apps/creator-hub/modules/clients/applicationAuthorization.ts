import type {
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
  ApplicationAuthorizationsApiModelsResponseScopesConfigurationResponse as ScopesConfigurationResponse,
  ApplicationRegenerateApplicationSecretRequest,
  ApplicationAuthorizationsApiModelsResponseApplicationSecretResponse as ApplicationSecretResponse,
  RobloxOpenCloudScopeManagementModelsScopeType,
  RobloxOpenCloudScopeManagementModelsOperation,
  ApplicationAuthorizationsApiModelsResponseApplicationManagementMetadataResponse,
  ApplicationAuthorizationsApiModelsResponseTarget as ApplicationOwnerTarget,
  ApplicationCreateApplicationForGroupRequest,
  ApplicationListApplicationsForGroupRequest,
  ApplicationAuthorizationsApiModelsResponseErrorResponse as ApplicationErrorResponse,
  ApplicationPublishApplicationRequest,
  ApplicationAuthorizationsApiModelsResponseApplicationVersionInfo,
  ApplicationCreateApplicationForUserOperationRequest,
  ApplicationUpdateApplicationOperationRequest,
} from '@rbx/client-application-authorizations-api/v1';
import {
  ApplicationApi,
  AuthorizationApi,
  DiscoveryApi,
  ScopeApi,
  RobloxOpenCloudScopeManagementModelsAuthenticationSystem,
  ApplicationAuthorizationsApiModelsEnumErrorCode as ApplicationErrorResponseCode,
} from '@rbx/client-application-authorizations-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export {
  ApplicationAuthorizationsApiModelsEnumTargetType as ApplicationOwnerTargetTypeEnum,
  ApplicationAuthorizationsApiModelsEnumAuthorizationAction as ApplicationAuthorizationActionEnum,
} from '@rbx/client-application-authorizations-api/v1';

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
  ScopesConfigurationResponse,
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

  constructor() {
    const configuration = createClientConfiguration('oauth', 'bedev2');
    this.applicationApi = new ApplicationApi(configuration);
    this.scopeApi = new ScopeApi(configuration);
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

  getScopesConfiguration(): Promise<ScopesConfigurationResponse> {
    return this.scopeApi.scopeGetScopes();
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

const configuration = createClientConfiguration('oauth', 'bedev2');
const authorizationApi = new AuthorizationApi(configuration);
const discoveryApi = new DiscoveryApi(configuration);

export const ApplicationAuthorizationsClient = { authorizationApi, discoveryApi };
