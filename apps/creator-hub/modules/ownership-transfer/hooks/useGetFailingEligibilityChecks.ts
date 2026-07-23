import { useEffect, useState } from 'react';
import { useTransferResourceEligibility } from '@modules/react-query/ownershipTransfer/ownershipTransferQueries';
import { useGetUserConfiguration } from '@modules/react-query/twoStepVerification';
import { useAuthentication } from '@modules/authentication/providers';
import {
  TOwnershipTransferResource,
  TSupportedOwnershipTransferResourceTypes,
  TSupportedEligibilityChecks,
} from '../types';

type TUseGetFailingEligibilityChecksParams<T extends TSupportedOwnershipTransferResourceTypes> = {
  resource: TOwnershipTransferResource & { resourceType: T };
};

type TUseGetFailingEligibilityChecksReturnValue<
  T extends TSupportedOwnershipTransferResourceTypes,
> = {
  checksWithStatus: Array<{ key: TSupportedEligibilityChecks<T>; isPassing: boolean }>;
  wasEverIneligible: boolean;
  isIneligible: boolean;
  isLoading: boolean;
};

const useGetFailingEligibilityChecks = <T extends TSupportedOwnershipTransferResourceTypes>({
  resource: { resourceType, resourceId },
}: TUseGetFailingEligibilityChecksParams<T>): TUseGetFailingEligibilityChecksReturnValue<T> => {
  const { user } = useAuthentication();
  const { data: eligibilityChecks, isLoading: isLoadingEligibility } =
    useTransferResourceEligibility(resourceType, resourceId, { refetchOnWindowFocus: true });
  const { data: twoFactorConfig, isLoading: isLoadingTwoFactor } = useGetUserConfiguration(
    user?.id,
  );

  const hasTwoFactorEnabled = !!twoFactorConfig?.methods?.length;

  const apiChecks = Object.entries(eligibilityChecks ?? {}).map(([key, value]) => ({
    key: key as TSupportedEligibilityChecks<T>,
    isPassing: value,
  }));

  const twoFactorCheck = {
    key: 'hasTwoFactorAuthentication' as TSupportedEligibilityChecks<T>,
    isPassing: hasTwoFactorEnabled,
  };

  const isLoading = isLoadingEligibility || isLoadingTwoFactor;

  // NOTE: We wait for all data to be loaded first, to ensure eligibility is
  // calculated properly, and that new checks don't pop in once the eligibilityStage
  // is rendered.
  const checks = isLoading ? [] : [twoFactorCheck, ...apiChecks];

  const isIneligible = isLoading ? false : checks.some((check) => !check.isPassing);

  const [wasEverIneligible, setWasEverIneligible] = useState<boolean>(false);

  useEffect(() => {
    if (isIneligible) {
      setWasEverIneligible(true);
    }
  }, [isIneligible]);

  return {
    checksWithStatus: checks,
    isLoading,
    isIneligible,
    wasEverIneligible: wasEverIneligible || isIneligible,
  };
};

export default useGetFailingEligibilityChecks;
