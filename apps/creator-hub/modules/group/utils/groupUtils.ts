import type { CSSProperties } from 'react';
import type { RobloxGroupsApiSocialLinkResponseTypeEnum } from '@rbx/client-groups/v1';
import type { RoleMetadata } from '@rbx/client-organizations-service-api/v1';
import { RoleColorType } from '@rbx/client-organizations-service-api/v1';
import type { GroupSocialLink } from '@modules/clients/groups';
import groupsClient from '@modules/clients/groups';
import type { User } from '@modules/clients/users';
import usersClient from '@modules/clients/users';
import {
  DefaultMemberRoleId,
  GroupSocialLinkTypesPatternMap,
  GroupSocialLinkTypesToNameMap,
  RoleColorTypeToHexMap,
  SupportedRoleColorTypes,
} from '../constants/groupConstants';

export const sanitizeGroupLinkType = (
  linkType: RobloxGroupsApiSocialLinkResponseTypeEnum | undefined,
) => {
  return linkType !== undefined
    ? (GroupSocialLinkTypesToNameMap.get(linkType) ?? linkType)
    : linkType;
};

export const validateGroupSocialLink = (link: GroupSocialLink) => {
  if (!link.url || link.type === undefined) {
    return true;
  } // No selection to validate yet

  const sanitizedLinkType = sanitizeGroupLinkType(link.type);
  return GroupSocialLinkTypesPatternMap.get(`${sanitizedLinkType}`)?.test(link.url) ?? false;
};

export const searchUsers = async (keyword: string): Promise<User[]> => {
  if (keyword.length === 0) {
    return [];
  }

  try {
    const searchResponse = await usersClient.searchUsers(keyword);
    return searchResponse?.data ?? [];
  } catch {
    return [];
  }
};

export const checkGroupMembership = async (groupId: number, userId: number): Promise<boolean> => {
  try {
    const rolesResponse = await groupsClient.getUsersGroupRoles(userId);

    const group = rolesResponse.data?.filter((role) => role.group?.id === groupId);

    return group?.length !== 0;
  } catch {
    return false;
  }
};

export const findGroupMemberByUsername = async (
  groupId: number,
  username: string,
): Promise<User | null> => {
  if (username.length === 0) {
    return null;
  }

  try {
    const matches = await searchUsers(username);
    const user = matches.length > 0 ? matches[0] : undefined;

    if (user?.id && user.name?.match(username)) {
      const isGroupMember = await checkGroupMembership(groupId, user.id);
      return isGroupMember ? user : null;
    }
  } catch {
    return null;
  }

  return null;
};

export const getRoleStyle = (
  color?: RoleColorType,
  themeMode?: string,
  property: 'fill' | 'background' = 'fill',
): CSSProperties => {
  let hex = RoleColorTypeToHexMap.get(color ?? RoleColorType.Invalid);

  if (hex === 'FFFFFF' && themeMode === 'light') {
    hex = '000000';
  }

  return { [property]: `#${hex}` };
};

export const sortRolesByName = (a: RoleMetadata, b: RoleMetadata) => {
  if (a.name === null || a.name === undefined) {
    return 1; // Place objects with missing 'name' values at the end
  }
  if (b.name === null || b.name === undefined) {
    return -1; // Place objects with missing 'name' values at the end
  }

  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  return 0;
};

export const sortRolesById = (a: RoleMetadata, b: RoleMetadata) => {
  if (a.id === DefaultMemberRoleId) {
    return -1;
  }

  if (b.id === DefaultMemberRoleId) {
    return 1;
  }

  if (a.id === null || a.id === undefined || b.id === null || b.id === undefined) {
    return sortRolesByName(a, b); // Use name if id is undefined
  }

  const idA = parseInt(a.id, 10);
  const idB = parseInt(b.id, 10);
  const sorted = idA - idB;

  return sorted === 0 ? sortRolesByName(a, b) : sorted;
};

export const getRandomRoleColorType = () => {
  const randomIndex = Math.floor(Math.random() * SupportedRoleColorTypes.length);
  const randomColor = SupportedRoleColorTypes[randomIndex];
  return RoleColorType[randomColor as keyof typeof RoleColorType];
};

export default {
  sanitizeGroupLinkType,
  validateGroupSocialLink,
  findGroupMemberByUsername,
  sortRolesByName,
  sortRolesById,
  getRandomRoleColorType,
  checkGroupMembership,
  searchUsers,
};
