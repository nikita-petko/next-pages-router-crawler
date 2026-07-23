import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { GetManagedPricingStatusResponse } from '@rbx/client-price-configuration-api/v1';
import { useBatchUpdateGamePassesManagedPricing } from '@modules/passes/queries/useBatchUpdateGamePassesManagedPricing';
import { listAllPassesForUniverseQueryOptions } from '@modules/passes/queries/useListAllPassesForUniverse';
import {
  isEligibleForManagedPricing,
  isManagedPricingEnabled,
} from '../../manage-items/utils/transformManagedProducts';
import { managedPricingKeys } from '../../queries/constants';
import { useAcceptManagedPricing } from '../../queries/useAcceptManagedPricing';

type UseOnboardManagedPricingParams = {
  universeId: number;
};

type OnboardOptions = {
  enableEligiblePasses?: boolean;
};

/**
 * Orchestrates the managed pricing onboarding flow:
 * 1. Accepts managed pricing via API
 * 2. Optionally batch-enables eligible game passes
 * 3. Updates the local managed pricing status cache to 'Accepted'
 */
export function useOnboardManagedPricing({ universeId }: UseOnboardManagedPricingParams) {
  const queryClient = useQueryClient();
  const { mutateAsync: acceptManagedPricing, isPending: isAcceptPending } =
    useAcceptManagedPricing();
  const { mutateAsync: batchUpdateGamePasses, isPending: isBatchUpdatePending } =
    useBatchUpdateGamePassesManagedPricing({ universeId });

  const onboardManagedPricing = useCallback(
    async ({ enableEligiblePasses = false }: OnboardOptions = {}) => {
      await acceptManagedPricing({ universeId });

      let updatedItemsCount = 0;
      if (enableEligiblePasses) {
        try {
          const passes = await queryClient.ensureQueryData(
            listAllPassesForUniverseQueryOptions({ universeId }),
          );

          const eligiblePassIds = passes
            .filter((pass) => isEligibleForManagedPricing(pass) && !isManagedPricingEnabled(pass))
            .map((pass) => pass.gamePassId);

          if (eligiblePassIds.length > 0) {
            const { errors } = await batchUpdateGamePasses({
              passIds: eligiblePassIds,
              enabled: true,
            });

            updatedItemsCount = eligiblePassIds.length - (errors?.length ?? 0);
          }
        } catch {
          // Batch enable is best-effort; don't block onboarding
        }
      }

      // Note - we're intentionally setting locally after the batch update as pages depend on this value
      queryClient.setQueryData<GetManagedPricingStatusResponse>(
        managedPricingKeys.managedPricingStatus(universeId),
        { status: 'Accepted' },
      );

      return { updatedItemsCount };
    },
    [acceptManagedPricing, batchUpdateGamePasses, queryClient, universeId],
  );

  const isPending = isAcceptPending || isBatchUpdatePending;

  return { onboardManagedPricing, isPending };
}
