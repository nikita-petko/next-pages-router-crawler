import { useQuery } from '@tanstack/react-query';
import { RevenueTargetType } from '@rbx/client-content-licensing-api/v1';
import {
  resolveSalesAvenueProduct,
  SalesAvenueProductType,
  type SalesAvenueSelection,
} from '@modules/licenses/utils/salesAvenue';
import type { DisplayableRevenueTarget } from '../components/RevenueTargetCard';

export const GET_RESOLVED_REVENUE_TARGETS_QUERY_KEY = (
  universeId: number | undefined,
  revenueTargets: DisplayableRevenueTarget[],
) =>
  [
    'resolvedRevenueTargets',
    universeId,
    revenueTargets.map(({ revenueTargetId, revenueTargetType }) => ({
      revenueTargetId,
      revenueTargetType,
    })),
  ] as const;

const getProductType = (
  revenueTargetType: DisplayableRevenueTarget['revenueTargetType'],
): SalesAvenueProductType =>
  revenueTargetType === RevenueTargetType.GamePass
    ? SalesAvenueProductType.GamePass
    : SalesAvenueProductType.DeveloperProduct;

interface UseResolveRevenueTargetsParams {
  universeId?: number;
  revenueTargets: DisplayableRevenueTarget[];
}

/**
 * Hydrates agreement revenue-target IDs with their product names, prices, and icon asset IDs.
 */
export const useResolveRevenueTargets = ({
  universeId,
  revenueTargets,
}: UseResolveRevenueTargetsParams) =>
  useQuery({
    queryKey: GET_RESOLVED_REVENUE_TARGETS_QUERY_KEY(universeId, revenueTargets),
    queryFn: async () => {
      if (universeId === undefined) {
        throw new Error('Missing universe ID');
      }

      const resolvedTargets = await Promise.all(
        revenueTargets.map(({ revenueTargetId, revenueTargetType }) =>
          resolveSalesAvenueProduct(
            universeId,
            Number(revenueTargetId),
            getProductType(revenueTargetType),
          ),
        ),
      );

      return resolvedTargets.filter(
        (revenueTarget): revenueTarget is SalesAvenueSelection => revenueTarget !== null,
      );
    },
    enabled:
      universeId !== undefined &&
      Number.isFinite(universeId) &&
      universeId > 0 &&
      revenueTargets.length > 0,
  });

export default useResolveRevenueTargets;
