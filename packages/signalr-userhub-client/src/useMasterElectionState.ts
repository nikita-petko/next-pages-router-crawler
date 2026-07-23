import { useEffect, useState } from 'react';
import {
  isMasterTab,
  subscribeToMasterChange,
  unsubscribeFromMasterChange,
  isPubSubAvailable,
} from './cross-tab';
import type { MasterChangeCallback } from './cross-tab';

/**
 * Hook that tracks whether this tab is the master tab for cross-tab coordination.
 *
 * @param crossTabEnabled - Whether cross-tab coordination is enabled. If false, always returns true (treat as master).
 * @returns boolean indicating if this tab is the master
 */
export function useMasterElectionState(crossTabEnabled: boolean = true): boolean {
  const [isMaster, setIsMaster] = useState<boolean>(() => {
    // If cross-tab is disabled or unavailable, treat this tab as master
    if (!crossTabEnabled || !isPubSubAvailable()) {
      return true;
    }
    return isMasterTab();
  });

  useEffect(() => {
    // If cross-tab is disabled or unavailable, no need to subscribe
    if (!crossTabEnabled || !isPubSubAvailable()) {
      setIsMaster(true);
      return;
    }

    const handler: MasterChangeCallback = (newIsMaster: boolean) => {
      setIsMaster(newIsMaster);
    };

    subscribeToMasterChange(handler);

    // Set initial state (kingmaker may have already determined master)
    setIsMaster(isMasterTab());

    return () => {
      unsubscribeFromMasterChange(handler);
    };
  }, [crossTabEnabled]);

  return isMaster;
}

export default useMasterElectionState;
