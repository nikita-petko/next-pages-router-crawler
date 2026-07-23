import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  GroupSearchApi,
  GroupsApi,
  GroupFeaturesApi,
  RolesApi,
  MembershipApi,
  RobloxGroupsApiGroupRoleDetailResponse,
  RobloxGroupsApiGroupSearchPageResponse,
  RobloxGroupsApiGroupDetailResponse,
  RobloxWebWebAPIModelsApiArrayResponseRobloxGroupsApiGroupRoleDetailResponse,
  RobloxGroupsApiGroupAllRolesResponse,
  RobloxGroupsApiGroupRoleResponse,
  RobloxWebWebAPIModelsApiArrayResponseRobloxGroupsApiGroupMembershipDetailResponse,
  V1GroupsGroupIdDescriptionPatchRequest,
  RobloxGroupsApiGroupDescriptionResponse,
  V1GroupsIconPatchRequest,
  V1GroupsGroupIdSocialLinksPostRequest,
  V1GroupsGroupIdSocialLinksSocialLinkIdPatchRequest,
  V1GroupsGroupIdSocialLinksGetRequest,
  V1GroupsGroupIdSocialLinksSocialLinkIdDeleteRequest,
  SocialLinksApi,
  RobloxGroupsApiGetSocialLinkResponse,
  RobloxGroupsApiSocialLinkResponse,
  V1GroupsSearchGetLimitEnum,
  V1GroupsGroupIdNamePatchRequest,
  RobloxGroupsApiUpdateGroupNameResponse,
  V1GroupsGroupIdChangeOwnerPostRequest,
  RobloxWebResponsesGroupsGroupResponseV2,
  V1GroupsCreatePostRequest,
  RevenueApi,
  V1GroupsGroupIdPayoutsGetRequest,
  RobloxWebWebAPIModelsApiArrayResponseRobloxGroupsApiGroupPayoutResponse,
  V1GroupsGroupIdPayoutsRecurringPostRequest,
  V1GroupsGroupIdPayoutsPostRequest,
  RobloxGroupsApiPayoutRequest,
  V1GroupsGroupIdPayoutRestrictionGetRequest,
  RobloxGroupsApiGroupPayoutRestrictionResponse,
  RobloxGroupsApiGroupAuditLogPageResponseRobloxGroupsApiModelsResponseGroupAuditLogResponseItem,
  V1GroupsGroupIdAuditLogGetActionTypeEnum,
  V1GroupsGroupIdAuditLogGetRequest,
  V1GroupsGroupIdAuditLogGetLimitEnum,
  RobloxGroupsApiModelsResponseGroupAuditLogResponseItem,
  RobloxGroupsApiGroupMembershipMetadataResponse,
  V1GroupsGroupIdMembershipGetRequest,
  RobloxGroupsApiGetGroupFeaturesResponse,
  RobloxGroupsApiGroupFeatureResponseFeatureEnum,
  RobloxGroupsApiGroupFeatureResponse,
  RobloxGroupsApiHasGroupFeaturesBlockedResponse,
  RobloxGroupsApiSetFeaturesRequestModel,
  RobloxGroupsApiSetFeaturesResponseModel,
  RobloxGroupsApiSetFeaturesRequestModelFeatures,
  RobloxGroupsApiSetFeaturesRequestModelFeaturesPayoutsEnum,
} from '@rbx/clients/groups';
import { RobloxWebWebAPIModelsApiArrayResponseRobloxWebResponsesThumbnailsThumbnailResponse } from '@rbx/clients/thumbnails';
import {
  GroupsV2Api as GroupsApiV2,
  RobloxWebWebAPIModelsApiArrayResponseRobloxGroupsApiGroupMembershipResponse,
  RobloxWebWebAPIModelsApiArrayResponseRobloxWebResponsesGroupsGroupResponseV2,
  V2UsersUserIdGroupsRolesGetDiscoveryTypeEnum,
} from '@rbx/clients/groups/v2';
import { getBEDEV1ServiceBasePath } from './utils';

const basePath = getBEDEV1ServiceBasePath('groups');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const groupSearchApi = new GroupSearchApi(configuration);
const groupApi = new GroupsApi(configuration);
const groupApiV2 = new GroupsApiV2(configuration);
const groupFeaturesApi = new GroupFeaturesApi(configuration);
const roleApi = new RolesApi(configuration);
const membershipApi = new MembershipApi(configuration);
const socialLinksApi = new SocialLinksApi(configuration);
const revenueApi = new RevenueApi(configuration);

export type CommunityProductFeatures = {
  CreatorAnalytics?: boolean;
};

export type GroupSearchResponse = RobloxGroupsApiGroupSearchPageResponse;
export type { RobloxGroupsApiGroupDetailResponse } from '@rbx/clients/groups';
export type GroupRoleDetailResponse = RobloxGroupsApiGroupRoleDetailResponse;
export type GroupRoleListRespoonse = RobloxGroupsApiGroupRoleResponse;

export type GroupsIconPatchRequest = V1GroupsIconPatchRequest;
export type GroupIconResponse =
  RobloxWebWebAPIModelsApiArrayResponseRobloxWebResponsesThumbnailsThumbnailResponse;

export type GroupUpdateNamePatchRequest = V1GroupsIconPatchRequest;
export type GroupNameResponse = RobloxGroupsApiGroupRoleResponse;

export type GroupDescriptionPatchRequest = V1GroupsGroupIdDescriptionPatchRequest;
export type GroupDescriptionResponse = RobloxGroupsApiGroupDescriptionResponse;

export type GroupSocialLinksGetRequest = V1GroupsGroupIdSocialLinksGetRequest;
export type GroupSocialLinksResponse = RobloxGroupsApiGetSocialLinkResponse;
export type GroupSocialLinkPostRequest = V1GroupsGroupIdSocialLinksPostRequest;
export type GroupSocialLink = RobloxGroupsApiSocialLinkResponse;
export type GroupSocialLinkPatchRequest = V1GroupsGroupIdSocialLinksSocialLinkIdPatchRequest;
export type GroupSocialLinkDeleteRequest = V1GroupsGroupIdSocialLinksSocialLinkIdDeleteRequest;

export type GroupPayoutResponse =
  RobloxWebWebAPIModelsApiArrayResponseRobloxGroupsApiGroupPayoutResponse;
export type GroupPayoutRestrictionResponse = RobloxGroupsApiGroupPayoutRestrictionResponse;

export type GroupAuditLogResponse =
  RobloxGroupsApiGroupAuditLogPageResponseRobloxGroupsApiModelsResponseGroupAuditLogResponseItem;
export type GroupAuditLogResponsePage = RobloxGroupsApiModelsResponseGroupAuditLogResponseItem[];
export type GroupAuditLogResponseItem = RobloxGroupsApiModelsResponseGroupAuditLogResponseItem;
export type GroupAuditLogActionTypes = V1GroupsGroupIdAuditLogGetActionTypeEnum;
export type GroupAuditLimit = V1GroupsGroupIdAuditLogGetLimitEnum;
export type GroupFeatureResponseItem = RobloxGroupsApiGroupFeatureResponse;
export type GetGroupFeaturesResponse = RobloxGroupsApiGetGroupFeaturesResponse;
export type GetGroupFeaturesStatusResponse = RobloxGroupsApiHasGroupFeaturesBlockedResponse;
export type SetGroupFeaturesRequest = RobloxGroupsApiSetFeaturesRequestModel;
export type SetGroupFeaturesResponse = RobloxGroupsApiSetFeaturesResponseModel;
export type SetGroupFeaturesRequestFeatures = RobloxGroupsApiSetFeaturesRequestModelFeatures;

export const SetGroupFeaturesEnum = {
  On: RobloxGroupsApiSetFeaturesRequestModelFeaturesPayoutsEnum.On,
  Blocked: RobloxGroupsApiSetFeaturesRequestModelFeaturesPayoutsEnum.Blocked,
};

export const GroupAuditLogActionTypeEnum = V1GroupsGroupIdAuditLogGetActionTypeEnum;
export const GroupAuditLimitEnum = V1GroupsGroupIdAuditLogGetLimitEnum;
export const GroupFeatureTypeEnum = RobloxGroupsApiGroupFeatureResponseFeatureEnum;

export interface GroupsClient {
  searchGroups(
    keyword: string,
    limit?: V1GroupsSearchGetLimitEnum,
    cursor?: string,
  ): Promise<RobloxGroupsApiGroupSearchPageResponse>;
  getGroupInfo(groupId: number): Promise<RobloxGroupsApiGroupDetailResponse>;
  getGroupsInfo(
    groupIds: number[],
  ): Promise<RobloxWebWebAPIModelsApiArrayResponseRobloxWebResponsesGroupsGroupResponseV2>;
  getRolesInfo(
    roleId: number[],
  ): Promise<RobloxWebWebAPIModelsApiArrayResponseRobloxGroupsApiGroupRoleDetailResponse>;
  getGroupRolesSetsInfo(groupId: number): Promise<RobloxGroupsApiGroupAllRolesResponse>;
  getUsersGroupRoles(
    userId: number,
  ): Promise<RobloxWebWebAPIModelsApiArrayResponseRobloxGroupsApiGroupMembershipDetailResponse>;
  getUsersGroupRolesV2(
    userId: number,
    includeLocked: boolean,
    includeNotificationPreferences: boolean,
    discoveryType: V2UsersUserIdGroupsRolesGetDiscoveryTypeEnum,
  ): Promise<RobloxWebWebAPIModelsApiArrayResponseRobloxGroupsApiGroupMembershipResponse>;
  getGroupMembershipMetadata(
    request: V1GroupsGroupIdMembershipGetRequest,
  ): Promise<RobloxGroupsApiGroupMembershipMetadataResponse>;
  patchGroupIcon(request: V1GroupsIconPatchRequest): Promise<unknown>;
  patchGroupName(
    request: V1GroupsGroupIdNamePatchRequest,
  ): Promise<RobloxGroupsApiUpdateGroupNameResponse>;
  patchGroupDescription(
    request: V1GroupsGroupIdDescriptionPatchRequest,
  ): Promise<RobloxGroupsApiGroupDescriptionResponse>;
  createGroup(request: V1GroupsCreatePostRequest): Promise<RobloxWebResponsesGroupsGroupResponseV2>;
  postGroupOwner(request: V1GroupsGroupIdChangeOwnerPostRequest): Promise<unknown>;
  getGroupSocialLinks(groupId: number): Promise<RobloxGroupsApiGetSocialLinkResponse>;
  patchGroupSocialLink(
    request: V1GroupsGroupIdSocialLinksSocialLinkIdPatchRequest,
  ): Promise<unknown>;
  postGroupSocialLink(
    request: V1GroupsGroupIdSocialLinksPostRequest,
  ): Promise<RobloxGroupsApiSocialLinkResponse>;
  deleteGroupSocialLink(
    request: V1GroupsGroupIdSocialLinksSocialLinkIdDeleteRequest,
  ): Promise<unknown>;
  getGroupPayouts(groupId: number): Promise<GroupPayoutResponse>;
  updateGroupRecurringPayouts(
    groupId: number,
    payoutsRequest: RobloxGroupsApiPayoutRequest,
  ): Promise<object>;
  updateGroupPayouts(
    groupId: number,
    payoutsRequest: RobloxGroupsApiPayoutRequest,
  ): Promise<object>;
  getGroupPayoutRestriction(groupId: number): Promise<GroupPayoutRestrictionResponse>;
  getGroupAuditLog(
    groupId: number,
    actionType?: GroupAuditLogActionTypes,
    userId?: number,
    limit?: GroupAuditLimit,
    cursor?: string,
  ): Promise<GroupAuditLogResponse>;
  getGroupFeatures(groupId: number): Promise<GetGroupFeaturesResponse>;
  getGroupFeaturesStatus(groupId: number): Promise<GetGroupFeaturesStatusResponse>;
  setGroupFeatures(
    groupId: number,
    request: SetGroupFeaturesRequest,
  ): Promise<SetGroupFeaturesResponse>;
  getProductFeatures(groupId: number): Promise<CommunityProductFeatures>;
}

const groupsClient: GroupsClient = {
  searchGroups(keyword: string, limit?: V1GroupsSearchGetLimitEnum, cursor?: string) {
    const usersSearchRequest = {
      keyword,
      limit,
      cursor,
    };
    return groupSearchApi.v1GroupsSearchGet(usersSearchRequest);
  },
  getGroupInfo(groupId: number) {
    const usersGroupRequest = {
      groupId,
    };
    return groupApi.v1GroupsGroupIdGet(usersGroupRequest);
  },
  getGroupsInfo(groupIds: number[]) {
    const getGroupsRequest = {
      groupIds,
    };
    return groupApiV2.v2GroupsGet(getGroupsRequest);
  },
  getRolesInfo(ids: number[]) {
    const roleRequest = {
      ids,
    };
    return roleApi.v1RolesGet(roleRequest);
  },
  getGroupRolesSetsInfo(groupId: number) {
    return membershipApi.v1GroupsGroupIdRolesGet({
      groupId,
    });
  },
  getUsersGroupRoles(userId: number) {
    return membershipApi.v1UsersUserIdGroupsRolesGet({
      userId,
    });
  },
  getUsersGroupRolesV2(
    userId: number,
    includeLocked: boolean = false,
    includeNotificationPreferences: boolean = false,
    discoveryType: V2UsersUserIdGroupsRolesGetDiscoveryTypeEnum = V2UsersUserIdGroupsRolesGetDiscoveryTypeEnum.NUMBER_0,
  ) {
    return groupApiV2.v2UsersUserIdGroupsRolesGet({
      userId,
      includeLocked,
      includeNotificationPreferences,
      discoveryType,
    });
  },
  getGroupMembershipMetadata(request: V1GroupsGroupIdMembershipGetRequest) {
    return membershipApi.v1GroupsGroupIdMembershipGet(request);
  },
  patchGroupIcon(request: V1GroupsIconPatchRequest) {
    return groupApi.v1GroupsIconPatch(request);
  },
  patchGroupName(request: V1GroupsGroupIdNamePatchRequest) {
    return groupApi.v1GroupsGroupIdNamePatch(request);
  },
  patchGroupDescription(request: V1GroupsGroupIdDescriptionPatchRequest) {
    return groupApi.v1GroupsGroupIdDescriptionPatch(request);
  },
  createGroup(request: V1GroupsCreatePostRequest) {
    return groupApi.v1GroupsCreatePost(request);
  },
  postGroupOwner(request: V1GroupsGroupIdChangeOwnerPostRequest) {
    return membershipApi.v1GroupsGroupIdChangeOwnerPost(request);
  },
  getGroupSocialLinks(groupId: number) {
    const socialLinksRequest = {
      groupId,
    };
    return socialLinksApi.v1GroupsGroupIdSocialLinksGet(socialLinksRequest);
  },
  patchGroupSocialLink(request: V1GroupsGroupIdSocialLinksSocialLinkIdPatchRequest) {
    return socialLinksApi.v1GroupsGroupIdSocialLinksSocialLinkIdPatch(request);
  },
  postGroupSocialLink(request: V1GroupsGroupIdSocialLinksPostRequest) {
    return socialLinksApi.v1GroupsGroupIdSocialLinksPost(request);
  },
  deleteGroupSocialLink(request: V1GroupsGroupIdSocialLinksSocialLinkIdDeleteRequest) {
    return socialLinksApi.v1GroupsGroupIdSocialLinksSocialLinkIdDelete(request);
  },
  getGroupPayouts(groupId: number) {
    const request: V1GroupsGroupIdPayoutsGetRequest = {
      groupId,
    };
    return revenueApi.v1GroupsGroupIdPayoutsGet(request);
  },
  updateGroupRecurringPayouts(groupId: number, payoutsRequest: RobloxGroupsApiPayoutRequest) {
    const request: V1GroupsGroupIdPayoutsRecurringPostRequest = {
      groupId,
      request: payoutsRequest,
    };
    return revenueApi.v1GroupsGroupIdPayoutsRecurringPost(request);
  },
  updateGroupPayouts(groupId: number, payoutsRequest: RobloxGroupsApiPayoutRequest) {
    const request: V1GroupsGroupIdPayoutsPostRequest = {
      groupId,
      request: payoutsRequest,
    };
    return revenueApi.v1GroupsGroupIdPayoutsPost(request);
  },
  getGroupPayoutRestriction(groupId: number) {
    const request: V1GroupsGroupIdPayoutRestrictionGetRequest = {
      groupId,
    };
    return revenueApi.v1GroupsGroupIdPayoutRestrictionGet(request);
  },
  getGroupAuditLog(
    groupId: number,
    actionType?: GroupAuditLogActionTypes,
    userId?: number,
    limit?: GroupAuditLimit,
    cursor?: string,
  ) {
    const request: V1GroupsGroupIdAuditLogGetRequest = {
      groupId,
      actionType,
      userId,
      limit,
      cursor,
    };
    return groupApi.v1GroupsGroupIdAuditLogGet(request);
  },
  getGroupFeatures(groupId: number) {
    return groupFeaturesApi.v1GroupsGroupIdFeaturesGet({
      groupId,
    });
  },
  getGroupFeaturesStatus(groupId: number) {
    return groupFeaturesApi.v1GroupsGroupIdFeaturesStatusGet({
      groupId,
    });
  },
  setGroupFeatures(groupId: number, request: RobloxGroupsApiSetFeaturesRequestModel) {
    return groupFeaturesApi.v1GroupsGroupIdFeaturesPatch({
      groupId,
      request,
    });
  },
  getProductFeatures(groupId: number) {
    return fetch(`${basePath}/v1/groups/${groupId}/product-features`, {
      method: 'GET',
      credentials: 'include',
    }).then((response) => response.json() as Promise<CommunityProductFeatures>);
  },
};

export default groupsClient;
