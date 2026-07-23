import { organizationApiClient, usersClient } from '@modules/clients';
import { QueryClient, useQuery } from '@tanstack/react-query';
// eslint-disable-next-line no-restricted-imports -- importing the entire barrel file results in a circular dependency
import { sortRolesById } from '@modules/group/utils/groupUtils';
import { Invitation, RoleColorType } from '@modules/clients/organizationApi';
// eslint-disable-next-line no-restricted-imports -- importing entire module creates circular dependency
import {
  DefaultMemberRoleId,
  DefaultMemberIdPlaceholder,
} from '@modules/group/constants/groupConstants';

const ORGANIZATIONS_ROLES_KEY_PREFIX = 'organizationsApi_roles_';

export const useGetOrganizationRoles = (organizationId?: string) => {
  return useQuery({
    enabled: !!organizationId,
    queryKey: [`${ORGANIZATIONS_ROLES_KEY_PREFIX}roles`, organizationId],
    queryFn: async () => {
      if (!organizationId) {
        return undefined;
      }
      const response =
        await organizationApiClient.roleClient.getRolesByOrganization(organizationId);
      if (!response.roles?.find((role) => role.id === DefaultMemberRoleId)) {
        response.roles?.push({
          id: DefaultMemberIdPlaceholder,
          name: 'Member',
          organizationId,
          color: RoleColorType.Standard,
        });
      }
      return response.roles?.sort(sortRolesById);
    },
  });
};

export const useGetUsersWithRole = (
  organizationId?: string,
  roleId?: string,
  pageToken?: string | null,
  maxPageSize?: number,
  isDefault?: boolean,
) => {
  return useQuery({
    enabled: !!organizationId || !!roleId,
    queryKey: [
      `${ORGANIZATIONS_ROLES_KEY_PREFIX}usersWithRole`,
      organizationId,
      roleId,
      isDefault,
      pageToken,
      maxPageSize,
    ],
    queryFn: async () => {
      if (!organizationId || !roleId) {
        return undefined;
      }
      const usersWithRole = isDefault
        ? await organizationApiClient.userClient.getUsersByOrganization(
            organizationId,
            pageToken ?? undefined,
            maxPageSize,
          )
        : await organizationApiClient.roleClient.getUsersWithRole(
            organizationId,
            roleId,
            pageToken ?? undefined,
            maxPageSize,
            isDefault,
          );
      const userIds = usersWithRole?.users.map((user) =>
        user?.userId ? Number.parseInt(user.userId, 10) : -1,
      );
      const usersResponse = await usersClient.getUsersByIds(userIds);
      const userMap = new Map(usersResponse.data?.map((user) => [`${user.id ?? 0}`, user]));
      return { usersWithRole, userMap };
    },
  });
};

export const useGetInvitationsByRole = (
  organizationId?: string,
  roleId?: string,
  pageToken?: string | null,
  maxPageSize?: number,
  isDefault?: boolean,
) => {
  return useQuery({
    enabled: !!organizationId || !!roleId,
    queryKey: [
      `${ORGANIZATIONS_ROLES_KEY_PREFIX}invitationsByRole`,
      organizationId,
      roleId,
      isDefault,
      pageToken,
      maxPageSize,
    ],
    queryFn: async () => {
      if (!organizationId || !roleId) {
        return undefined;
      }
      let invitationsByRole;
      if (isDefault) {
        invitationsByRole =
          await organizationApiClient.invitationClient.getInvitationsByOrganizationId(
            organizationId,
            pageToken ?? undefined,
            maxPageSize,
          );
      } else {
        invitationsByRole = await organizationApiClient.roleClient.getInvitationsWithRole(
          organizationId,
          roleId,
          pageToken ?? undefined,
          maxPageSize,
        );
      }
      return invitationsByRole;
    },
  });
};

export const useGetInvitationsWithRole = (
  organizationId?: string,
  roleId?: string,
  pageToken?: string | null,
  maxPageSize?: number,
  isDefault?: boolean,
) => {
  return useQuery({
    enabled: !!organizationId || !!roleId,
    queryKey: [
      `${ORGANIZATIONS_ROLES_KEY_PREFIX}invitationsWithRole`,
      organizationId,
      roleId,
      isDefault,
      pageToken,
      maxPageSize,
    ],
    queryFn: async () => {
      if (!organizationId || !roleId) {
        return undefined;
      }
      let invitationsWithRole;
      if (isDefault) {
        invitationsWithRole =
          await organizationApiClient.invitationClient.getInvitationsByOrganizationId(
            organizationId,
            pageToken ?? undefined,
            maxPageSize,
          );
      } else {
        invitationsWithRole = await organizationApiClient.roleClient.getInvitationsWithRole(
          organizationId,
          roleId,
          pageToken ?? undefined,
          maxPageSize,
        );
      }
      const invitationRoles = await Promise.all(
        invitationsWithRole!.invitations.map(async (invitation: Invitation) => {
          if (!invitation.id) {
            return null;
          }
          const roleIdsByInvitation =
            await organizationApiClient.invitationClient.getRoleIdsByInvitationId(
              organizationId!,
              invitation.id,
            );
          return {
            userId: invitation.recipientUserId ?? '',
            roleIds: roleIdsByInvitation?.roleIds ?? [],
            invitationId: invitation.id,
          };
        }),
      );
      const userIds = invitationsWithRole.invitations.map((invitation: Invitation) =>
        invitation?.recipientUserId ? Number.parseInt(invitation.recipientUserId, 10) : -1,
      );
      const usersResponse = await usersClient.getUsersByIds(userIds);
      const invitationsUserMap = new Map(
        usersResponse.data?.map((user) => [`${user.id ?? 0}`, user]),
      );
      const invitationsPageToken = invitationsWithRole.pageToken;
      return { invitationRoles, invitationsUserMap, invitationsPageToken };
    },
  });
};

export const invalidateInvitationQueries = (
  queryClient: QueryClient,
  organizationId: string,
  roleIds?: string[] | null,
) => {
  queryClient.invalidateQueries({
    predicate(query) {
      return !!(
        (query.queryKey[0] === `${ORGANIZATIONS_ROLES_KEY_PREFIX}invitationsWithRole` ||
          query.queryKey[0] === `${ORGANIZATIONS_ROLES_KEY_PREFIX}invitationsByRole`) &&
        query.queryKey[1] === organizationId &&
        (query.queryKey[3] || roleIds?.includes(query.queryKey[2] as string))
      );
    },
  });
};

export const invalidateMemberQueries = (
  queryClient: QueryClient,
  organizationId: string,
  roleIds?: string[] | null,
) => {
  queryClient.invalidateQueries({
    predicate(query) {
      return !!(
        query.queryKey[0] === `${ORGANIZATIONS_ROLES_KEY_PREFIX}usersWithRole` &&
        query.queryKey[1] === organizationId &&
        (query.queryKey[3] || roleIds?.includes(query.queryKey[2] as string))
      );
    },
  });
};
