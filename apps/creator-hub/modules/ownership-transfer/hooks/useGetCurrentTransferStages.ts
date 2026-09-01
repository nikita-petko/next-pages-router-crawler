import { TransferResourceType } from '@modules/clients/ownershipTransferApi';
import modalFlows from '../transferConfiguration';
import type { TOwnershipTransferDialogVariant, TOwnershipTransferResource } from '../types';
import useGetFailingEligibilityChecks from './useGetFailingEligibilityChecks';

const useGetCurrentTransferStages = (
  activeVariant: TOwnershipTransferDialogVariant | null,
  resource: TOwnershipTransferResource,
) => {
  const { wasEverIneligible, isLoading: isLoadingEligibility } = useGetFailingEligibilityChecks({
    resource,
  });

  if (!activeVariant || !resource) {
    return null;
  }

  if (resource.resourceType === TransferResourceType.Group && isLoadingEligibility) {
    return null;
  }

  const allStages = modalFlows[resource.resourceType]?.[activeVariant]?.stages;

  return allStages?.filter((stage) => {
    if (!stage.shouldRender) {
      return true;
    }

    return stage.shouldRender({
      wasIneligible: wasEverIneligible,
    });
  });
};

export default useGetCurrentTransferStages;
