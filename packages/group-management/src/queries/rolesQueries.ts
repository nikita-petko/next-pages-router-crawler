import type { QueryClient } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  RobloxGroupsApiModelsRequestCreateRoleSetRequest,
  RobloxGroupsApiModelsRequestUpdateRoleSetRequest,
} from '@rbx/client-groups/v1';
import type {
  RobloxGroupsApiModelsRequestUpdateRoleSetPositionRequest,
  V2GroupsGroupIdUsersGetLimitEnum,
} from '@rbx/client-groups/v2';
import groupsClient from '../clients/groups';
import type { Invitation } from '../clients/organizationApi';
import organizationApiClient from '../clients/organizationApi';
import usersClient from '../clients/users';

const ORGANIZATIONS_ROLES_KEY_PREFIX = 'organizationsApi_roles_';
const GROUPS_ROLES_KEY_PREFIX = 'groupsApi_roles_';
const GROUPS_CONFIGURATION_KEY = 'groupsApi_configuration_metadata';

export function useGetGroupsRoles(groupId: string | undefined) {
  return useQuery({
    enabled: groupId !== undefined && groupId !== '',
    queryKey: [`${GROUPS_ROLES_KEY_PREFIX}all`, groupId],
    queryFn: async () => {
      if (!groupId) {
        throw new Error('Tried to fetch all roles for a group but group id was undefined');
      }

      const allRolesResponse = await groupsClient.getGroupRolesSetsInfo(Number(groupId));

      return allRolesResponse.roles;
    },
  });
}

export const useGetGroupUsersWithRoles = (
  groupId: string,
  roleId?: number,
  limit?: V2GroupsGroupIdUsersGetLimitEnum,
  cursor?: string | null,
) => {
  return useQuery({
    enabled: !!groupId,
    queryKey: [
      `${GROUPS_ROLES_KEY_PREFIX}usersWithRole`,
      groupId,
      String(roleId ?? 0),
      limit,
      cursor,
    ],
    queryFn: async () => {
      return groupsClient.getGroupUsersWithRoles({
        groupId: Number(groupId),
        roleSetId: roleId ?? 0,
        userIds: [],
        limit,
        cursor: cursor ?? undefined,
      });
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
      if (isDefault) {
        return organizationApiClient.invitationClient.getInvitationsByOrganizationId(
          organizationId,
          pageToken ?? undefined,
          maxPageSize,
        );
      }
      return organizationApiClient.roleClient.getInvitationsWithRole(
        organizationId,
        roleId,
        pageToken ?? undefined,
        maxPageSize,
      );
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
        invitationsWithRole.invitations.map(async (invitation: Invitation) => {
          if (!invitation.id) {
            return null;
          }
          const roleIdsByInvitation =
            await organizationApiClient.invitationClient.getRoleIdsByInvitationId(
              organizationId,
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
  void queryClient.invalidateQueries({
    predicate(query) {
      const keyRoleId = query.queryKey[2];
      return !!(
        (query.queryKey[0] === `${ORGANIZATIONS_ROLES_KEY_PREFIX}invitationsWithRole` ||
          query.queryKey[0] === `${ORGANIZATIONS_ROLES_KEY_PREFIX}invitationsByRole`) &&
        query.queryKey[1] === organizationId &&
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- queryKey[3] is the isDefault flag; when false we still want to fall through to the role-id match
        (query.queryKey[3] || (typeof keyRoleId === 'string' && roleIds?.includes(keyRoleId)))
      );
    },
  });
};

export const invalidateMemberQueries = (
  queryClient: QueryClient,
  groupId: string,
  roleIds?: string[] | null,
) => {
  void queryClient.invalidateQueries({
    predicate(query) {
      const keyRoleId = query.queryKey[2];
      return !!(
        query.queryKey[0] === `${GROUPS_ROLES_KEY_PREFIX}usersWithRole` &&
        query.queryKey[1] === groupId &&
        typeof keyRoleId === 'string' &&
        roleIds?.includes(keyRoleId)
      );
    },
  });
};

type TUseUpdateRoleMetadataProps = {
  groupId: number;
  rolesetId: number;
  name: string;
  description: string;
  rank: number;
  color: number;
};

export function useUpdateRoleMetadata() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      rolesetId,
      name,
      description,
      rank,
      color,
    }: TUseUpdateRoleMetadataProps) => {
      const request: RobloxGroupsApiModelsRequestUpdateRoleSetRequest = {
        name,
        description,
        rank,
        color,
      };
      return groupsClient.updateRoleSet(groupId, rolesetId, request);
    },
    onSettled: (...args) => {
      const mutationVariables = args[2];
      const { groupId } = mutationVariables;
      void queryClient.invalidateQueries({
        queryKey: [`${GROUPS_ROLES_KEY_PREFIX}all`, String(groupId)],
      });
    },
  });
}

type TUseReorderRoleProps = {
  groupId: number;
  roleId: number;
  previousRoleId?: number;
  nextRoleId?: number;
};

export function useReorderRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, roleId, previousRoleId, nextRoleId }: TUseReorderRoleProps) => {
      const request: RobloxGroupsApiModelsRequestUpdateRoleSetPositionRequest = {
        previousRoleId,
        nextRoleId,
      };
      return groupsClient.reorderRoleSet(groupId, roleId, request);
    },
    onSettled: (...args) => {
      const mutationVariables = args[2];
      const { groupId } = mutationVariables;
      void queryClient.invalidateQueries({
        queryKey: [`${GROUPS_ROLES_KEY_PREFIX}all`, String(groupId)],
      });
    },
  });
}

type TUseDeleteRoleProps = {
  groupId: number;
  rolesetId: number;
};

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, rolesetId }: TUseDeleteRoleProps) => {
      return groupsClient.deleteRoleSet(groupId, rolesetId);
    },
    onSettled: (...args) => {
      const mutationVariables = args[2];
      const { groupId } = mutationVariables;
      void queryClient.invalidateQueries({
        queryKey: [`${GROUPS_ROLES_KEY_PREFIX}all`, String(groupId)],
      });
    },
  });
}

type TUseCreateRoleProps = {
  groupId: number;
  name: string;
  description: string;
  rank: number;
  usingGroupFunds?: boolean;
};

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      name,
      description,
      rank,
      usingGroupFunds,
    }: TUseCreateRoleProps) => {
      const request: RobloxGroupsApiModelsRequestCreateRoleSetRequest = {
        name,
        description,
        rank,
        usingGroupFunds,
      };
      return groupsClient.createRoleSet(groupId, request);
    },
    onSettled: (...args) => {
      const mutationVariables = args[2];
      const { groupId } = mutationVariables;
      void queryClient.invalidateQueries({
        queryKey: [`${GROUPS_ROLES_KEY_PREFIX}all`, String(groupId)],
      });
    },
  });
}

export function useGetGroupConfigurationMetadata() {
  return useQuery({
    queryKey: [GROUPS_CONFIGURATION_KEY],
    queryFn: () => groupsClient.getConfigurationMetadata(),
  });
}
