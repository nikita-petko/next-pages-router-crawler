import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import type {
  GetAssetAccessPropertiesRequest,
  GetAssetDependenciesResult,
  GetAssetDependenciesResultCreator,
} from '@rbx/client-asset-permissions-api/v1';
import {
  AssetGrantableAction,
  CreatorType,
  EligibilityStatus,
  MetadataState,
  SubjectType,
} from '@rbx/client-asset-permissions-api/v1';
import assetPermissionsApiClient from '@modules/clients/assetPermissions';
import Asset from '@modules/miscellaneous/common/enums/Asset';
import { AssetDependencyFilter, getFilteredDependencies } from './assetDependencyFilters';
import useFetchDependencyCreatorInfo from './assetPermissionsHelperQueries';

// NOTE: This is needed to prevent query key clashes since the query key isn’t affected by which file it is in.
const KEY_PREFIX = 'assetsPermissionApi_';

const POLLING_INTERVAL_MS = 1000;

export enum AssetPrivacyLevel {
  Restricted = 'Restricted',
  OpenUse = 'OpenUse',
}

// These asset types are not onboarded to Asset Access Control (AAC), but are still considered Restricted
export const NON_AAC_ASSET_TYPES = [
  Asset.Plugin, // Although plugins are not an AAC asset type, they are quasi-restricted
];

// The asset types have user-updatable access status, subject to restrictions
// These restrictions include (may not be exhaustive):
// - Must be opted into Asset Access Control (otherwise, these assets are always
//   OpenUse)
// - Decals can only be made OpenUse if their underlying Image child is OpenUse
export const USER_UPDATABLE_ACCESS_STATUS_ASSET_TYPES = [Asset.Decal, Asset.Image, Asset.Mesh];

// Eligibility status (CanDistributeOnStore, CanShareWithCollaborators, CanSetToOpenUse) is only calculated for Creator Store composite assets
const ASSET_TYPES_ENABLED_FOR_ELIGIBILITY_STATUS = [Asset.Decal, Asset.MeshPart, Asset.Model];

function getAssetEligibilityStatusKey(assetId: number) {
  return [`${KEY_PREFIX}getAssetActionEligibilityStatus`, assetId];
}

function getAssetOpenUseKey(assetId: number) {
  return [`${KEY_PREFIX}getAssetOpenUse`, assetId];
}

export function getUserAssetPrivacyDefaultKey(userId: number) {
  return [`${KEY_PREFIX}getUserAssetPrivacyDefault`, userId];
}

export function getGroupAssetPrivacyDefaultKey(groupId: number) {
  return [`${KEY_PREFIX}getGroupAssetPrivacyDefault`, groupId];
}

export type ExtendedGetAssetDependenciesResult = GetAssetDependenciesResult & {
  creatorName?: string;
};

export function useGetAssetDependencies(
  assetId: number,
  assetDependencyFilter: AssetDependencyFilter = AssetDependencyFilter.All,
  includeAccessStatus: boolean = false,
  includeCreatorName: boolean = false,
  parentCreator: { id: number; type: CreatorType } | null = null,
  enabled: boolean = true,
) {
  const shouldIncludeAccessStatus =
    includeAccessStatus || assetDependencyFilter !== AssetDependencyFilter.All;

  /*
   * First, get and cache all the dependencies for the asset (considering only
   * the access status parameter).
   *
   * We are separating this from the filtering step to allow for caching at the API-response level
   * This allows us to make two separate calls to useGetAssetDependencies (one
   * for open use dependencies created by the parent creator and one for
   * restricted dependencies created by other creators) without having to make
   * an additional API call.
   */
  const allDependenciesQuery = useQuery({
    queryKey: [`${KEY_PREFIX}getAssetDependencies_raw`, assetId, shouldIncludeAccessStatus],
    queryFn: async () => {
      const response = await assetPermissionsApiClient.getAssetDependencies(
        assetId,
        shouldIncludeAccessStatus,
      );
      return response.results;
    },
    enabled,
  });

  // Apply filtering to raw data
  const filteredDependencies = React.useMemo(() => {
    if (!allDependenciesQuery.data) {
      return undefined;
    }

    return getFilteredDependencies(
      allDependenciesQuery.data,
      assetDependencyFilter,
      shouldIncludeAccessStatus,
      parentCreator,
    );
  }, [allDependenciesQuery.data, assetDependencyFilter, shouldIncludeAccessStatus, parentCreator]);

  // Extract creator keys from filtered dependencies
  const creatorKeys: GetAssetDependenciesResultCreator[] = React.useMemo(() => {
    if (!filteredDependencies || !includeCreatorName) {
      return [];
    }

    return filteredDependencies
      .map((dependency) => dependency?.creator)
      .filter(
        (creator): creator is GetAssetDependenciesResultCreator =>
          creator?.id !== undefined && creator?.type !== undefined,
      );
  }, [filteredDependencies, includeCreatorName]);

  // Fetch creator names if needed
  const creatorInfoQuery = useFetchDependencyCreatorInfo(
    creatorKeys,
    includeCreatorName && allDependenciesQuery.isSuccess && creatorKeys.length > 0,
  );

  // Combine the data
  const extendedDependenciesData = React.useMemo(() => {
    if (!filteredDependencies) {
      return undefined;
    }
    if (!includeCreatorName || !creatorInfoQuery.data) {
      return filteredDependencies as ExtendedGetAssetDependenciesResult[];
    }

    return filteredDependencies.map((dependency) => {
      const creator = dependency?.creator;
      if (!creator?.id || !creator?.type) {
        return dependency;
      }

      return {
        ...dependency,
        creatorName: creatorInfoQuery.data.get(creator),
      };
    }) as ExtendedGetAssetDependenciesResult[];
  }, [filteredDependencies, creatorInfoQuery.data, includeCreatorName]);

  return {
    data: extendedDependenciesData,
    error: allDependenciesQuery.error || creatorInfoQuery.error,
    isError: allDependenciesQuery.isError || (includeCreatorName && creatorInfoQuery.isError),
    isPending: allDependenciesQuery.isPending || (includeCreatorName && creatorInfoQuery.isPending),
    isSuccess:
      allDependenciesQuery.isSuccess && (!includeCreatorName || creatorInfoQuery.isSuccess),
  };
}

export function useGetAssetDependenciesCount(assetId: number, enabled: boolean) {
  return useQuery({
    queryKey: [`${KEY_PREFIX}getAssetDependenciesCount`, assetId],
    queryFn: async () => {
      const response = await assetPermissionsApiClient.getAssetDependencies(
        assetId,
        false, // includeAccessStatus
        true, // returnCountOnly
      );
      return response.dependenciesCount;
    },
    enabled,
  });
}

export function useGetAssetEligibilityStatus(assetId: number, assetType: Asset, enabled: boolean) {
  return useQuery({
    enabled,
    queryKey: getAssetEligibilityStatusKey(assetId),
    queryFn: async () => {
      if (!ASSET_TYPES_ENABLED_FOR_ELIGIBILITY_STATUS.includes(assetType)) {
        /*
         * Rather than each component having to first check if the asset type is eligible for eligibility status,
         * we can just return true here for all actions.
         *
         * This is safe because, even if these asset types change in the future,
         * each of these actions has a corresponding backend check. This
         * frontend check is simply used to block actions in the UI.
         */
        return {
          canDistributeOnStore: true,
          canShareWithCollaborators: true,
          canSetToOpenUse: true,
          isEligibilityPending: false,
        };
      }

      const eligibilityStatus = await assetPermissionsApiClient.getAssetEligibilityStatus(assetId);
      return {
        canDistributeOnStore:
          eligibilityStatus.canBeDistributedOnStore?.status === EligibilityStatus.Eligible,
        canShareWithCollaborators:
          eligibilityStatus.canBeShared?.status === EligibilityStatus.Eligible,
        canSetToOpenUse: eligibilityStatus.canBeSetToOpenUse?.status === EligibilityStatus.Eligible,
        isEligibilityPending:
          eligibilityStatus.metadataState === MetadataState.MissingMetadataRecord ||
          eligibilityStatus.metadataState === MetadataState.OutdatedMetadataRecord,
      };
    },
    refetchInterval: ({ state }) => {
      /*
       * When a new composite asset or composite asset version is created,
       * Content Platform's asset-metadata-service calculates whether the asset
       * can be distributed, shared, or made open use based on the status of its dependencies.
       * This process can take a few seconds.
       *
       * This polling is active until the asset-metadata-service has finished calculating the asset's eligibility.
       */
      const isPending = state.data?.isEligibilityPending;
      return isPending ? POLLING_INTERVAL_MS : false;
    },
  });
}

export function useGetAssetIsOpenUse(
  assetId: number,
  isCreatorEligibleForAssetAccessBeta: boolean,
  enabled: boolean,
  assetType?: Asset,
) {
  return useQuery({
    queryKey: getAssetOpenUseKey(assetId),
    queryFn: async () => {
      if (!assetType || NON_AAC_ASSET_TYPES.includes(assetType)) {
        return false;
      }

      // All asset types that can be made open use by users are open use for non-eligible creators
      if (
        !isCreatorEligibleForAssetAccessBeta &&
        USER_UPDATABLE_ACCESS_STATUS_ASSET_TYPES.includes(assetType)
      ) {
        return true;
      }

      const request: GetAssetAccessPropertiesRequest = { assetId };
      const permissions = await assetPermissionsApiClient.batchGetAssetAccessProperties([request]);
      const isOpenUse = permissions?.results?.[0]?.value?.isOpenUse ?? false;
      return isOpenUse;
    },
    enabled,
  });
}

export function useSetAssetOpenUse(assetId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [`${KEY_PREFIX}useSetAssetOpenUse`, assetId],
    // Will return whether the asset was successfully set to OpenUse
    mutationFn: async () => {
      // We should only be setting the asset itself to OpenUse, not any of its dependencies.
      const assetGrantRequest = {
        assetId,
        grantToDependencies: false,
      };
      // Since this call is made from the asset configuration page, the user should already have direct access to the asset.
      const enableDeepAccessCheck = false;

      const result = await assetPermissionsApiClient.batchGrantAssetPermissions(
        [], // Won't be used since the flag is true
        [assetGrantRequest],
        enableDeepAccessCheck,
        SubjectType.All,
        '',
        AssetGrantableAction.Use,
        true, // This can be an unflagged change since the codepath itself is behind AAC flags
      );

      // The API will return a 200, even if the asset was not successfully set to OpenUse
      // Accordingly, the successAssetIds must be directly checked
      return result?.successAssetIds?.includes(assetId);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(getAssetOpenUseKey(assetId), data);
    },
    onError: () => {
      return false;
    },
  });
}

export function useGetUserAssetPrivacyDefault(
  userId: number,
  refetchOnWindowFocus: boolean = false,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: getUserAssetPrivacyDefaultKey(userId),
    queryFn: async () => {
      const response = await assetPermissionsApiClient.getUserPermissionSettings(userId);
      switch (response.createAssetsAsRestricted) {
        case true:
          return AssetPrivacyLevel.Restricted;
        case false:
          return AssetPrivacyLevel.OpenUse;
        default:
          return AssetPrivacyLevel.Restricted;
      }
    },
    enabled,
    refetchOnWindowFocus,
  });
}

export function useGetGroupAssetPrivacyDefault(
  groupId: number,
  refetchOnWindowFocus: boolean = false,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: getGroupAssetPrivacyDefaultKey(groupId),
    queryFn: async () => {
      const response = await assetPermissionsApiClient.getGroupPermissionSettings(groupId);
      switch (response.createAssetsAsRestricted) {
        case true:
          return AssetPrivacyLevel.Restricted;
        case false:
          return AssetPrivacyLevel.OpenUse;
        default:
          return AssetPrivacyLevel.Restricted;
      }
    },
    enabled,
    refetchOnWindowFocus,
  });
}

export type updateAssetPrivacyDefaultMutationVariables = {
  creatorId: number;
  isRestricted: boolean;
};

export function useUpdateUserAssetPrivacyDefault() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [`${KEY_PREFIX}updateUserAssetPrivacyDefault`],
    mutationFn: async (variables: updateAssetPrivacyDefaultMutationVariables) => {
      const { creatorId: userId, isRestricted } = variables;
      await assetPermissionsApiClient.updateUserPermissionSettings(userId, {
        createAssetsAsRestricted: isRestricted,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        getUserAssetPrivacyDefaultKey(variables.creatorId),
        variables.isRestricted ? AssetPrivacyLevel.Restricted : AssetPrivacyLevel.OpenUse,
      );
    },
  });
}

export function useUpdateGroupAssetPrivacyDefault() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [`${KEY_PREFIX}updateGroupAssetPrivacyDefault`],
    mutationFn: async (variables: updateAssetPrivacyDefaultMutationVariables) => {
      const { creatorId: groupId, isRestricted } = variables;
      await assetPermissionsApiClient.updateGroupPermissionSettings(groupId, {
        createAssetsAsRestricted: isRestricted,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        getGroupAssetPrivacyDefaultKey(variables.creatorId),
        variables.isRestricted ? AssetPrivacyLevel.Restricted : AssetPrivacyLevel.OpenUse,
      );
    },
  });
}

export function useGetIsUserEligibleForBeta(userId: number, enabled: boolean) {
  return useQuery({
    queryKey: [`${KEY_PREFIX}getIsUserEligibleForBeta`],
    queryFn: async () => {
      const isUserEligibleForBeta =
        await assetPermissionsApiClient.getIsUserEligibleForBeta(userId);
      return isUserEligibleForBeta;
    },
    enabled,
  });
}

export function useGetIsGroupEligibleForBeta(groupId: number, enabled: boolean) {
  return useQuery({
    queryKey: [`${KEY_PREFIX}getIsGroupEligibleForBeta`],
    queryFn: async () => {
      const isGroupEligibleForBeta =
        await assetPermissionsApiClient.getIsGroupEligibleForBeta(groupId);
      return isGroupEligibleForBeta;
    },
    enabled,
  });
}

// This is a combination of useGetIsUserEligibleForBeta and useGetIsGroupEligibleForBeta
export function useGetIsCreatorEligibleForBeta(
  creatorId: number,
  creatorType: CreatorType,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: [`${KEY_PREFIX}getIsCreatorEligibleForBeta`, creatorId, creatorType],
    queryFn: async () => {
      if (creatorType === CreatorType.User) {
        return assetPermissionsApiClient.getIsUserEligibleForBeta(creatorId);
      }

      if (creatorType === CreatorType.Group) {
        return assetPermissionsApiClient.getIsGroupEligibleForBeta(creatorId);
      }
      return false;
    },
    enabled,
  });
}
