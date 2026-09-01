import { AllowlistTypeEnum, CreatorTierEnum } from '@rbx/client-core-content-api/v1';
import { TransactionVariantEnum } from '@rbx/client-core-content-transaction-api/v1';
import { StatusCodes } from '@rbx/core';
import { getResponseFromError } from '@modules/clients/utils';
import useUniversePublishStatus from '@modules/creations-overview/hooks/useUniversePublishStatus';
import { useGetOrganizationPermissionsByGroupId } from '@modules/react-query/organizations/organizationsQueries';
import { ReachLevel } from '../types/audienceReach';
import { useContentRatingDetails } from './useContentRatingDetails';
import { useCoreContentTransactionStatus } from './useCoreContentTransactionStatus';
import { useUniverseCreatorEligibility } from './useUniverseCreatorEligibility';
import { useUniversePublishEligibility } from './useUniversePublishEligibility';

interface UsePublishingFeeStatusParams {
  universeId: number;
  isGroupOwned: boolean;
  isCreator: boolean;
  creatorId?: number;
  isBelowThreshold: boolean;
  audienceReach: ReachLevel;
  activeAllowlists?: AllowlistTypeEnum[] | null;
}

interface PublishingFeeStatus {
  hasPublishingFeeDeposit: boolean;
  hasExpeditedDeposit: boolean;
  canView: boolean;
  canPay: boolean;
  isExempt: boolean;
  shouldShowExpediteUpsell: boolean;
  shouldShowPublishingFeeUpsell: boolean;
  isLoading: boolean;
  error: Error | null;
}

// This is used to determine if a user has view permission on transactions
const isForbidden = (err: unknown) => getResponseFromError(err)?.status === StatusCodes.FORBIDDEN;

export const usePublishingFeeStatus = ({
  universeId,
  isGroupOwned,
  isCreator,
  creatorId,
  isBelowThreshold,
  audienceReach,
  activeAllowlists,
}: UsePublishingFeeStatusParams): PublishingFeeStatus => {
  // Make ALL the API calls. We need a ton...
  const { isPublished, isLoading: isUniversePublishStatusLoading } =
    useUniversePublishStatus(universeId);
  const {
    data: creatorTierData,
    isLoading: isCreatorTierLoading,
    error: creatorTierError,
  } = useUniverseCreatorEligibility(universeId);
  const { data: contentRating, isLoading: isContentRatingLoading } =
    useContentRatingDetails(universeId);
  const {
    data: publishingFeeTransactionStatus,
    isLoading: isPublishingFeeTransactionStatusLoading,
    error: publishingFeeError,
  } = useCoreContentTransactionStatus(universeId, TransactionVariantEnum.PublishFee);
  const {
    data: expeditedTransactionStatus,
    isLoading: isExpeditedTransactionStatusLoading,
    error: expeditedFeeError,
  } = useCoreContentTransactionStatus(universeId, TransactionVariantEnum.Expedited);
  const {
    data: universePublishEligibilityData,
    isLoading: isUniversePublishEligibilityLoading,
    error: universePublishEligibilityError,
  } = useUniversePublishEligibility(universeId);

  const { data: groupPermissions, isLoading: isGroupPermissionsLoading } =
    useGetOrganizationPermissionsByGroupId(isGroupOwned ? creatorId : undefined);

  const isRated = !contentRating?.isUnrated;
  const is16Plus = (contentRating?.minimumAge ?? 0) >= 16;

  const canConfigureGroupRevenue =
    isGroupOwned &&
    (groupPermissions?.isOwner === true || groupPermissions?.canConfigureRevenueDetails === true);
  // Non-owner group revenue managers may pay, but only from group funds.
  const canPay = isCreator || canConfigureGroupRevenue;
  const hasPublishingFeeDeposit = publishingFeeTransactionStatus?.hasDeposit === true;
  const hasExpeditedDeposit = expeditedTransactionStatus?.hasDeposit === true;

  const canView = !(isForbidden(publishingFeeError) || isForbidden(expeditedFeeError));

  const exemptDueToActiveSubscription =
    !universePublishEligibilityData?.ownerEveryoneTierWithoutSubscription &&
    creatorTierData?.creatorTier === CreatorTierEnum.Everyone;

  const isAllowlistedExempt =
    Boolean(activeAllowlists?.includes(AllowlistTypeEnum.UniverseBypass)) ||
    Boolean(activeAllowlists?.includes(AllowlistTypeEnum.TemporaryExpeditedFeeBypass));

  const isExempt = exemptDueToActiveSubscription || isAllowlistedExempt || hasExpeditedDeposit;

  const isLoading =
    isCreatorTierLoading ||
    isPublishingFeeTransactionStatusLoading ||
    isExpeditedTransactionStatusLoading ||
    isUniversePublishStatusLoading ||
    isContentRatingLoading ||
    isUniversePublishEligibilityLoading ||
    (isGroupOwned && isGroupPermissionsLoading);

  // Only the blocking errors. Upsells are hidden silently if their calls fail.
  const error =
    creatorTierError ??
    universePublishEligibilityError ??
    // If these fail with FORBIDDEN the canView is true. We don't need to show an error state, we can
    // show the unauthorized view (covered in the component).
    (canView ? (publishingFeeError ?? expeditedFeeError) : null);

  const shouldShowExpediteUpsell =
    !isLoading &&
    !error &&
    // Eligible to pay expedited fee
    ((!isAllowlistedExempt &&
      isBelowThreshold && // Creators above threshold can just pay the normal fee
      canPay &&
      audienceReach !== ReachLevel.AllAges &&
      !(isRated && is16Plus)) ||
      // Or already paid fee.  This supercedes the allowlist so they can request a refund.
      hasExpeditedDeposit);

  const shouldShowPublishingFeeUpsell =
    !isLoading &&
    !error &&
    canView &&
    canPay &&
    !hasPublishingFeeDeposit &&
    !isExempt &&
    !isBelowThreshold &&
    isPublished;

  return {
    hasPublishingFeeDeposit,
    hasExpeditedDeposit,
    canView,
    canPay,
    isExempt,
    shouldShowExpediteUpsell,
    shouldShowPublishingFeeUpsell,
    isLoading,
    error,
  };
};
