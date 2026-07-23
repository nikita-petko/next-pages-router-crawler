import { useEffect, useState } from 'react';
import { OneTimePayoutBaseV2 as OneTimePayoutBase } from '../interface/OneTimePayoutFormType';
import useLatestOneTimePayout from './useLatestOneTimePayout';

interface UseFirstTimePayoutCheckProps {
  organizationId: string;
  payouts: OneTimePayoutBase[];
  enabled: boolean;
}

interface UseFirstTimePayoutCheckResult {
  firstTimePayouts: OneTimePayoutBase[];
  isLoading: boolean;
}

const EMPTY_ARRAY: OneTimePayoutBase[] = [];

/**
 * Only returns true for users that have a confirmed payout history.
 * If a fetch fails or the user has a payout history, their result will be false.
 */
const useFirstTimePayoutCheck = ({
  organizationId,
  payouts,
  enabled,
}: UseFirstTimePayoutCheckProps): UseFirstTimePayoutCheckResult => {
  const { fetchLatestPayouts, isFetching } = useLatestOneTimePayout(organizationId);
  const [firstTimePayouts, setFirstTimePayouts] = useState<OneTimePayoutBase[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled || payouts.length === 0) {
      setIsLoading(false);
      return;
    }

    const checkFirstTimePayouts = async () => {
      setIsLoading(true);
      try {
        const userIds = payouts.map((payout) => payout.user.id);
        const latestPayoutsMap = await fetchLatestPayouts(userIds);

        // Filter to only include first-time recipients
        const firstTime = payouts.filter((payout) => {
          const payoutResponse = latestPayoutsMap.get(payout.user.id);

          // Successfully queried and found no payout history
          if (payoutResponse?.status === 'Success' && !payoutResponse?.oneTimePayout) {
            return true;
          }

          // If the fetch failed or payout history does exist
          return false;
        });

        setFirstTimePayouts(firstTime);
      } catch {
        setFirstTimePayouts(EMPTY_ARRAY);
      } finally {
        setIsLoading(false);
      }
    };

    checkFirstTimePayouts();
  }, [enabled, payouts, fetchLatestPayouts]);

  return { firstTimePayouts, isLoading: isLoading || isFetching };
};

export default useFirstTimePayoutCheck;
