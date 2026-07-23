import { useEffect } from 'react';

import { selectActiveId, useTooltipSelectionStore } from '@stores/tooltipSelectionStoreProvider';

interface UseTooltipSelectionSlotArgs {
  id: string;
  priority: number;
  // True when this tooltip *wants* to be visible right now (not dismissed, not
  // disabled, anchor mounted). False means "I should not be in the registry at
  // all". The registry itself decides whether it is the user's turn.
  wantsToShow: boolean;
}

// Registers a tooltip while `wantsToShow` is true, deregisters otherwise.
// Returns true when this tooltip is the one the registry has elected to show.
//
// A currently-active tooltip is "locked" by the store: it stays active until
// it deregisters (dismissed/unmounted), even if a lower-priority candidate is
// registered later. Lower-priority newcomers join the registry and wait their
// turn.
const useTooltipSelectionSlot = ({
  id,
  priority,
  wantsToShow,
}: UseTooltipSelectionSlotArgs): boolean => {
  useEffect(() => {
    if (!wantsToShow) {
      return undefined;
    }
    useTooltipSelectionStore.getState().register({ id, priority });
    return () => {
      useTooltipSelectionStore.getState().deregister(id);
    };
  }, [id, priority, wantsToShow]);

  // Skip the subscription entirely when this tooltip does not want to show.
  // That keeps already-dismissed/disabled tooltips from re-rendering on every
  // unrelated registry change.
  const activeId = useTooltipSelectionStore((state) =>
    wantsToShow ? selectActiveId(state) : undefined,
  );

  return wantsToShow && activeId === id;
};

export default useTooltipSelectionSlot;
