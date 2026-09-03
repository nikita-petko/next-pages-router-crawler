import { useMemo } from 'react';
import { useFetchItemDetails } from '@modules/clients/ToolboxServiceQueries';
import type { CreatorType } from '@modules/miscellaneous/common';
import { AssetDependencyFilter } from '@modules/react-query/assetPermissions';
import { useGetAssetDependencies } from '@modules/react-query/assetPermissions/assetPermissionsQueries';
import useAssetPrivacyEnrollmentInformation from './useAssetPrivacyEnrollmentInformation';

const ASSET_PRIVACY_BETA_GA_DATE = new Date('2025-09-11');

const assetWasCreatedBeforeBeta = (createdUtc: Date | null | undefined) => {
  if (!createdUtc) {
    return true; // Default to true if createdUtc is not available
  }
  return new Date(createdUtc) <= ASSET_PRIVACY_BETA_GA_DATE;
};

export interface UseSellingPaidModelConfirmationParams {
  assetId: number;
  creator: { id: number; type: CreatorType };
  enabled: boolean;
}

export interface UseSellingPaidModelConfirmationResult {
  /** Asset creation date (UTC Date) */
  assetCreatedUtc: Date | null | undefined;
  /** Whether asset was created before beta GA date */
  assetCreatedBeforeBetaGA: boolean;
  /** Number of asset dependencies (null if loading/failed) */
  assetDependenciesCount: number | null;
  /** Whether creator is already enrolled in asset privacy beta */
  creatorAlreadyEnrolled: boolean;
  /** Whether to show the selling paid model confirmation warning */
  isEligibleForPaidModelConfirmationWarning: boolean;
  /** Whether any of the data fetches are pending */
  isPaidModelConfirmationWarningEligibilityPending: boolean;
}

/**
 * Hook that provides paid model confirmation data.
 *
 * This hook determines:
 * - Whether the creator is eligible to see the paid model confirmation dialog
 * - Whether any of the data fetches are pending
 *
 * @param assetId - The ID of the asset
 * @param assetType - The type of the asset
 * @param creator - The creator of the asset
 * @returns Object containing paid model confirmation data and computed states
 */
const usePaidModelConfirmationData = ({
  assetId,
  creator,
  enabled,
}: UseSellingPaidModelConfirmationParams): UseSellingPaidModelConfirmationResult => {
  const {
    data: openUseDependenciesCreatedByUser,
    isPending: isOpenUseDependenciesCreatedByUserPending,
  } = useGetAssetDependencies(
    assetId,
    AssetDependencyFilter.ShouldBeMadeRestrictedBeforeIncludingInPaidComposite,
    true, // includeAccessStatus
    false, // includeCreatorName
    creator,
    enabled,
  );

  // Fetch asset privacy enrollment information
  const { creatorAlreadyEnrolled, isPending: isAssetPrivacyEnrollmentInformationPending } =
    useAssetPrivacyEnrollmentInformation({ creator, enabled });

  // Fetch item details to get creation date
  const { data: itemDetails, isPending: isItemDetailsPending } = useFetchItemDetails(
    assetId,
    enabled,
  );
  const assetCreatedUtc = itemDetails?.asset?.createdUtc;
  const assetCreatedBeforeBetaGA = assetWasCreatedBeforeBeta(assetCreatedUtc);

  // Determine if we should show the confirmation warning
  const isEligibleForPaidModelConfirmationWarning = useMemo(() => {
    if (!enabled) {
      return false;
    }

    return Boolean(
      openUseDependenciesCreatedByUser && openUseDependenciesCreatedByUser.length >= 1,
    );
  }, [enabled, openUseDependenciesCreatedByUser]);

  const isPaidModelConfirmationWarningEligibilityPending = useMemo(() => {
    return (
      enabled &&
      (isAssetPrivacyEnrollmentInformationPending ||
        isItemDetailsPending ||
        isOpenUseDependenciesCreatedByUserPending)
    );
  }, [
    enabled,
    isAssetPrivacyEnrollmentInformationPending,
    isItemDetailsPending,
    isOpenUseDependenciesCreatedByUserPending,
  ]);

  return {
    assetCreatedUtc,
    assetCreatedBeforeBetaGA,
    assetDependenciesCount: openUseDependenciesCreatedByUser?.length ?? null,
    creatorAlreadyEnrolled,
    isEligibleForPaidModelConfirmationWarning,
    isPaidModelConfirmationWarningEligibilityPending,
  };
};

export default usePaidModelConfirmationData;
