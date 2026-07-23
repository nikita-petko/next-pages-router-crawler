import { useAuthentication } from '@modules/authentication/providers';
import organizationApiClient from '@modules/clients/organizationApi';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';
import { UpdateRolePositionRequestModel } from '@rbx/clients/organizationsServiceApi';
import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getUniversePermissions,
  getOrganization,
  getUserPermissions,
} from './organizationsRequest';

const queryPrefix = 'organizations';

const getQueryKeyForGetRolesByOrganizationId = (organizationId: string | undefined) =>
  `${queryPrefix}roles${organizationId}`;
export function useGetRolesByOrganizationId(organizationId: string | undefined) {
  return useQuery({
    enabled: organizationId !== undefined && organizationId !== '',
    queryKey: [getQueryKeyForGetRolesByOrganizationId(organizationId)],
    queryFn: async () => {
      if (!organizationId) {
        return Promise.reject(
          new Error(
            'Tried to fetch all roles for an organization but organization id was undefined',
          ),
        );
      }

      const allRolesResponse =
        await organizationApiClient.roleClient.getRolesByOrganization(organizationId);

      return allRolesResponse.roles;
    },
  });
}
type TUseUpdateRolePositionProps = {
  organizationId: string;
  roleId: string;
  previousRoleId?: string;
  nextRoleId?: string;
};

export function useUpdateRolePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      organizationId,
      roleId,
      previousRoleId,
      nextRoleId,
    }: TUseUpdateRolePositionProps) => {
      const body: UpdateRolePositionRequestModel = {};
      if (previousRoleId) body.previousRoleId = previousRoleId;
      if (nextRoleId) body.nextRoleId = nextRoleId;

      const response = await organizationApiClient.roleClient.updateRolePosition(
        organizationId,
        roleId,
        body,
      );

      return response.success;
    },
    onSettled: (...args) => {
      const mutationVariables = args[2];
      const { organizationId } = mutationVariables;
      queryClient.invalidateQueries({
        queryKey: [getQueryKeyForGetRolesByOrganizationId(organizationId)],
      });
    },
  });
}

export function useUniversePermissions(universeId: string | number | undefined) {
  return useQuery({
    queryKey: [queryPrefix, 'universe-permissions', universeId],
    queryFn:
      typeof universeId !== 'undefined' && universeId !== uninitializedUniverseId
        ? () => getUniversePermissions(universeId)
        : skipToken,
  });
}

export function useGetOrganizationMapping(groupId: number | undefined) {
  return useQuery({
    queryKey: [queryPrefix, groupId, 'groupMapping'],
    queryFn: groupId ? () => getOrganization(groupId) : skipToken,
  });
}

export function useGetOrganizationPermissionsByGroupId(groupId: number | undefined) {
  const { data: groupMapping } = useGetOrganizationMapping(groupId);
  const { user } = useAuthentication();

  return useQuery({
    queryKey: [queryPrefix, groupMapping?.id, 'organization-permissions'],
    queryFn: groupMapping?.id ? () => getUserPermissions(groupMapping?.id, user?.id) : skipToken,
  });
}
