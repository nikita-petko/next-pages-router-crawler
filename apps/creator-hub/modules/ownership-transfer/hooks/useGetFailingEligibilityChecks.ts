import { useEffect, useState } from 'react';
import { useTransferResourceEligibility } from '@modules/react-query/ownershipTransfer/ownershipTransferQueries';
import { ownershipTransferEligibilityContent } from '../constants/contentConstants';
import type {
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

const isSupportedEligibilityCheck = <T extends TSupportedOwnershipTransferResourceTypes>(
  resourceType: T,
  key: string,
): key is TSupportedEligibilityChecks<T> =>
  Object.hasOwn(ownershipTransferEligibilityContent[resourceType], key);

const useGetFailingEligibilityChecks = <T extends TSupportedOwnershipTransferResourceTypes>({
  resource: { resourceType, resourceId },
}: TUseGetFailingEligibilityChecksParams<T>): TUseGetFailingEligibilityChecksReturnValue<T> => {
  const { data: eligibilityChecks, isLoading } = useTransferResourceEligibility(
    resourceType,
    resourceId,
    { refetchOnWindowFocus: true },
  );

  const checks: Array<{ key: TSupportedEligibilityChecks<T>; isPassing: boolean }> = isLoading
    ? []
    : Object.entries<boolean>(eligibilityChecks ?? {}).flatMap(([key, isPassing]) =>
        isSupportedEligibilityCheck(resourceType, key) ? [{ key, isPassing }] : [],
      );

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
