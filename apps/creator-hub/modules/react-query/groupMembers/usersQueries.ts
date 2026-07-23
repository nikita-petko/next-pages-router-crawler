import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Member } from '@rbx/client-organizations-service-api/v1';
import organizationApiClient from '@modules/clients/organizationApi';
import type { InvitedMember } from '@modules/group/constants/groupConstants';
import { invalidateInvitationQueries, invalidateMemberQueries } from './rolesQueries';

export type TChangeUserRolesProps = {
  organizationId: string;
  member: Member | InvitedMember;
  roleId: string;
};

const GET_USERS_BY_ORGANIZATION_ID_QUERY_PREFIX = 'organizationsApi_users';
export const useGetUsersByOrganizationId = (
  organizationId?: string,
  pageToken?: string,
  maxPageSize?: number,
) => {
  return useQuery({
    enabled: !!organizationId,
    queryKey: [GET_USERS_BY_ORGANIZATION_ID_QUERY_PREFIX, organizationId, pageToken, maxPageSize],
    queryFn: async () => {
      return organizationApiClient.userClient.getUsersByOrganization(
        organizationId!,
        pageToken,
        maxPageSize,
      );
    },
  });
};

export const useAddUserToRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, member, roleId }: TChangeUserRolesProps) => {
      return organizationApiClient.userClient.addUserToRole(
        organizationId,
        member.userId ?? '',
        roleId,
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [GET_USERS_BY_ORGANIZATION_ID_QUERY_PREFIX, variables.organizationId],
      });
      if (!('invitationId' in variables.member)) {
        invalidateMemberQueries(queryClient, variables.organizationId, [
          variables.roleId,
          ...(variables.member.roles?.map((role) => role.id) ?? []),
        ]);
      } else {
        invalidateInvitationQueries(queryClient, variables.organizationId, [
          variables.roleId,
          ...(variables.member.roles?.map((role) => role.id) ?? []),
        ]);
      }
    },
  });
};

export const useRemoveUserFromRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, member, roleId }: TChangeUserRolesProps) => {
      return organizationApiClient.userClient.removeUserFromRole(
        organizationId,
        member.userId ?? '',
        roleId,
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [GET_USERS_BY_ORGANIZATION_ID_QUERY_PREFIX, variables.organizationId],
      });
      variables.member.roles?.forEach((role) => {
        if (!('invitationId' in variables.member)) {
          invalidateMemberQueries(queryClient, variables.organizationId, [role.id]);
        } else {
          invalidateInvitationQueries(queryClient, variables.organizationId, [role.id]);
        }
      });
    },
  });
};

type TRemoveMemberProps = {
  organizationId: string;
  member: Member;
};

export const useRemoveMemberFromOrg = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, member }: TRemoveMemberProps) => {
      return organizationApiClient.userClient.removeUserFromOrganization(
        organizationId,
        member.userId ?? '',
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [GET_USERS_BY_ORGANIZATION_ID_QUERY_PREFIX, variables.organizationId],
      });
      invalidateMemberQueries(
        queryClient,
        variables.organizationId,
        variables.member.roles?.map((role) => role.id),
      );
    },
  });
};
