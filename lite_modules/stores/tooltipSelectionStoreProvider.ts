import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface TooltipSelectionStoreStateType {
  // Sticky pointer to the tooltip currently shown. Stays the same while its
  // entry is still in `candidates`, even if a lower-priority candidate is
  // registered later. Cleared/reassigned in `register`/`deregister` when the
  // active candidate leaves the registry.
  activeId: string | undefined;
  candidates: Record<string, { id: string; priority: number }>;
}

interface TooltipSelectionStoreActionType {
  deregister: (id: string) => void;
  register: (candidate: { id: string; priority: number }) => void;
}

interface TooltipSelectionStoreType
  extends TooltipSelectionStoreStateType, TooltipSelectionStoreActionType {}

// Returns the id of the lowest-priority candidate, breaking ties by
// lexicographic id for determinism. Used only to (re)elect the active tooltip
// when the current `activeId` is empty or no longer in the registry.
//
// Seeds the fold with the first candidate (rather than a sentinel like
// `+Infinity`) so the comparison only ever runs between two real candidates.
// That keeps the inner predicate to a single, branch-free expression and
// avoids the trap where a candidate whose `priority` happens to equal the
// sentinel would be incorrectly skipped on the first iteration.
const pickLowestPriorityId = (
  candidates: TooltipSelectionStoreStateType['candidates'],
): string | undefined => {
  const list = Object.values(candidates);
  if (list.length === 0) {
    return undefined;
  }

  return list.reduce((best, candidate) =>
    candidate.priority < best.priority ||
    (candidate.priority === best.priority && candidate.id < best.id)
      ? candidate
      : best,
  ).id;
};

export const useTooltipSelectionStore = create<TooltipSelectionStoreType>()(
  immer((set) => ({
    activeId: undefined,
    candidates: {},
    deregister: (id) => {
      set((draft) => {
        delete draft.candidates[id];
        // Only re-elect when the candidate that left was the active one;
        // otherwise the active tooltip is unchanged.
        if (draft.activeId === id) {
          draft.activeId = pickLowestPriorityId(draft.candidates);
        }
      });
    },
    register: (candidate) => {
      // Enforce one mounted component per id in non-production builds.
      if (
        process.env.NODE_ENV !== 'production' &&
        useTooltipSelectionStore.getState().candidates[candidate.id] !== undefined
      ) {
        throw new Error(
          `tooltipSelectionStore: register(${JSON.stringify(candidate.id)}) called while an entry with the same id is already registered. Each tooltip id may be owned by at most one mounted component at a time.`,
        );
      }
      set((draft) => {
        draft.candidates[candidate.id] = candidate;
        // Lock the currently active tooltip: only pick a new active id when
        // there isn't one, or the current one has somehow left the registry.
        if (draft.activeId === undefined || draft.candidates[draft.activeId] === undefined) {
          draft.activeId = pickLowestPriorityId(draft.candidates);
        }
      });
    },
  })),
);

// Selector kept as a named export so consumers can subscribe to just the
// active id without reading the rest of the store.
export const selectActiveId = (state: TooltipSelectionStoreType): string | undefined =>
  state.activeId;
