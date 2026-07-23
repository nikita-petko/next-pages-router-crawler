import { RoleColorType, RoleMetadata } from '@modules/clients/organizationApi';
// eslint-disable-next-line no-restricted-imports -- circular dependency when fetching from @modules/creations
import { EventType } from '@modules/creations/activityFeed/enums/ActivityFeedEnums';
import { RobloxGroupsApiSocialLinkResponseTypeEnum } from '@rbx/clients/groups';
import { GroupAuditLogActionTypeEnum, GroupAuditLogActionTypes } from '@modules/clients/groups';

const SocialLinksLimit = 3;

const GroupSocialLinkTypesPatternMap: Map<string, RegExp> = new Map([
  [
    'Facebook',
    /^\s*((http|https):\/\/)?(www\.)?facebook\.com\/(?:(?:\w)*#!\/)?(?:pages\/)?(?:[?\w-]*\/)?(?:profile\.php\?id=(?=\d.*))?([\w-]*)\s*$/,
  ],
  [
    'Twitter',
    /^\s*(((http|https):\/\/)?(www\.)?(twitter\.com|x\.com)\/|@)([a-zA-Z0-9_]{1,15})\s*$/,
  ],
  ['YouTube', /^((http|https):\/\/)?(www\.)?youtube\.com\/(?!logout(\/|$))[@a-zA-Z0-9\-/_]+$/],
  ['Twitch', /^\s*((http|https):\/\/)?(www\.)?twitch\.tv\/[a-zA-Z0-9\-/_]+\s*$/],
  ['GooglePlus', /{}/], // this is not available
  ['Discord', /^\s*((http|https):\/\/)?(www\.)?discord\.(gg|io|me|li)\/[a-zA-Z0-9\-_/]+\s*$/],
  [
    'RobloxGroup',
    /^\s*(?:https?):\/\/(?:[a-z0-9-]{2,}\.)*(?:roblox(labs)?\.com\/)(?:[Gg]roups\/[Gg]roup\.aspx\?gid=|[Mm]y\/[Gg]roups\.aspx\?gid=|groups\/|communities\/)([\d]+)\s*$/,
  ],
  [
    'Amazon',
    /^((https?):\/\/)?(www\.)?amazon\.com\/stores\/page\/[\w\-/]+(\?[\w\-/]+(=[\w\-/]*)?(&[\w\-/]+(=[\w\-/]*)?)*)?$/,
  ],
]);

const GroupSocialLinkTypesToNameMap: Map<RobloxGroupsApiSocialLinkResponseTypeEnum, string> =
  new Map([
    [RobloxGroupsApiSocialLinkResponseTypeEnum.NUMBER_0, 'Facebook'],
    [RobloxGroupsApiSocialLinkResponseTypeEnum.NUMBER_1, 'Twitter'],
    [RobloxGroupsApiSocialLinkResponseTypeEnum.NUMBER_2, 'YouTube'],
    [RobloxGroupsApiSocialLinkResponseTypeEnum.NUMBER_3, 'Twitch'],
    [RobloxGroupsApiSocialLinkResponseTypeEnum.NUMBER_4, 'GooglePlus'],
    [RobloxGroupsApiSocialLinkResponseTypeEnum.NUMBER_5, 'Discord'],
    [RobloxGroupsApiSocialLinkResponseTypeEnum.NUMBER_6, 'RobloxGroup'],
    [RobloxGroupsApiSocialLinkResponseTypeEnum.NUMBER_7, 'Amazon'],
  ]);

const MembersPageSize = 10;

const ActivityHistoryPageSize = 20;

const RoleColorTypeToHexMap: Map<RoleColorType, string> = new Map([
  [RoleColorType.Invalid, 'A1A2A5'],
  [RoleColorType.Blue, '00A2FF'],
  [RoleColorType.LightBlue, '55C1FF'],
  [RoleColorType.Green, '00B864'],
  [RoleColorType.LightGreen, '26FF9C'],
  [RoleColorType.Purple, '9E78EC'],
  [RoleColorType.LightPurple, 'B69AF1'],
  [RoleColorType.Yellow, 'D8A009'],
  [RoleColorType.LightYellow, 'F7C744'],
  [RoleColorType.Orange, 'EF7A36'],
  [RoleColorType.LightOrange, 'F29057'],
  [RoleColorType.Red, 'F2453D'],
  [RoleColorType.LightRed, 'F4645D'],
  [RoleColorType.Pink, 'E245CD'],
  [RoleColorType.LightPink, 'EC83DE'],
  [RoleColorType.Teal, '00D0D0'],
  [RoleColorType.LightTeal, '36FFFF'],
  [RoleColorType.Standard, 'FFFFFF'],
]);

const SupportedRoleColorTypes: RoleColorType[] = [
  RoleColorType.Blue,
  RoleColorType.Green,
  RoleColorType.Purple,
  RoleColorType.Yellow,
  RoleColorType.Orange,
  RoleColorType.Red,
  RoleColorType.Pink,
  RoleColorType.Teal,
];

// Arrakis-computed ID: ((long)GroupRelationship.Member.EntityType << 32) + GroupRelationship.Member.Value
const DefaultMemberRoleId = '12884901889';

const DefaultMemberIdPlaceholder = '-1';

const noResultsIconPath = `${process.env.assetPathPrefix}/group/no_results.svg`;

const MaximumRoles = 99;

const InviteQueryKey = 'invitationGroupId';

const NewGroupPrice = 100;

const GroupNameChangeCost = 100;
// maximum number of invitations to fetched to display as invited in the User select component
const MaxInvitationsFetchSize = 1000;

enum GroupActivityHistoryFilterDimensions {
  Creator = 'Creator',
  Content = 'Content',
  Membership = 'Membership',
  Monetization = 'Monetization',
  GroupSettings = 'GroupSettings',
  Roles = 'Roles',
  GroupMembers = 'GroupMembers',
}

enum GroupActivityHistoryFilterCategories {
  CreateOrDeleteRoles = 'CreateOrDeleteRoles',
  ConfigureRolesPermissions = 'ConfigureRolesPermissions',
  ConfigureRolesSettings = 'ConfigureRolesSettings',
  CreateExperience = 'CreateExperience',
  UploadAsset = 'UploadAsset',
  Invitation = 'Invitation',
  ManageMembers = 'ManageMembers',
  RoleAssignment = 'RoleAssignment',
  SendOneTimePayout = 'SendOneTimePayout',
  ConfigureRecurringPayouts = 'ConfigureRecurringPayouts',
  GroupInformationUpdate = 'GroupInformationUpdate',
  TransferOwnership = 'TransferOwnership',
  SpendGroupFunds = 'SpendGroupFunds',
  AdCreated = 'AdCreated',
  AssetModerated = 'AssetModerated',
}

enum GroupMembersMenuState {
  Members = 'Members',
  Invited = 'Invited',
}

const GroupActivityHistoryFilterOptionsToTranslationKey: Record<
  GroupActivityHistoryFilterDimensions | GroupActivityHistoryFilterCategories,
  string
> = {
  [GroupActivityHistoryFilterDimensions.Creator]: 'Label.FilterOptionCreator',
  [GroupActivityHistoryFilterDimensions.Content]: 'Label.FilterOptionContent',
  [GroupActivityHistoryFilterDimensions.Membership]: 'Label.FilterOptionMembership',
  [GroupActivityHistoryFilterDimensions.Monetization]: 'Label.FilterOptionMonetization',
  [GroupActivityHistoryFilterDimensions.GroupSettings]: 'Label.FilterOptionGroupSettings',
  [GroupActivityHistoryFilterDimensions.Roles]: 'Label.FilterOptionRoles',
  [GroupActivityHistoryFilterDimensions.GroupMembers]: 'Label.FilterOptionGroupMembers',
  [GroupActivityHistoryFilterCategories.CreateOrDeleteRoles]:
    'Label.FilterOptionCreateOrDeleteRoles',
  [GroupActivityHistoryFilterCategories.ConfigureRolesPermissions]:
    'Label.FilterOptionConfigureRolesPermissions',
  [GroupActivityHistoryFilterCategories.ConfigureRolesSettings]:
    'Label.FilterOptionConfigureRolesSettings',
  [GroupActivityHistoryFilterCategories.CreateExperience]: 'Label.FilterOptionCreateExperience',
  [GroupActivityHistoryFilterCategories.UploadAsset]: 'Label.FilterOptionUploadAsset',
  [GroupActivityHistoryFilterCategories.Invitation]: 'Label.FilterOptionInvitation',
  [GroupActivityHistoryFilterCategories.ManageMembers]: 'Label.FilterOptionManageMembers',
  [GroupActivityHistoryFilterCategories.RoleAssignment]: 'Label.FilterOptionRoleAssignment',
  [GroupActivityHistoryFilterCategories.SendOneTimePayout]: 'Label.FilterOptionSendOneTimePayout',
  [GroupActivityHistoryFilterCategories.ConfigureRecurringPayouts]:
    'Label.FilterOptionConfigureRecurringPayouts',
  [GroupActivityHistoryFilterCategories.GroupInformationUpdate]:
    'Label.FilterOptionGroupInformationUpdate',
  [GroupActivityHistoryFilterCategories.TransferOwnership]: 'Label.FilterOptionTransferOwnership',
  [GroupActivityHistoryFilterCategories.SpendGroupFunds]: 'Label.FilterOptionSpendGroupFunds',
  [GroupActivityHistoryFilterCategories.AdCreated]: 'Label.FilterOptionAdCreated',
  [GroupActivityHistoryFilterCategories.AssetModerated]: 'Label.FilterOptionAssetModerated',
};

const GroupActivityHistoryFilterCategoriesMapping: {
  [key in GroupActivityHistoryFilterDimensions]: GroupActivityHistoryFilterDimensions[];
} = {
  [GroupActivityHistoryFilterDimensions.Creator]: [],
  [GroupActivityHistoryFilterDimensions.Content]: [],
  [GroupActivityHistoryFilterDimensions.Membership]: [
    GroupActivityHistoryFilterDimensions.Roles,
    GroupActivityHistoryFilterDimensions.GroupMembers,
  ],
  [GroupActivityHistoryFilterDimensions.Monetization]: [],
  [GroupActivityHistoryFilterDimensions.GroupSettings]: [],
  [GroupActivityHistoryFilterDimensions.Roles]: [],
  [GroupActivityHistoryFilterDimensions.GroupMembers]: [],
};

const GroupActivityHistoryFilterOptionsMapping: {
  [key in GroupActivityHistoryFilterDimensions]: GroupActivityHistoryFilterCategories[];
} = {
  [GroupActivityHistoryFilterDimensions.Creator]: [],
  [GroupActivityHistoryFilterDimensions.Content]: [
    GroupActivityHistoryFilterCategories.UploadAsset,
    GroupActivityHistoryFilterCategories.CreateExperience,
    GroupActivityHistoryFilterCategories.AssetModerated,
  ],
  [GroupActivityHistoryFilterDimensions.Membership]: [],
  [GroupActivityHistoryFilterDimensions.Monetization]: [
    GroupActivityHistoryFilterCategories.SpendGroupFunds,
    GroupActivityHistoryFilterCategories.ConfigureRecurringPayouts,
    GroupActivityHistoryFilterCategories.AdCreated,
  ],
  [GroupActivityHistoryFilterDimensions.GroupSettings]: [
    GroupActivityHistoryFilterCategories.GroupInformationUpdate,
    GroupActivityHistoryFilterCategories.TransferOwnership,
  ],
  [GroupActivityHistoryFilterDimensions.Roles]: [
    GroupActivityHistoryFilterCategories.CreateOrDeleteRoles,
    GroupActivityHistoryFilterCategories.ConfigureRolesPermissions,
    GroupActivityHistoryFilterCategories.ConfigureRolesSettings,
  ],
  [GroupActivityHistoryFilterDimensions.GroupMembers]: [
    GroupActivityHistoryFilterCategories.Invitation,
    GroupActivityHistoryFilterCategories.RoleAssignment,
    GroupActivityHistoryFilterCategories.ManageMembers,
  ],
};

const GroupActivityHistoryEventTypesMapping: {
  [key in GroupActivityHistoryFilterCategories]: EventType[] | GroupAuditLogActionTypes[];
} = {
  [GroupActivityHistoryFilterCategories.CreateOrDeleteRoles]: [
    EventType.RoleCreated,
    EventType.RoleDeleted,
  ],
  [GroupActivityHistoryFilterCategories.ConfigureRolesPermissions]: [
    EventType.RolePermissionsUpdated,
    EventType.ExperiencePermissionsUpdated,
  ],
  [GroupActivityHistoryFilterCategories.ConfigureRolesSettings]: [EventType.RoleNameUpdated],
  [GroupActivityHistoryFilterCategories.Invitation]: [
    EventType.MemberInvited,
    EventType.InviteRevoked,
  ],
  [GroupActivityHistoryFilterCategories.ManageMembers]: [
    GroupAuditLogActionTypeEnum.JoinGroup,
    GroupAuditLogActionTypeEnum.LeaveGroup,
    GroupAuditLogActionTypeEnum.RemoveMember,
  ],
  [GroupActivityHistoryFilterCategories.RoleAssignment]: [
    EventType.RoleAssigned,
    EventType.RoleUnassigned,
  ],
  [GroupActivityHistoryFilterCategories.SendOneTimePayout]: [EventType.OneTimePayoutSent],
  [GroupActivityHistoryFilterCategories.GroupInformationUpdate]: [
    GroupAuditLogActionTypeEnum.Rename,
    GroupAuditLogActionTypeEnum.UpdateGroupIcon,
  ],
  [GroupActivityHistoryFilterCategories.TransferOwnership]: [
    GroupAuditLogActionTypeEnum.ChangeOwner,
  ],
  [GroupActivityHistoryFilterCategories.CreateExperience]: [EventType.ExperienceCreated],
  [GroupActivityHistoryFilterCategories.UploadAsset]: [
    GroupAuditLogActionTypeEnum.CreateGroupAsset,
  ],
  [GroupActivityHistoryFilterCategories.ConfigureRecurringPayouts]: [EventType.PayoutsConfigured],
  [GroupActivityHistoryFilterCategories.AssetModerated]: [
    EventType.AssetModerated,
    EventType.PlaceModerated,
  ],
  [GroupActivityHistoryFilterCategories.SpendGroupFunds]: [
    GroupAuditLogActionTypeEnum.SpendGroupFunds,
  ],
  [GroupActivityHistoryFilterCategories.AdCreated]: [GroupAuditLogActionTypeEnum.BuyAd],
};

export type FilterDrawerChoicesType = {
  [key in GroupActivityHistoryFilterDimensions]: GroupActivityHistoryFilterCategories[];
};

export type InvitedMember = {
  userId?: string;
  roles?: Array<RoleMetadata> | null;
  invitationId: string;
};

const universeEvents: Set<EventType> = new Set([
  EventType.ExperiencePermissionsUpdated,
  EventType.ExperienceCreated,
  EventType.PayoutsConfigured,
  EventType.PlaceModerated,
]);

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export {
  GroupSocialLinkTypesPatternMap,
  GroupSocialLinkTypesToNameMap,
  SocialLinksLimit,
  MembersPageSize,
  ActivityHistoryPageSize,
  RoleColorTypeToHexMap,
  SupportedRoleColorTypes,
  DefaultMemberRoleId,
  DefaultMemberIdPlaceholder,
  noResultsIconPath,
  MaximumRoles,
  InviteQueryKey,
  NewGroupPrice,
  GroupNameChangeCost,
  GroupMembersMenuState,
  GroupActivityHistoryFilterDimensions,
  GroupActivityHistoryFilterCategories,
  GroupActivityHistoryFilterOptionsToTranslationKey,
  GroupActivityHistoryFilterCategoriesMapping,
  GroupActivityHistoryFilterOptionsMapping,
  GroupActivityHistoryEventTypesMapping,
  MaxInvitationsFetchSize,
  universeEvents,
  THIRTY_DAYS,
};
