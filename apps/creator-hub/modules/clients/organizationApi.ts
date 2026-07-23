import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  OrganizationApi,
  InvitationApi,
  RoleApi,
  UserApi,
  GroupUniversePayoutApi,
  Organization as OrganizationResponseModel,
  PermissionsResponseModel,
  RoleMetadata as RoleMetadataModel,
  RoleColorType,
  Member as MemberModel,
  Invitation as InvitationModel,
  InvitationStatusType,
  AllInvitationsResponseModel,
  SuccessResponse,
  UpdateInvitationRequestModel,
  CreateInvitationRequestModel,
  AllRolesResponseModel,
  CreateOrUpdateRoleRequestModel,
  AllUsersResponseModel,
  V1OrganizationsOrganizationIdPayoutsUniverseIdGetRequest,
  AllGroupUniversePayoutsResponseModel,
  V1OrganizationsOrganizationIdPayoutsUniverseIdPatchRequest,
  V1OrganizationsOrganizationIdPayoutsUniversesGetRequest,
  V1OrganizationsOrganizationIdPayoutsLatestGetRequest,
  UpdateRolePositionRequestModel,
  RoleIdsResponseModel,
} from '@rbx/clients/organizationsServiceApi';
import { getBEDEV2ServiceBasePath } from './utils';
import SecureRedirectMiddleware from './utils/SecureRedirectMiddleware';

const basePath = getBEDEV2ServiceBasePath('orgs');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
  middleware: [new SecureRedirectMiddleware()],
});

const organizationApi = new OrganizationApi(configuration);
const invitationApi = new InvitationApi(configuration);
const roleApi = new RoleApi(configuration);
const userApi = new UserApi(configuration);
const groupUniversePayoutApi = new GroupUniversePayoutApi(configuration);

export type OrganizationPermissions = PermissionsResponseModel;
export type Organization = OrganizationResponseModel;
export type RoleMetadata = RoleMetadataModel;
export type Member = MemberModel;
export type Invitation = InvitationModel;
export type GetUniversePayoutsRequest = V1OrganizationsOrganizationIdPayoutsUniverseIdGetRequest;
export type UniversePayouts = AllGroupUniversePayoutsResponseModel;
export type UpdateUniversePayoutsRequest =
  V1OrganizationsOrganizationIdPayoutsUniverseIdPatchRequest;
export type FindUniversePayoutsRequest = V1OrganizationsOrganizationIdPayoutsUniversesGetRequest;
export type GetLatestOneTimePayoutForUsersRequest =
  V1OrganizationsOrganizationIdPayoutsLatestGetRequest;

// eslint-disable-next-line no-barrel-files/no-barrel-files -- pre-existing re-exports used by 5+ consumers; refactor tracked separately
export { RoleColorType, InvitationStatusType };

const organizationClient = {
  getOrganization: async (groupId: string): Promise<Organization> => {
    return organizationApi.v1OrganizationsGet({
      groupId,
    });
  },
};

const invitationClient = {
  createInvitation: async (
    organizationId: string,
    request: CreateInvitationRequestModel,
  ): Promise<Invitation> => {
    return invitationApi.v1OrganizationsOrganizationIdInvitationsPost({
      organizationId,
      createInvitationRequestModel: request,
    });
  },
  getInvitationsByOrganizationId: async (
    organizationId: string,
    pageToken?: string,
    maxPageSize?: number,
  ): Promise<AllInvitationsResponseModel> => {
    return invitationApi.v1OrganizationsOrganizationIdInvitationsGet({
      organizationId,
      pageToken,
      maxPageSize,
    });
  },
  getInvitation: async (organizationId: string, invitationId: string): Promise<Invitation> => {
    return invitationApi.v1OrganizationsOrganizationIdInvitationsInvitationIdGet({
      organizationId,
      invitationId,
    });
  },
  acceptOrDeclineInvitation: async (
    organizationId: string,
    invitationId: string,
    request: UpdateInvitationRequestModel,
  ): Promise<SuccessResponse> => {
    return invitationApi.v1OrganizationsOrganizationIdInvitationsInvitationIdPatch({
      organizationId,
      invitationId,
      updateInvitationRequestModel: request,
    });
  },
  deleteInvitationById: async (
    organizationId: string,
    invitationId: string,
  ): Promise<SuccessResponse> => {
    return invitationApi.v1OrganizationsOrganizationIdInvitationsInvitationIdDelete({
      organizationId,
      invitationId,
    });
  },
  getRoleIdsByInvitationId: async (
    organizationId: string,
    invitationId: string,
  ): Promise<RoleIdsResponseModel> => {
    return invitationApi.v1OrganizationsOrganizationIdInvitationsInvitationIdRoleIdsGet({
      organizationId,
      invitationId,
    });
  },
};

const roleClient = {
  createRole: async (
    organizationId: string,
    request: CreateOrUpdateRoleRequestModel,
  ): Promise<RoleMetadata> => {
    return roleApi.v1OrganizationsOrganizationIdRolesPost({
      organizationId,
      createOrUpdateRoleRequestModel: request,
    });
  },
  getRoleMetadata: async (
    organizationId: string,
    roleId: string,
    isDefault?: boolean,
  ): Promise<RoleMetadata> => {
    return roleApi.v1OrganizationsOrganizationIdRolesRoleIdMetadataGet({
      organizationId,
      roleId,
      isDefault,
    });
  },
  updateRoleMetadata: async (
    organizationId: string,
    roleId: string,
    request: CreateOrUpdateRoleRequestModel,
  ): Promise<RoleMetadata> => {
    return roleApi.v1OrganizationsOrganizationIdRolesRoleIdMetadataPatch({
      organizationId,
      roleId,
      createOrUpdateRoleRequestModel: request,
    });
  },
  updateRolePosition: async (
    organizationId: string,
    roleId: string,
    request: UpdateRolePositionRequestModel,
  ): Promise<SuccessResponse> => {
    return roleApi.v1OrganizationsOrganizationIdRolesRoleIdPositionPatch({
      organizationId,
      roleId,
      updateRolePositionRequestModel: request,
    });
  },
  getRolesByOrganization: async (
    organizationId: string,
    pageToken?: string,
    maxPageSize?: number,
  ): Promise<AllRolesResponseModel> => {
    return roleApi.v1OrganizationsOrganizationIdRolesGet({
      organizationId,
      pageToken,
      maxPageSize,
    });
  },
  getUsersWithRole: async (
    organizationId: string,
    roleId: string,
    pageToken?: string,
    maxPageSize?: number,
    isDefault?: boolean,
  ): Promise<AllUsersResponseModel> => {
    return roleApi.v1OrganizationsOrganizationIdRolesRoleIdUsersGet({
      organizationId,
      roleId,
      pageToken,
      maxPageSize,
      isDefault,
    });
  },
  deleteRole: async (organizationId: string, roleId: string): Promise<SuccessResponse> => {
    return roleApi.v1OrganizationsOrganizationIdRolesRoleIdDelete({
      organizationId,
      roleId,
    });
  },
  getInvitationsWithRole: async (
    organizationId: string,
    roleId: string,
    pageToken?: string,
    maxPageSize?: number,
  ): Promise<AllInvitationsResponseModel> => {
    return roleApi.v1OrganizationsOrganizationIdRolesRoleIdInvitationsGet({
      organizationId,
      roleId,
      pageToken,
      maxPageSize,
    });
  },
};

const userClient = {
  getUsersByOrganization: async (
    organizationId: string,
    pageToken?: string,
    maxPageSize?: number,
  ): Promise<AllUsersResponseModel> => {
    return userApi.v1OrganizationsOrganizationIdUsersGet({
      organizationId,
      pageToken,
      maxPageSize,
    });
  },
  removeUserFromOrganization: async (
    organizationId: string,
    userId: string,
  ): Promise<SuccessResponse> => {
    return userApi.v1OrganizationsOrganizationIdUsersUserIdDelete({
      organizationId,
      userId,
    });
  },
  getUserInvitationByOrganization: async (
    organizationId: string,
    userId: string,
  ): Promise<Invitation> => {
    return userApi.v1OrganizationsOrganizationIdUsersUserIdInvitationsGet({
      organizationId,
      userId,
    });
  },
  getUserPermissions: async (
    organizationId: string,
    userId: string,
  ): Promise<OrganizationPermissions> => {
    const { raw } = await userApi.v1OrganizationsOrganizationIdUsersUserIdPermissionsGetRaw({
      organizationId,
      userId,
    });

    return (await raw.json()) as OrganizationPermissions;
  },
  getUserRoles: async (
    organizationId: string,
    userId: string,
    pageToken?: string,
    maxPageSize?: number,
  ): Promise<AllRolesResponseModel> => {
    return userApi.v1OrganizationsOrganizationIdUsersUserIdRolesGet({
      organizationId,
      userId,
      pageToken,
      maxPageSize,
    });
  },
  addUserToOrganization: async (
    organizationId: string,
    userId: string,
  ): Promise<SuccessResponse> => {
    return userApi.v1OrganizationsOrganizationIdUsersUserIdPost({
      organizationId,
      userId,
    });
  },
  addUserToRole: async (
    organizationId: string,
    userId: string,
    roleId: string,
  ): Promise<SuccessResponse> => {
    return userApi.v1OrganizationsOrganizationIdUsersUserIdRolesRoleIdPost({
      organizationId,
      userId,
      roleId,
    });
  },
  removeUserFromRole: async (
    organizationId: string,
    userId: string,
    roleId: string,
  ): Promise<SuccessResponse> => {
    return userApi.v1OrganizationsOrganizationIdUsersUserIdRolesRoleIdDelete({
      organizationId,
      userId,
      roleId,
    });
  },
};

const groupUniversePayoutClient = {
  getUniversePayouts: async (request: GetUniversePayoutsRequest): Promise<UniversePayouts> => {
    return groupUniversePayoutApi.v1OrganizationsOrganizationIdPayoutsUniverseIdGet(request);
  },
  updateUniversePayouts: async (
    request: UpdateUniversePayoutsRequest,
  ): Promise<UniversePayouts> => {
    return groupUniversePayoutApi.v1OrganizationsOrganizationIdPayoutsUniverseIdPatch(request);
  },
  findUniversePayouts: async (request: FindUniversePayoutsRequest) => {
    return groupUniversePayoutApi.v1OrganizationsOrganizationIdPayoutsUniversesGet(request);
  },
  getLatestOneTimePayoutForUsers: async (organizationId: string, userIds: number[]) => {
    const request: V1OrganizationsOrganizationIdPayoutsLatestGetRequest = {
      organizationId,
      userIds: userIds.map(String),
    };
    return groupUniversePayoutApi.v1OrganizationsOrganizationIdPayoutsLatestGet(request);
  },
  getSuggestedPayouts: async (organizationId: string) => {
    return groupUniversePayoutApi.v1OrganizationsOrganizationIdPayoutsSuggestedGet({
      organizationId,
    });
  },
};

const organizationApiClient = {
  organizationClient,
  invitationClient,
  roleClient,
  userClient,
  groupUniversePayoutClient,
};

export default organizationApiClient;
