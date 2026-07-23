import { useEffect, useMemo, useState } from 'react';
import {
  developClient,
  GroupAuditLogResponseItem,
  GroupAuditLogResponsePage,
  usersClient,
  GroupAuditLogActionTypeEnum,
} from '@modules/clients';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { ActivityFeedItemInfo, EventType, ResourceType, usernameEvents } from '@modules/creations';
import { Asset } from '@modules/miscellaneous/common';
import { universeEvents } from '../constants/groupConstants';

export const affectedUserKey = 'affectedUser';
export interface OrganizationActivityFeedItemInfo extends ActivityFeedItemInfo {
  usernameMetadata: Map<string, string>;
}

function parseOrganizationActivityFeedItemInfo(
  groupId: string,
  response: OrganizationActivityFeedEvent,
  usernames: Record<number, string>,
  getDateTime: (createdUtc: number) => string,
  translate: (key: string, args?: Record<string, string>) => string,
  universePlaceIds: Record<string, number>,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- parsing JSON string
  let data: any = {};
  try {
    if (response.metaData !== '') {
      data = JSON.parse(response.metaData);
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console -- keep this error
    console.error('Error occurred during parsing:', error);
  }

  const wwwPath = `https://${process.env.robloxSiteDomain}`;
  const userPath = `${wwwPath}/users/${response.userId}/profile`;
  const targetUserPath = `${wwwPath}/users/${response.resourceId}/profile`;
  const groupPath = `${wwwPath}/communities/${groupId}`;
  const universePath = `/dashboard/creations/experiences/${response.resourceId}/overview`;
  const placePath = `/dashboard/creations/experiences/${response.resourceId}/places/${data.PlaceId}/configure`;
  const universeOnRobloxPath = `${wwwPath}/games/${universePlaceIds[`${response.resourceId}`]}`;
  const groupProfilePath = `/dashboard/group/roles?groupId=${groupId}&activeTab=GroupProfileTab`;
  const groupRolePath = `/dashboard/group/roles?groupId=${groupId}&activeTab=GroupRolesTab`;
  const groupMemberPath = `/dashboard/group/members?groupId=${groupId}&activeTab=GroupMembersTab`;
  const groupPayoutPath = `/dashboard/group/payouts?groupId=${groupId}`;
  const assetPath = `/dashboard/creations/catalog/${response.resourceId}/configure`;

  const filters = {
    eventType: response.eventType,
    userId: response.userId,
    createdUtc: response.createdUnixTimeMs,
  };
  let iconId: number;
  let iconType: ResourceType;
  let translationString: string;
  let changedByLink = response.userId === 1 ? '' : userPath;
  let locationLink: string | undefined;
  const location = '';
  let thumbnailLink = '';
  let viewBasicSettingsLink: string | undefined;
  let viewOnRobloxLink: string | undefined;
  const usernameMetadata: Map<string, string> = new Map();

  const dateTime: string = getDateTime(response.createdUnixTimeMs);

  function checkForUsername(resourceId?: number): string {
    return resourceId !== undefined ? usernames[resourceId] : '';
  }

  try {
    switch (response.eventType) {
      case EventType.RoleCreated:
        translationString = translate(`Description.RoleCreated`, { roleName: data.RoleName });
        iconType = ResourceType.Group;
        viewBasicSettingsLink = groupRolePath;
        break;
      case EventType.RoleDeleted:
        translationString = translate(`Description.RoleDeleted`, { roleName: data.RoleName });
        iconType = ResourceType.Group;
        viewBasicSettingsLink = groupRolePath;
        break;
      case EventType.RolePermissionsUpdated:
        translationString = translate(`Description.RolePermissionsUpdated`, {
          roleName: data.RoleName,
        });
        iconType = ResourceType.Group;
        viewBasicSettingsLink = groupRolePath;
        break;
      case EventType.RoleNameUpdated:
        translationString = translate(`Description.RoleNameUpdated`, {
          oldRoleName: data.OldRoleName,
          newRoleName: data.NewRoleName,
        });
        iconType = ResourceType.Group;
        viewBasicSettingsLink = groupRolePath;
        break;
      case EventType.MemberRemoved: {
        const affectedUser = checkForUsername(response.resourceId);
        translationString = translate(`Description.MemberRemoved`, {
          userName: affectedUser,
        });
        iconType = ResourceType.User;
        viewBasicSettingsLink = groupMemberPath;
        viewOnRobloxLink = groupPath;
        usernameMetadata.set(affectedUserKey, affectedUser);
        break;
      }
      case EventType.MemberInvited: {
        const affectedUser = checkForUsername(response.resourceId);
        translationString = translate(`Description.MemberInvited`, {
          userName: affectedUser,
        });
        iconType = ResourceType.User;
        viewBasicSettingsLink = groupMemberPath;
        viewOnRobloxLink = groupPath;
        usernameMetadata.set(affectedUserKey, affectedUser);
        break;
      }
      case EventType.InviteRevoked: {
        const affectedUser = checkForUsername(response.resourceId);
        translationString = translate(`Description.InviteRevoked`, {
          userName: affectedUser,
        });
        iconType = ResourceType.User;
        viewBasicSettingsLink = groupMemberPath;
        viewOnRobloxLink = groupPath;
        usernameMetadata.set(affectedUserKey, affectedUser);
        break;
      }
      case EventType.MemberJoined: {
        const affectedUser = checkForUsername(response.resourceId);
        translationString = translate(`Description.MemberJoined`, {
          userName: affectedUser,
        });
        iconType = ResourceType.User;
        viewBasicSettingsLink = groupMemberPath;
        viewOnRobloxLink = groupPath;
        usernameMetadata.set(affectedUserKey, affectedUser);
        break;
      }
      case EventType.RoleAssigned: {
        const affectedUser = checkForUsername(response.resourceId);
        translationString = translate(`Description.RoleAssigned`, {
          userName: affectedUser,
          roleName: data.RoleName,
        });
        iconType = ResourceType.User;
        viewBasicSettingsLink = groupMemberPath;
        usernameMetadata.set(affectedUserKey, affectedUser);
        break;
      }
      case EventType.RoleUnassigned: {
        const affectedUser = checkForUsername(response.resourceId);
        translationString = translate(`Description.RoleUnassigned`, {
          userName: affectedUser,
          roleName: data.RoleName,
        });
        iconType = ResourceType.User;
        viewBasicSettingsLink = groupMemberPath;
        usernameMetadata.set(affectedUserKey, affectedUser);
        break;
      }
      case EventType.GroupIconUpdated:
        translationString = translate(`Description.GroupSettingsUpdate`, {
          groupSettings: 'Group icon',
        });
        iconType = ResourceType.Group;
        viewBasicSettingsLink = groupProfilePath;
        viewOnRobloxLink = groupPath;
        break;
      case EventType.GroupNameUpdated:
        translationString = translate(`Description.GroupSettingsUpdate`, {
          groupSettings: 'Group name',
        });
        iconType = ResourceType.Group;
        viewBasicSettingsLink = groupProfilePath;
        viewOnRobloxLink = groupPath;
        break;
      case EventType.GroupDescriptionUpdated:
        translationString = translate(`Description.GroupSettingsUpdate`, {
          groupSettings: 'Group description',
        });
        iconType = ResourceType.Group;
        viewBasicSettingsLink = groupProfilePath;
        viewOnRobloxLink = groupPath;
        break;
      case EventType.GroupSocialLinksUpdated:
        translationString = translate(`Description.GroupSettingsUpdate`, {
          groupSettings: 'Group social links',
        });
        iconType = ResourceType.Group;
        viewBasicSettingsLink = groupProfilePath;
        viewOnRobloxLink = groupPath;
        break;
      case EventType.GroupOwnerUpdated: {
        const affectedUser = checkForUsername(response.resourceId);
        translationString = translate(`Description.GroupOwnerUpdated`, {
          userName: affectedUser,
        });
        iconType = ResourceType.Group;
        viewBasicSettingsLink = groupProfilePath;
        viewOnRobloxLink = groupPath;
        usernameMetadata.set(affectedUserKey, affectedUser);
        break;
      }
      case EventType.OneTimePayoutSent: {
        const affectedUser = checkForUsername(response.resourceId);
        translationString = translate(`Description.OneTimePayoutSent`, {
          userName: affectedUser,
        });
        iconType = ResourceType.Group;
        viewBasicSettingsLink = groupPayoutPath;
        usernameMetadata.set(affectedUserKey, affectedUser);
        break;
      }
      case EventType.ExperiencePermissionsUpdated: {
        const metadata = JSON.parse(response.metaData);
        const permissions = JSON.parse(metadata.Permissions) as string[];
        const permissionsList = permissions.map((permission) =>
          translate(`Permission.${permission}`),
        );
        translationString = translate(
          permissions.length > 0
            ? 'Description.RoleExperiencePermissionsUpdated'
            : 'Description.RoleExperiencePermissionsRevoked',
          {
            roleName: metadata.RoleName,
            universeName: metadata.UniverseName,
            groupName: metadata.GroupName,
            permissions: permissionsList.join(', '),
          },
        );
        iconType = ResourceType.Universe;
        viewBasicSettingsLink = groupPayoutPath;
        break;
      }
      case EventType.PayoutsConfigured: {
        translationString = data.ExperienceName
          ? translate(`Description.ExperiencePayoutsConfigured`, {
              experienceName: data.ExperienceName,
              groupName: data.GroupName,
              payoutPercent: data.PayoutPercent,
            })
          : translate(`Description.PayoutsConfigured`, {
              groupName: data.GroupName,
              payoutPercent: data.PayoutPercent,
            });
        iconType = ResourceType.Robux;
        viewBasicSettingsLink = groupPayoutPath;
        viewOnRobloxLink = data.ExperienceName ? universeOnRobloxPath : undefined;
        break;
      }
      case EventType.ExperienceCreated: {
        translationString = translate(`Description.ExperienceCreated`, {
          experienceName: data.ExperienceName,
        });
        iconType = ResourceType.Universe;
        viewBasicSettingsLink = universePath;
        viewOnRobloxLink = universeOnRobloxPath;
        break;
      }
      case EventType.AssetModerated: {
        translationString = data.InfractionType
          ? translate(`Description.AssetModeratedWithInfraction`, {
              assetName: data.AssetName,
              infractionType: data.InfractionType,
            })
          : translate(`Description.AssetModerated`, {
              assetName: data.AssetName,
            });
        iconType = ResourceType.Asset;
        viewBasicSettingsLink = assetPath;
        break;
      }
      case EventType.PlaceModerated: {
        translationString = data.InfractionType
          ? translate(`Description.PlaceModeratedWithInfraction`, {
              placeName: data.PlaceName,
              experienceName: data.ExperienceName,
              infractionType: data.InfractionType,
            })
          : translate(`Description.PlaceModerated`, {
              placeName: data.PlaceName,
              experienceName: data.ExperienceName,
            });
        iconType = ResourceType.Place;
        viewBasicSettingsLink = placePath;
        break;
      }
      default:
        iconId = 0;
        iconType = ResourceType.Group;
        translationString = '';
        changedByLink = '';
        viewBasicSettingsLink = '';
        viewOnRobloxLink = '';
    }
  } catch (error) {
    iconType = ResourceType.Group;
    translationString = '';
    // eslint-disable-next-line no-console -- keep this error
    console.error(
      `Error parsing ${response.eventType}: ${error}\n Metadata was: ${JSON.stringify(data)}`,
    );
  }

  switch (iconType) {
    case ResourceType.User:
      iconId = response.resourceId ?? 0;
      thumbnailLink = targetUserPath;
      break;
    case ResourceType.Group:
      iconId = Number(groupId);
      thumbnailLink = groupPath;
      break;
    case ResourceType.Universe:
      iconId = universePlaceIds[`${response.resourceId}`];
      thumbnailLink = universePath;
      break;
    case ResourceType.Place:
      iconId = data.PlaceId;
      thumbnailLink = placePath;
      break;
    case ResourceType.Asset:
      iconId = response.resourceId ?? 0;
      thumbnailLink = assetPath;
      break;
    default:
      iconId = 0;
      thumbnailLink = '';
  }

  return {
    filters,
    id: response.id,
    iconId,
    iconType,
    translationString,
    username: usernames[response.userId],
    usernameMetadata,
    location,
    changedByLink,
    locationLink,
    thumbnailLink,
    viewBasicSettingsLink,
    viewOnRobloxLink,
    dateTime,
  };
}

function parseGroupAuditLogItemInfo(
  groupId: string,
  response: GroupAuditLogResponseItem,
  getDateTime: (createdUtc: Date) => string,
  translate: (key: string, args?: Record<string, string>) => string,
) {
  const wwwPath = `https://${process.env.robloxSiteDomain}`;
  const userPath = `${wwwPath}/users/${response.actor?.user?.userId}/profile`;
  const targetUserPath = `${wwwPath}/users/${(response.description as { TargetId?: number })?.TargetId}/profile`;
  const groupPath = `${wwwPath}/communities/${groupId}`;
  const groupProfilePath = `/dashboard/group/profile?groupId=${groupId}`;
  const groupPayoutPath = `/dashboard/group/payouts?groupId=${groupId}`;
  const assetPath = `/store/asset/${(response.description as { AssetId?: number })?.AssetId}`;
  const placePath = `${wwwPath}/games/${(response.description as { AssetId?: number })?.AssetId}`;
  const adsPath = `https://advertise.${process.env.robloxSiteDomain}`;
  const groupMemberPath = `/dashboard/group/members?groupId=${groupId}&activeTab=GroupMembersTab`;

  const filters = {
    eventType: response.actionType?.replace(/\s/g, ''),
    userId: response.actor?.user?.userId,
    createdUtc: response.created,
  };
  let iconId: number;
  let iconType: ResourceType;
  let translationString: string;
  let changedByLink = userPath;
  let locationLink: string | undefined;
  const location = '';
  let thumbnailLink = '';
  let viewBasicSettingsLink: string | undefined;
  let viewOnRobloxLink: string | undefined;
  const usernameMetadata: Map<string, string> = new Map();

  const dateTime: string = getDateTime(response.created ?? new Date());

  try {
    switch (response.actionType?.replace(/\s/g, '')) {
      case GroupAuditLogActionTypeEnum.SpendGroupFunds: {
        translationString = translate(`Message.SpendGroupFunds`, {
          actor: response.actor?.user?.username ?? '',
          amount: (response.description as { Amount?: number })?.Amount?.toString() ?? '',
          item: (response.description as { ItemDescription?: string })?.ItemDescription ?? '',
        });
        iconType = ResourceType.Robux;
        viewBasicSettingsLink = groupPayoutPath;
        break;
      }
      case GroupAuditLogActionTypeEnum.CreateGroupAsset: {
        translationString = translate(`Message.CreateAsset`, {
          actor: response.actor?.user?.username ?? '',
          item: (response.description as { AssetName?: string })?.AssetName ?? '',
        });
        const isPlace = (response.description as { AssetType?: string })?.AssetType === Asset.Place;
        iconType = isPlace ? ResourceType.Place : ResourceType.Asset;
        viewBasicSettingsLink = isPlace ? assetPath : placePath;
        break;
      }
      case GroupAuditLogActionTypeEnum.Rename: {
        translationString = translate(`Message.Rename`, {
          actor: response.actor?.user?.username ?? '',
          newName: (response.description as { NewName?: string })?.NewName ?? '',
        });
        iconType = ResourceType.Group;
        viewOnRobloxLink = groupPath;
        viewBasicSettingsLink = groupProfilePath;
        break;
      }
      case GroupAuditLogActionTypeEnum.ChangeOwner: {
        translationString = translate(`Message.ChangeOwner`, {
          actor: response.actor?.user?.username ?? '',
          user: (response.description as { NewOwnerName?: string })?.NewOwnerName ?? '',
        });
        iconType = ResourceType.Group;
        viewOnRobloxLink = groupPath;
        viewBasicSettingsLink = groupProfilePath;
        break;
      }
      case GroupAuditLogActionTypeEnum.BuyAd: {
        translationString = translate(`Message.BuyAd`, {
          actor: response.actor?.user?.username ?? '',
          bid: (response.description as { Bid?: string })?.Bid ?? '',
          adName: (response.description as { AdName?: string })?.AdName ?? '',
        });
        iconType = ResourceType.Robux;
        viewBasicSettingsLink = adsPath;
        break;
      }
      case GroupAuditLogActionTypeEnum.JoinGroup: {
        translationString = translate(`Message.JoinGroup`, {
          actor: response.actor?.user?.username ?? '',
        });
        iconType = ResourceType.User;
        viewBasicSettingsLink = groupMemberPath;
        break;
      }
      case GroupAuditLogActionTypeEnum.LeaveGroup: {
        translationString = translate(`Message.LeaveGroup`, {
          actor: response.actor?.user?.username ?? '',
        });
        iconType = ResourceType.User;
        viewBasicSettingsLink = groupMemberPath;
        break;
      }
      case GroupAuditLogActionTypeEnum.RemoveMember: {
        translationString = translate(`Message.RemoveMember`, {
          actor: response.actor?.user?.username ?? '',
          user: (response.description as { TargetName?: string })?.TargetName ?? '',
        });
        iconType = ResourceType.User;
        viewBasicSettingsLink = groupMemberPath;
        break;
      }
      case GroupAuditLogActionTypeEnum.UpdateGroupIcon: {
        translationString = translate(`Message.UpdateGroupIcon`, {
          actor: response.actor?.user?.username ?? '',
        });
        iconType = ResourceType.Group;
        viewOnRobloxLink = groupPath;
        viewBasicSettingsLink = groupProfilePath;
        break;
      }
      default:
        iconId = 0;
        iconType = ResourceType.Group;
        translationString = '';
        changedByLink = '';
        viewBasicSettingsLink = '';
        viewOnRobloxLink = '';
    }
  } catch {
    iconType = ResourceType.Group;
    translationString = '';
  }

  switch (iconType) {
    case ResourceType.User:
      iconId =
        (response.description as { TargetId?: number })?.TargetId ??
        response.actor?.user?.userId ??
        0;
      thumbnailLink = (response.description as { TargetId?: number })?.TargetId
        ? targetUserPath
        : userPath;
      break;
    case ResourceType.Group:
      iconId = Number(groupId);
      thumbnailLink = groupPath;
      break;
    case ResourceType.Place:
      iconId = (response.description as { AssetId?: number })?.AssetId ?? 0;
      thumbnailLink = placePath;
      break;
    case ResourceType.Asset:
      iconId = (response.description as { AssetId?: number })?.AssetId ?? 0;
      thumbnailLink = assetPath;
      break;
    default:
      iconId = 0;
      thumbnailLink = '';
  }

  return {
    filters,
    id: JSON.stringify(response),
    iconId,
    iconType,
    translationString,
    username: response.actor?.user?.username,
    usernameMetadata,
    location,
    changedByLink,
    locationLink,
    thumbnailLink,
    viewBasicSettingsLink,
    viewOnRobloxLink,
    dateTime,
  };
}

// Once activity feed service is set up, we can import the service response interface from there
// For now it will be hard coded here
export interface OrganizationActivityFeedEvent {
  id: number;
  eventType: EventType;
  userId: number;
  organizationId: number;
  resourceId?: number;
  metaData: string;
  createdUnixTimeMs: number;
}

export interface OragizationActivityFeedServiceResponse {
  events: OrganizationActivityFeedEvent[];
  nextCursor: string | undefined;
  hasMore: boolean | undefined;
}

export function useOrganizationActivityFeedItemInfo(
  groupId: string,
  responses: OrganizationActivityFeedEvent[],
  auditLogResponse?: GroupAuditLogResponsePage,
) {
  const { translate } = useTranslation();
  const { locale } = useLocalization();

  const [usernames, setUsernames] = useState('');
  const [universePlaceIds, setUniversePlaceIds] = useState<Record<string, number>>({});
  const [activityFeedItemInfo, setActivityFeedItemInfo] = useState<
    OrganizationActivityFeedItemInfo[]
  >([]);
  const [loadingInfo, setLoadingInfo] = useState<boolean>(true);
  const [error, setError] = useState(false);

  const getDateTime = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale ?? Locale.English, {
      dateStyle: 'long',
      timeStyle: 'short',
    });
    return (createdUtc: number | Date) => {
      if (createdUtc instanceof Date) {
        return formatter.format(createdUtc);
      }
      const dateText = new Date(createdUtc);
      return formatter.format(dateText);
    };
  }, [locale]);

  // Fetch usernames associated with all events.
  useEffect(() => {
    const getUsernames = async () => {
      setLoadingInfo(true);

      // Create a set of all unique user ids to make a batched request
      const userIds = new Set<number>();
      responses.forEach((res) => {
        userIds.add(res.userId);
        if (usernameEvents.has(res.eventType) && res.resourceId) {
          userIds.add(res.resourceId);
        }
      });

      // Send request for user data
      if (userIds.size !== 0) {
        try {
          const usersResponse = await usersClient.getUsersByIds(Array.from(userIds));
          if (!usersResponse.data) throw new Error('Data was null in getUsersByIds response');
          const usernameMap = Object.fromEntries(
            usersResponse.data
              .filter((user) => user.id && user.displayName)
              .map((user) => [user.id, user.displayName]),
          );
          setUsernames(usernameMap);
        } catch {
          setError(true);
        }
      }

      setLoadingInfo(false);
    };

    getUsernames();
  }, [responses]);

  // Fetch place id associated with all universe events.
  useEffect(() => {
    const getUniverseDetails = async () => {
      // Create a set of all unique universes to make a batched request
      const universeIds = new Set<number>();
      responses.forEach((res) => {
        if (
          universeEvents.has(res.eventType) &&
          res.resourceId &&
          res.resourceId !== Number(groupId)
        )
          universeIds.add(res.resourceId);
      });

      // Send request for universe data
      if (universeIds.size !== 0) {
        try {
          const universeDetailResponse = await developClient.getUniversesDetails(
            Array.from(universeIds),
          );
          const universePlaceIdMap = Object.fromEntries(
            (universeDetailResponse.data || [])
              .filter((universe) => universe.id && universe.rootPlaceId)
              .map((universe) => [universe.id, universe.rootPlaceId]),
          );
          setUniversePlaceIds(universePlaceIdMap);
        } catch {
          // ignore the error. If an error happens, thumbnails will be empty. nothing breaks
        }
      }
    };

    getUniverseDetails();
  }, [responses, groupId]);

  // If the pre-requisite metadata (e.g. usernames) is finished loading, parse all activity feed events.
  useEffect(() => {
    // If any data is still being fetched, return early.
    if (loadingInfo) {
      return;
    }
    // Else, parse all the data.
    const newActivityFeedItemInfo = [];
    for (let i = 0; i < responses.length; i += 1) {
      newActivityFeedItemInfo.push(
        parseOrganizationActivityFeedItemInfo(
          groupId,
          responses[i],
          usernames,
          getDateTime,
          translate,
          universePlaceIds,
        ),
      );
    }
    auditLogResponse?.forEach((auditLogItem) => {
      newActivityFeedItemInfo.push(
        parseGroupAuditLogItemInfo(groupId, auditLogItem, getDateTime, translate),
      );
    });
    setActivityFeedItemInfo(
      newActivityFeedItemInfo.sort((a, b) => b.filters.createdUtc - a.filters.createdUtc),
    );
  }, [
    loadingInfo,
    getDateTime,
    responses,
    translate,
    usernames,
    groupId,
    universePlaceIds,
    auditLogResponse,
  ]);

  return {
    isLoading: loadingInfo,
    error,
    usernames: Object.values(usernames),
    activityFeedItemInfo,
  };
}
