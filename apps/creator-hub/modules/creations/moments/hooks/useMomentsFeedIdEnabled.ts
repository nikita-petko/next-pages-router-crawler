import { useFlag } from '@rbx/flags';
import { isMomentsFeedIdEnabled } from '@generated/flags/creatorCreations';

/**
 * Whether server-backed Moments are identified by `feedItemId` instead of the datastore moment id.
 *
 * Resolves to `false` until the flag is ready so the legacy moment-id path is the default.
 */
const useMomentsFeedIdEnabled = (): boolean => {
  const { ready, value } = useFlag(isMomentsFeedIdEnabled);

  return ready && (value ?? false);
};

export default useMomentsFeedIdEnabled;
