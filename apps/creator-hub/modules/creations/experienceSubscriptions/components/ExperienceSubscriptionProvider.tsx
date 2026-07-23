import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { experienceSubscriptionsClient, GetExperienceSubscriptionResponse } from '@modules/clients';
import { Money, RevShareStatModel } from '@rbx/clients/developerSubscriptionsApi';
import ExperienceSubscriptionsContext from '../ExperienceSubscriptionContext';

function ExperienceSubscriptionProvider({ children }: React.PropsWithChildren) {
  const router = useRouter();
  const [experienceSubscriptionDetails, setExperienceSubscriptionDetails] =
    useState<GetExperienceSubscriptionResponse>();
  const [isExperienceSubscriptionLoading, setIsExperienceSubscriptionLoading] =
    useState<boolean>(false);

  const [canAccessExperienceSubscription, setCanAccessExperienceSubscription] =
    useState<boolean>(false);
  const [isRefreshRequired, setIsRefreshRequired] = useState<boolean>(false);
  const [usedSubscriptionNames, setUsedSubscriptionNames] = useState<string[]>([]);
  const [priceTierMap, setPriceTierMap] = useState<{ [key: string]: Money } | undefined>(undefined);
  const [revshareStatModelMap, setRevshareStatModelMap] = useState<
    { [key: string]: RevShareStatModel } | undefined
  >(undefined);

  const experienceSubscriptionId = useMemo(() => {
    const { subscriptionId } = router.query;
    const subId = subscriptionId as string;
    // removes the EXP- prefix
    return subId !== undefined && subId.length >= 4 ? subId.substring(4) : '';
  }, [router.query]);

  const universeId = useMemo(() => {
    const { id } = router.query;
    return parseInt(id as string, 10);
  }, [router.query]);

  const getExperienceSubscriptionDetails = useCallback(async () => {
    try {
      setIsExperienceSubscriptionLoading(true);
      if (
        typeof experienceSubscriptionId !== 'undefined' &&
        !Number.isNaN(experienceSubscriptionId) &&
        parseInt(experienceSubscriptionId, 10) > 0
      ) {
        try {
          const experienceSubscriptionDetailsResponse =
            await experienceSubscriptionsClient.getExperienceSubscription(
              universeId,
              experienceSubscriptionId,
            );
          setExperienceSubscriptionDetails(experienceSubscriptionDetailsResponse);
        } catch {
          setExperienceSubscriptionDetails(undefined);
        }
      }

      if (typeof universeId !== 'undefined' && !Number.isNaN(universeId) && universeId > 0) {
        try {
          const { canUserEditExperienceSubscription } =
            await experienceSubscriptionsClient.canUserAccessSubscriptions(universeId);
          setCanAccessExperienceSubscription(canUserEditExperienceSubscription ?? false);
        } catch {
          setCanAccessExperienceSubscription(false);
        }

        try {
          const { developerSubscriptions } =
            await experienceSubscriptionsClient.getExperienceSubscriptions(universeId, '');

          const names = developerSubscriptions?.map((devSub) => devSub.name ?? '') ?? [];

          setUsedSubscriptionNames(names.filter((key) => key !== ''));
        } catch {
          setUsedSubscriptionNames([]);
        }

        try {
          const { priceTierPrices, revShareStatModels } =
            await experienceSubscriptionsClient.getPriceInfo(universeId);
          setPriceTierMap(priceTierPrices ?? undefined);
          setRevshareStatModelMap(revShareStatModels ?? undefined);
        } catch {
          setPriceTierMap(undefined);
          setRevshareStatModelMap(undefined);
        }
      }

      setIsRefreshRequired(false);
    } finally {
      setIsExperienceSubscriptionLoading(false);
    }
  }, [universeId, experienceSubscriptionId]);

  const refreshExperienceSubscriptionDetails = useCallback(() => {
    setIsRefreshRequired(true); // only set the thumbnail refresh cycle on a reload, not initial load
    getExperienceSubscriptionDetails();
  }, [getExperienceSubscriptionDetails]);

  useEffect(() => {
    getExperienceSubscriptionDetails();
  }, [getExperienceSubscriptionDetails]);

  return (
    <ExperienceSubscriptionsContext.Provider
      value={useMemo(
        () => ({
          experienceSubscriptionDetails,
          usedSubscriptionNames,
          isExperienceSubscriptionLoading,
          isExperienceSubscriptionRefreshRequired: isRefreshRequired,
          canAccessExperienceSubscription,
          priceTierMap,
          revshareStatModelMap,
          refreshExperienceSubscriptionDetails,
        }),
        [
          experienceSubscriptionDetails,
          usedSubscriptionNames,
          isExperienceSubscriptionLoading,
          isRefreshRequired,
          canAccessExperienceSubscription,
          priceTierMap,
          revshareStatModelMap,
          refreshExperienceSubscriptionDetails,
        ],
      )}>
      {children}
    </ExperienceSubscriptionsContext.Provider>
  );
}

export default ExperienceSubscriptionProvider;
