import { MAX_SUMMARY_CARDS_PER_DASHBOARD } from '../../../types';

export const SUMMARY_ROW_BASELINE_EMPTY_SKELETONS = 2;
export const SUMMARY_ROW_BASELINE_TRAILER_SLOTS = 3;

type SummaryTrailerCounts = {
  readonly addPlaceholderAllowed: boolean;
  readonly skeletonCount: number;
};

export function getSummaryTrailerCounts(
  configuredCount: number,
  columnCapacity: number,
): SummaryTrailerCounts {
  const addPlaceholderAllowed = configuredCount < MAX_SUMMARY_CARDS_PER_DASHBOARD;
  const addSlots = addPlaceholderAllowed ? 1 : 0;
  const remainingVisualSlots = Math.max(
    0,
    MAX_SUMMARY_CARDS_PER_DASHBOARD - configuredCount - addSlots,
  );
  const normalizedColumnCapacity = Math.max(0, Math.floor(columnCapacity));
  const occupiedSlots =
    normalizedColumnCapacity > 0 ? configuredCount % normalizedColumnCapacity : 0;
  const slotsOnCurrentRow =
    normalizedColumnCapacity === 0 || (occupiedSlots === 0 && configuredCount > 0)
      ? 0
      : normalizedColumnCapacity - occupiedSlots;
  const trailerSlots =
    slotsOnCurrentRow > 0 ? slotsOnCurrentRow : SUMMARY_ROW_BASELINE_TRAILER_SLOTS;
  const skeletonCount = Math.min(
    SUMMARY_ROW_BASELINE_EMPTY_SKELETONS,
    remainingVisualSlots,
    Math.max(0, trailerSlots - addSlots),
  );

  return {
    addPlaceholderAllowed,
    skeletonCount,
  };
}
