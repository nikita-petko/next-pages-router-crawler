import { useState } from 'react';
import useCurrentOrganization from '@modules/group/hooks/useCurrentOrganization';
import { useQueryClient } from '@tanstack/react-query';
import {
  EntityDetails,
  CreatorDetails,
  EntityPermissionsMetadata,
  PermissionResponse,
  PermissionRequest,
} from '../utils/types';
import { EntityTypes } from '../utils/enums';
import UniverseMetadata from '../entities/universe.json';
import OrganizationMetadata from '../entities/organization.json';
import { useGetAllPermissions, getQueryKey, updateAllPermissions } from './queries/permissions';

const EntityConfig = {
  [EntityTypes.ORGANIZATION]: {
    metadata: OrganizationMetadata as EntityPermissionsMetadata,
  },
  [EntityTypes.UNIVERSE]: {
    metadata: UniverseMetadata as EntityPermissionsMetadata,
  },
};

export type UsePermissionsResult = {
  metadata?: EntityPermissionsMetadata;
  isPending: boolean;
  isError: boolean;
  isSaving: boolean;
  permissionData?: Record<string, PermissionResponse>;
  savePermissions: (permissionsData: Record<string, PermissionRequest>) => Promise<void>;
};

export default function usePermissions(
  creator?: CreatorDetails,
  entity?: EntityDetails,
): UsePermissionsResult {
  const { metadata } = entity ? EntityConfig[entity.type] : {};
  const { organization } = useCurrentOrganization();
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const {
    data: permissionsData,
    isError,
    isPending,
    refetch,
  } = useGetAllPermissions(creator, entity, organization ?? undefined);

  const savePermissions = async (updatedPermissions: Record<string, PermissionRequest>) => {
    setIsSaving(true);
    try {
      await updateAllPermissions(creator, entity, organization ?? undefined, updatedPermissions);
      queryClient.invalidateQueries({
        queryKey: getQueryKey(creator, entity, organization ?? undefined),
      });
      await refetch();
    } finally {
      setIsSaving(false);
    }
  };
  return {
    metadata,
    isPending,
    isError,
    isSaving,
    permissionData: permissionsData,
    savePermissions,
  };
}
