import { useEffect } from 'react';
import { useAuthentication } from '@modules/authentication/providers';
import {
  useExploreModeStorageScope,
  useHasUserSeenExploreModeNavChip,
  useMarkExploreNavTooltipNuxSeen,
} from '../components/ExploreModeNewChip';

/**
 * When the creator lands on the Explore analytics page for an experience, persist that
 * they no longer need the left-rail "New" chip or the one-shot NUX tooltip for that universe.
 */
export const useMarkExploreModeNavSeenOnAnalyticsPageVisit = (): void => {
  const { user } = useAuthentication();
  const { scopeReady } = useExploreModeStorageScope();
  const { setHasUserSeen } = useHasUserSeenExploreModeNavChip();
  const markNuxSeen = useMarkExploreNavTooltipNuxSeen();

  useEffect(() => {
    if (!scopeReady || !user?.id) {
      return;
    }
    setHasUserSeen(true);
    markNuxSeen();
  }, [scopeReady, setHasUserSeen, markNuxSeen, user?.id]);
};
