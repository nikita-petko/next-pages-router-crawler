/* istanbul ignore file */
import { createContext, useMemo, useContext } from 'react';
import type { GamePassConfigV2 } from '@rbx/clients/gamePassesHttpService/v1';
import type { GetBonusOptInInfoResponse } from '@modules/clients/bonusItem';
import { useGetGamePassConfig } from '@modules/passes/queries/useGetGamePassConfig';
import { useGetGamePassBonusOptIn } from '@modules/bonus-promotions/queries/useGetGamePassBonusOptIn';
import { usePassId } from '@modules/monetization-shared/route/usePassId';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';

interface PassDetailsContextValue {
  passDetails: GamePassConfigV2 | undefined;
  passPromotionsStatus: GetBonusOptInInfoResponse | undefined;
  isPassLoading: boolean;
  isPassDetailsRefetching: boolean;
}

const PassContext = createContext<PassDetailsContextValue>({
  passDetails: undefined,
  passPromotionsStatus: undefined,
  isPassLoading: false,
  isPassDetailsRefetching: false,
});
PassContext.displayName = 'Pass';

/**
 * Context for providing pass details on the current page, if it exists.
 * This is used for legacy surfaces where the pass details may not be fetched directly,
 * and components instead use default context values.
 *
 * Prefer using the {@link useGetGamePassConfig} or {@link useGetGamePassBonusOptIn} hooks directly in components
 * that need the pass details or promotions status - this is also globally cached and will be more flexible.
 */
export function useCurrentPass() {
  return useContext(PassContext);
}

export function PassProvider({ children }: { children: React.ReactNode }) {
  const { universeId } = useUniverseId();
  const { passId: gamePassId } = usePassId();

  const isRouteLoaded = !!universeId && !!gamePassId;

  const {
    data: passDetails,
    isLoading: isPassDetailsLoading,
    isRefetching: isPassDetailsRefetching,
  } = useGetGamePassConfig({ universeId, gamePassId }, { enabled: isRouteLoaded });

  const { data: passPromotionsStatus, isLoading: isPassPromotionsStatusLoading } =
    useGetGamePassBonusOptIn({ universeId, gamePassId }, { enabled: isRouteLoaded });

  const isPassLoading = isPassDetailsLoading || isPassPromotionsStatusLoading;

  return (
    <PassContext.Provider
      value={useMemo(
        () => ({
          passDetails,
          passPromotionsStatus,
          isPassLoading,
          isPassDetailsRefetching,
        }),
        [passDetails, passPromotionsStatus, isPassLoading, isPassDetailsRefetching],
      )}>
      {children}
    </PassContext.Provider>
  );
}
