import { useRef } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import type {
  AssetType,
  GetRequirementsResponse,
} from '@rbx/client-marketplace-publishing-requirements-api/v1';
import {
  MarketplaceType,
  RequirementCheck,
  Restriction,
} from '@rbx/client-marketplace-publishing-requirements-api/v1';
import marketplacePublishingRequirements from '@modules/clients/marketplacePublishingRequirements';

// NOTE: This is needed to prevent query key clashes since the query key isn't affected by which file it is in.
const KEY_PREFIX = 'marketplacePublishingRequirementsService_';
const MAX_POLLING_DURATION_MS = 10_000;
const INITIAL_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 5_000;
const BACKOFF_FACTOR = 2;

// Distinguishes "eligibility not yet computed" from real fetch failures so retry
// logic only continues polling for the expected pending case.
class AssetEligibilityPendingError extends Error {}

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
      RequirementCheck.AssetConfig,
    ],
    assetId,
  );
};

export function useFetchCreatorStoreAssetConfigurationRequirements(
  assetType: AssetType,
  assetId?: number,
  isEnabled = true,
): UseQueryResult<GetRequirementsResponse> {
  const pollingStartTimeRef = useRef<number | null>(null);

  return useQuery({
    enabled: isEnabled,
    queryKey: getFetchCreatorStoreAssetConfigurationRequirementsKey(assetType, assetId),
    queryFn: async () => {
      const result = await fetchCreatorStoreAssetRequirementsShared(assetType, assetId);

      /*
       * When a new composite asset or composite asset version is created,
       * Content Platform's asset-metadata-service calculates whether the asset
       * can be distributed, shared, or made open use based on the status of its dependencies.
       * This process can take a few seconds.
       *
       * Throwing here drives react-query's retry + retryDelay machinery, giving us
       * exponential backoff for free. Once MAX_POLLING_DURATION_MS is exceeded we throw
       * a plain Error so retry stops and the query transitions to error state, unblocking
       * any loading spinner that is waiting on this data.
       */
      const restrictions = result.publishing?.restrictions ?? [];
      const isPending =
        restrictions.includes(Restriction.CompositeAssetSubcomponentsEligibilityPending) ||
        restrictions.includes(Restriction.CompositeAssetLatestVersionUnverified);

      if (!isPending) {
        pollingStartTimeRef.current = null;
        return result;
      }

      pollingStartTimeRef.current ??= Date.now();

      if (Date.now() - pollingStartTimeRef.current >= MAX_POLLING_DURATION_MS) {
        pollingStartTimeRef.current = null;
        throw new Error('Timed out waiting for asset eligibility to resolve');
      }

      throw new AssetEligibilityPendingError();
    },
    // Only keep retrying for the expected pending case; surface all other errors immediately.
    retry: (_, error) => error instanceof AssetEligibilityPendingError,
    retryDelay: (failureCount) =>
      Math.min(INITIAL_RETRY_DELAY_MS * BACKOFF_FACTOR ** failureCount, MAX_RETRY_DELAY_MS),
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
  isEnabled = true,
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
