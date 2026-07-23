import { useEffect, useRef } from 'react';
import { useRailContext } from '@rbx/creator-hub-navigation';

/**
 * While `enabled` is true, force the Hub-wide primary navigation rail closed
 * — the same effect as the user clicking the menu button in the breadcrumb
 * header. The rail's prior open state is snapshotted on entry and restored
 * when the hook unmounts (or `enabled` flips back to false), so leaving the
 * page returns the user's chrome to exactly how they left it.
 *
 * Used by Explore Mode when entering from a chart, benchmark card, or
 * insights tile so the chart gets the full canvas.
 *
 * Implementation note:
 *   - The rail context is read through a ref so the effect's deps stay
 *     `[enabled]`. The actual value that would otherwise re-trigger the
 *     effect is `primaryRailOpen` (which we need to read to capture the
 *     pre-collapse snapshot). Subscribing to it directly would re-snapshot
 *     and re-collapse on every rail-state transition, clobbering our own
 *     saved value and risking a "Maximum update depth exceeded" loop.
 */
const useCollapsedPrimaryRail = (enabled: boolean): void => {
  const railContext = useRailContext();
  const railContextRef = useRef(railContext);
  railContextRef.current = railContext;

  const railOpenBeforeRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    railOpenBeforeRef.current = railContextRef.current.primaryRailOpen;
    railContextRef.current.setPrimaryRailOpen(false);
    return () => {
      railContextRef.current.setPrimaryRailOpen(railOpenBeforeRef.current);
    };
  }, [enabled]);
};

export default useCollapsedPrimaryRail;
