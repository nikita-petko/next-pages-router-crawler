import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { PermissionsApi } from '@rbx/client-develop/v2';
import type { PermissionsResponseModel } from '@rbx/client-organizations-service-api/v1';
import { RoleApi } from '@rbx/client-organizations-service-api/v1';
import type { Organization } from '@modules/clients/organizationApi';
import { createClientConfiguration } from '@modules/clients/utils/createClientConfiguration';
import { DefaultMemberRoleId } from '@modules/group/constants/groupConstants';
import { CreatorTypes, EntityTypes } from '../../utils/enums';
import type {
  CreatorFilter,
  EntityDetails,
  CreatorGroupDetails,
  DevelopPermissionsResponse,
  CreatorDetails,
} from '../../utils/types';

const developPermissionsApi = new PermissionsApi(createClientConfiguration('develop', 'bedev1'));

const organizationRolesApi = new RoleApi(createClientConfiguration('orgs', 'bedev2'));

async function getOrganizationRoles(
  organizationId: string,
  permissions?: PermissionsResponseModel,
): Promise<CreatorGroupDetails> {
  const assignableRoles = new Set([
    ...(permissions?.assignableRoleIds ?? []),
    ...(permissions?.permissionEditableRoleIds ?? []),
    ...(permissions?.metadataEditableRoleIds ?? []),
  ]);

  const response = await organizationRolesApi.v1OrganizationsOrganizationIdRolesGet({
    organizationId,
  });

  const creatorsList = response.roles
    ?.filter((role) => role.id && role.id !== DefaultMemberRoleId)
    .map((role) => ({
      id: role.id,
      name: role.name,
      color: role.color,
      disabled: !assignableRoles.has(role.id),
      type: CreatorTypes.ROLE,
      link: `/dashboard/group/roles/${role.id}`,
    }));

  return {
    type: CreatorTypes.ROLE,
    creatorsList,
  };
}

async function getLegacyRoles(
  universeId: string,
  includeUsers: boolean,
  includeLegacyRoles: boolean,
): Promise<CreatorGroupDetails[]> {
  const response: DevelopPermissionsResponse =
    await developPermissionsApi.v2UniversesUniverseIdPermissionsGet({
      universeId: Number(universeId),
    });
  const groupDetails: CreatorGroupDetails[] = [];
  if (includeUsers) {
    /* oxlint-disable typescript-eslint/no-non-null-assertion */
    const usersList = response.data
      ?.filter((permission) => permission.userId && permission.userName && permission.action)
      .map((user) => ({
        id: user.userId!,
        name: user.userName!,
        type: CreatorTypes.USER,
      }));
    /* oxlint-enable typescript-eslint/no-non-null-assertion */

    if (usersList && usersList.length > 0) {
      groupDetails.push({
        type: CreatorTypes.USER,
        creatorsList: usersList,
      });
    }
  }

  if (includeLegacyRoles) {
    const legacyRolesList = response.data
      ?.filter((permission) => permission.rolesetId && permission.rolesetName && permission.action)
      .map((role) => ({
        id: role.rolesetId!, // oxlint-disable-line typescript-eslint/no-non-null-assertion
        name: role.rolesetName!, // oxlint-disable-line typescript-eslint/no-non-null-assertion
        type: CreatorTypes.LEGACY_ROLE,
        subtext: role.groupName ?? undefined,
      }));

    if (legacyRolesList && legacyRolesList.length > 0) {
      groupDetails.push({
        type: CreatorTypes.LEGACY_ROLE,
        creatorsList: legacyRolesList,
      });
    }
  }
  return groupDetails;
}

export function getQueryKey(
  creatorFilter?: CreatorFilter,
  entity?: EntityDetails,
  organization?: Organization,
): string[] {
  return [
    'permissions.creators.useGetAllCreators',
    ...(creatorFilter?.map((filter) => JSON.stringify(filter)) ?? []),
    entity?.id ?? '',
    entity?.type ?? '',
    organization?.id ?? '',
  ];
}

export default function useGetAllCreators(
  creatorFilter?: CreatorFilter,
  entity?: EntityDetails,
  organization?: Organization,
  permissions?: PermissionsResponseModel,
): UseQueryResult<CreatorGroupDetails[] | undefined> {
  return useQuery({
    queryKey: getQueryKey(creatorFilter, entity, organization),
    enabled: !!(
      creatorFilter &&
      entity &&
      (entity.owner?.type === CreatorTypes.USER || (organization && permissions))
    ),
    async queryFn(): Promise<CreatorGroupDetails[] | undefined> {
      if (!creatorFilter || !entity) {
        throw new Error('Missing required parameters');
      }
      const allPromises = [];

      if (creatorFilter.includes(CreatorTypes.ROLE) && organization?.id) {
        allPromises.push(getOrganizationRoles(organization.id, permissions));
      }
      if (
        entity.type === EntityTypes.UNIVERSE &&
        (creatorFilter.includes(CreatorTypes.USER) ||
          creatorFilter.includes(CreatorTypes.LEGACY_ROLE))
      ) {
        allPromises.push(
          getLegacyRoles(
            entity.id,
            creatorFilter.includes(CreatorTypes.USER),
            creatorFilter.includes(CreatorTypes.LEGACY_ROLE),
          ),
        );
      }

      // flatten the nesting
      const allCreators = (await Promise.all(allPromises)).flat();

      creatorFilter
        // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
        .filter((creator) => (creator as CreatorDetails).id)
        .forEach((creatorOrCreatorType) => {
          // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
          const creator = creatorOrCreatorType as CreatorDetails;
          const existingGroup = allCreators.find((group) => group.type === creator.type);
          if (existingGroup) {
            existingGroup.creatorsList.push(creator);
          } else {
            allCreators.push({
              type: creator.type,
              creatorsList: [creator],
            });
          }
        });

      return allCreators;
    },
  });
}
