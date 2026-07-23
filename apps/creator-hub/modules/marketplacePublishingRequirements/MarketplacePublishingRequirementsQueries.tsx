import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { marketplacePublishingRequirements } from '@modules/clients';
import {
  AssetType,
  GetRequirementsResponse,
  MarketplaceType,
  RequirementCheck,
  Restriction,
} from '@rbx/clients/marketplacePublishingRequirementsApi';

// NOTE: This is needed to prevent query key clashes since the query key isn’t affected by which file it is in.
const KEY_PREFIX = 'marketplacePublishingRequirementsService_';
const POLLING_INTERVAL_MS = 1000;

const getFetchCreatorStoreAssetConfigurationRequirementsKey = (
  assetType: AssetType,
  assetId?: number,
) => {
  return [`${KEY_PREFIX}fetchCreatorStoreAssetConfigurationRequirements`, assetType, assetId];
};

const fetchCreatorStoreAssetRequirementsShared = async (
  assetType: AssetType,
  assetId?: number,
): Promise<GetRequirementsResponse> => {
  return marketplacePublishingRequirements.getRequirements(
    MarketplaceType.Creator,
    assetType,
    undefined,
    [
      RequirementCheck.OpenUse,
      RequirementCheck.Publishing,
      RequirementCheck.Pricing,
      RequirementCheck.Roles,
    ],
    assetId,
  );
};

export function useFetchCreatorStoreAssetConfigurationRequirements(
  assetType: AssetType,
  assetId?: number,
  isEnabled: boolean = true,
): UseQueryResult<GetRequirementsResponse> {
  return useQuery({
    enabled: isEnabled,
    queryKey: getFetchCreatorStoreAssetConfigurationRequirementsKey(assetType, assetId),
    queryFn: async () => {
      const result = await fetchCreatorStoreAssetRequirementsShared(assetType, assetId);
      return result;
    },
    refetchInterval: ({ state }) => {
      /*
       * When a new composite asset or composite asset version is created,
       * Content Platform's asset-metadata-service calculates whether the asset
       * can be distributed, shared, or made open use based on the status of its dependencies.
       * This process can take a few seconds.
       *
       * This polling is active until the asset-metadata-service has finished calculating the asset's distribution eligibility.
       */
      const isPending =
        state.data?.publishing?.restrictions?.includes(
          Restriction.CompositeAssetSubcomponentsEligibilityPending,
        ) ||
        state.data?.publishing?.restrictions?.includes(
          Restriction.CompositeAssetLatestVersionUnverified,
        );
      return isPending ? POLLING_INTERVAL_MS : false;
    },
  });
}

/*
 * Here, we make a distinction between whether the user can configure the
 * asset and manage it.
 *
 * Configuring the asset only requires EDIT permissions (regardless of whether
 * the asset is a user or group asset).
 *
 * Managing the asset, however, differs based on whether the asset is a owned
 * by a user or a group. If the asset is owned by a group, then the same EDIT
 * permissions are sufficient. However, if the asset is owned by a user, then
 * the user must be the owner/creator (EDIT permissions are insufficient).
 *
 * If a user cannot edit the asset, they will be blocked from seeing the asset
 * config page at all. If they can edit the asset, but cannot manage it, they
 * are allowed to see the asset config page, edit the name and description,
 * and see the asset access status (i.e., what the
 * ConfigureGenericNoDistributionForm provides).
 */
export function useFetchUserCanManageCreatorStoreAsset(
  assetType: AssetType,
  assetId?: number,
  isEnabled: boolean = true,
): UseQueryResult<boolean> {
  return useQuery({
    enabled: isEnabled,
    queryKey: getFetchCreatorStoreAssetConfigurationRequirementsKey(assetType, assetId),
    queryFn: async () => {
      const result = await fetchCreatorStoreAssetRequirementsShared(assetType, assetId);
      return result;
    },
    /*
     * This allows us to return from this query only the boolean result, but
     * still have the entire requirements response in the cache. This is needed
     * because this query will often be called before the `fetchCreatorStoreAssetConfigurationRequirements`
     * query, which requires the entire requirements response.
     */
    select: (data) => {
      return !data.publishing?.restrictions?.includes(Restriction.UnsupportedAssetOwner);
    },
  });
}
