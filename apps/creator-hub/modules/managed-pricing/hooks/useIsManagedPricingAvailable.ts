import type { ManagedPricingStatus } from '@rbx/client-price-configuration-api/v1';
import { useGetManagedPricingStatus } from '../queries/useGetManagedPricingStatus';

export function isManagedPricingAvailable(status?: ManagedPricingStatus) {
  return status === 'Accepted' || status === 'Pending';
}

export function useIsManagedPricingAvailable(universeId: number | undefined) {
  return useGetManagedPricingStatus(universeId, {
    select: (data) => isManagedPricingAvailable(data?.status),
    enabled: !!universeId,
  });
}
