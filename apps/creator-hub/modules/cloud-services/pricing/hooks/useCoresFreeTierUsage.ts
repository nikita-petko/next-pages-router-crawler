import { useEffect, useState } from 'react';
import { useCloudPricingClient } from '../CloudPricingClientProvider';
import { ResourceId, ServiceId } from '../types';

// Live free-tier usage for rcc/ccu-cores from the
// `GET /v1/usages/universes/{universeId}` backend. `isEnrolled: false`
// means pricing config has no monthly free allowance for the resource
// (or the fetch failed) — callers hide the bar in both cases.
//
// The backend returns `consumed` and `monthlyFreeUnits` in minutes, but
// the CPU cores progress bar is displayed in hours, so the hook converts
// both values to whole hours before exposing them.
export type CoresFreeTierUsage = {
  consumed: number;
  quota: number;
  isLoading: boolean;
  isEnrolled: boolean;
};

const MINUTES_PER_HOUR = 60;

const EMPTY: CoresFreeTierUsage = {
  consumed: 0,
  quota: 0,
  isLoading: false,
  isEnrolled: false,
};

export function useCoresFreeTierUsage(universeId: number | undefined): CoresFreeTierUsage {
  const { getConsumerFreeTierUsage } = useCloudPricingClient();
  const [state, setState] = useState<CoresFreeTierUsage>(EMPTY);

  useEffect(() => {
    if (universeId === undefined) {
      setState(EMPTY);
      return undefined;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, isLoading: true }));
    void getConsumerFreeTierUsage(universeId)
      .then((res) => {
        if (cancelled) {
          return;
        }
        const row = res.usages?.find(
          (u) => u.serviceId === ServiceId.Rcc && u.resourceId === ResourceId.CcuCores,
        );
        const quotaMinutes = row?.monthlyFreeUnits ?? 0;
        if (quotaMinutes <= 0) {
          setState(EMPTY);
          return;
        }
        const consumedMinutes = row?.consumed ?? 0;
        setState({
          consumed: Math.round(consumedMinutes / MINUTES_PER_HOUR),
          quota: Math.round(quotaMinutes / MINUTES_PER_HOUR),
          isLoading: false,
          isEnrolled: true,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setState(EMPTY);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [universeId, getConsumerFreeTierUsage]);

  return state;
}
