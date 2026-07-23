import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { PermissionsApi } from '@rbx/clients/develop/v2';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { RoleApi, UniversesApi } from '@rbx/clients/organizationsServiceApi';
import SecureRedirectMiddleware from '@modules/clients/utils/SecureRedirectMiddleware';
import { getBEDEV1ServiceBasePath, getBEDEV2ServiceBasePath } from '@modules/clients/utils';
import { Organization } from '@modules/clients/organizationApi';
import UniverseMetadata from '../../entities/universe.json';
import { CreatorTypes, EntityTypes } from '../../utils/enums';
import { toPermissionsMap } from '../../utils/permission';
import {
  CreatorDetails,
  EntityDetails,
  EntityPermissionsMetadata,
  PermissionRequest,
  PermissionResponse,
} from '../../utils/types';

// TODO: maybe we should move these to @modules/clients
const orgApiConfiguration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath: getBEDEV2ServiceBasePath('orgs'),
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
  middleware: [new SecureRedirectMiddleware()],
});

const roleApi = new RoleApi(orgApiConfiguration);
const universesApi = new UniversesApi(orgApiConfiguration);

const developPermissionsApi = new PermissionsApi(
  new Configuration({
    robloxSiteDomain: process.env.robloxSiteDomain,
    basePath: getBEDEV1ServiceBasePath('develop'),
    credentials: 'include',
    unifiedLogger: unifiedLoggerClient,
  }),
);

async function getUniversePermissionsWithInheritance(
  universeId: string,
  organizationId: string,
  roleId: string,
): Promise<Record<string, PermissionResponse>> {
  const [universePermissions, rolePermissions] = await Promise.all([
    universesApi.v2UniversesUniverseIdPermissionsOrganizationsOrganizationIdRolesRoleIdGet({
      universeId,
      organizationId,
      roleId,
    }),
    roleApi.v2OrganizationsOrganizationIdRolesRoleIdPermissionsGet({
      organizationId,
      roleId,
      isDefault: false,
    }),
  ]);

  const updatedUniversePermissionsMap: Record<string, PermissionResponse> = {};
  const allUniversePermissions = (UniverseMetadata as EntityPermissionsMetadata)
    .map((permissionGroup) => permissionGroup.permissions)
    .flat();

  allUniversePermissions.forEach((permission) => {
    if (universePermissions.permissions[permission.permissionId]) {
      updatedUniversePermissionsMap[permission.permissionId] = universePermissions.permissions[
        permission.permissionId
      ] as PermissionResponse;
      if (
        permission.inheritsFrom &&
        permission.inheritsFrom.some(
          (permissionId) => rolePermissions.permissions[permissionId]?.isGranted,
        )
      ) {
        updatedUniversePermissionsMap[permission.permissionId].isInherited = true;
      }
    }
  });
  return updatedUniversePermissionsMap;
}

export function getQueryKey(
  creator?: CreatorDetails,
  entity?: EntityDetails,
  organization?: Organization,
) {
  return [
    'permissions.creatorPermissions.useGetAllPermissions',
    creator?.id ?? '',
    creator?.type ?? '',
    entity?.id ?? '',
    entity?.type ?? '',
    organization?.id ?? '',
  ];
}

export function useGetAllPermissions(
  creator?: CreatorDetails,
  entity?: EntityDetails,
  organization?: Organization,
): UseQueryResult<Record<string, PermissionResponse>> {
  return useQuery({
    queryKey: getQueryKey(creator, entity, organization),
    enabled: !!(creator && entity && (entity.owner?.type === CreatorTypes.USER || organization)),
    async queryFn() {
      if (!creator || !entity) {
        throw new Error('Missing required parameters');
      }
      switch (entity.type) {
        case EntityTypes.ORGANIZATION: {
          if (!organization) {
            throw new Error('Missing required parameters');
          }
          switch (creator.type) {
            case CreatorTypes.ROLE:
            case CreatorTypes.MEMBER_ROLE: {
              const result = await roleApi.v2OrganizationsOrganizationIdRolesRoleIdPermissionsGet({
                organizationId: organization.id,
                roleId: creator.id,
                isDefault: creator.type === CreatorTypes.MEMBER_ROLE,
              });
              return result.permissions;
            }
            default:
              throw new Error(
                `Creator type ${creator.type} not supported for entity type ${entity.type}`,
              );
          }
        }
        case EntityTypes.UNIVERSE: {
          switch (creator.type) {
            case CreatorTypes.ROLE: {
              if (!organization) {
                return {};
              }
              return getUniversePermissionsWithInheritance(
                `${entity.id}`,
                organization.id,
                creator.id,
              );
            }
            case CreatorTypes.LEGACY_ROLE: {
              const result = await developPermissionsApi.v2UniversesUniverseIdPermissionsGet({
                universeId: Number(entity.id),
              });
              return toPermissionsMap(
                result.data?.filter(
                  (permission) => permission.rolesetId === creator.id && permission.action,
                ),
              );
            }
            case CreatorTypes.USER: {
              const result = await developPermissionsApi.v2UniversesUniverseIdPermissionsGet({
                universeId: Number(entity.id),
              });
              return toPermissionsMap(
                result.data?.filter(
                  (permission) => permission.userId === creator.id && permission.action,
                ),
              );
            }
            default:
              throw new Error(
                `Creator type ${creator.type} not supported for entity type ${entity.type}`,
              );
          }
        }
        default:
          throw new Error(`Entity type ${entity.type} not supported`);
      }
    },
  });
}

export function updateAllPermissions(
  creator?: CreatorDetails,
  entity?: EntityDetails,
  organization?: Organization,
  updatedPermissions?: Record<string, PermissionRequest>,
): Promise<void> {
  if (!creator || !entity || !organization || !updatedPermissions) {
    throw new Error('Creator, entity, or organization not provided');
  }
  switch (entity.type) {
    case EntityTypes.ORGANIZATION: {
      switch (creator.type) {
        case CreatorTypes.ROLE:
        case CreatorTypes.MEMBER_ROLE: {
          return roleApi.v2OrganizationsOrganizationIdRolesRoleIdPermissionsPost({
            organizationId: organization.id,
            roleId: creator.id,
            updatePermissionsRequestModel: { permissions: updatedPermissions },
            isDefault: creator.type === CreatorTypes.MEMBER_ROLE,
          });
        }
        default:
          throw new Error(
            `Updating creator type ${creator.type} not supported for entity type ${entity.type}`,
          );
      }
    }
    case EntityTypes.UNIVERSE: {
      switch (creator.type) {
        case CreatorTypes.ROLE: {
          return universesApi.v2UniversesUniverseIdPermissionsOrganizationsOrganizationIdRolesRoleIdPost(
            {
              organizationId: organization.id,
              roleId: creator.id,
              universeId: entity.id,
              updatePermissionsRequestModel: { permissions: updatedPermissions },
            },
          );
        }
        default:
          throw new Error(
            `Creator type ${creator.type} not supported for entity type ${entity.type}`,
          );
      }
    }
    default:
      throw new Error(`Entity type ${entity.type} not supported`);
  }
}
