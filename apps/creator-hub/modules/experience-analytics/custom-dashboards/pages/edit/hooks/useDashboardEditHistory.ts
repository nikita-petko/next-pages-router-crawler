import { useCallback, useMemo, useState } from 'react';
import { validateCustomDashboardConfig, validateDashboardName } from '../../../utils/validators';
import { getDashboardDraftSignature, type DashboardDraft } from './dashboardDraftState';

const DEFAULT_MAX_HISTORY_DEPTH = 50;

type DashboardEditHistoryState = {
  readonly historyKey: string | null;
  readonly baselineSignature: string | null;
  readonly past: readonly DashboardDraft[];
  readonly present: DashboardDraft | null;
  readonly future: readonly DashboardDraft[];
};

type UseDashboardEditHistoryArgs = {
  readonly historyKey: string | null;
  readonly persistedDraft: DashboardDraft | null;
  readonly maxDepth?: number;
};

type UseDashboardEditHistoryResult = {
  readonly draft: DashboardDraft | null;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly commitDraft: (nextDraft: DashboardDraft) => void;
  readonly undoDraft: () => void;
  readonly redoDraft: () => void;
};

const emptyHistoryState = (
  historyKey: string | null,
  baselineSignature: string | null,
): DashboardEditHistoryState => ({
  historyKey,
  baselineSignature,
  past: [],
  present: null,
  future: [],
});

const getDraftSignature = (draft: DashboardDraft | null): string | null =>
  draft ? getDashboardDraftSignature(draft) : null;

function validateDashboardDraft(draft: DashboardDraft): DashboardDraft {
  return {
    name: validateDashboardName(draft.name),
    config: validateCustomDashboardConfig(draft.config),
  };
}

function getSyncedHistoryState({
  current,
  historyKey,
  persistedDraft,
  persistedSignature,
  previousBaselineSignature,
}: {
  readonly current: DashboardEditHistoryState;
  readonly historyKey: string | null;
  readonly persistedDraft: DashboardDraft | null;
  readonly persistedSignature: string | null;
  readonly previousBaselineSignature: string | null;
}): DashboardEditHistoryState {
  const didHistoryKeyChange = current.historyKey !== historyKey;
  if (!persistedDraft || !persistedSignature) {
    return current.present === null
      ? { ...current, historyKey, baselineSignature: persistedSignature }
      : emptyHistoryState(historyKey, persistedSignature);
  }

  if (didHistoryKeyChange || !current.present) {
    return {
      ...emptyHistoryState(historyKey, persistedSignature),
      present: persistedDraft,
    };
  }

  const currentSignature = getDashboardDraftSignature(current.present);
  if (currentSignature === persistedSignature) {
    return { ...current, historyKey, baselineSignature: persistedSignature };
  }

  if (!previousBaselineSignature || currentSignature === previousBaselineSignature) {
    return {
      ...emptyHistoryState(historyKey, persistedSignature),
      present: persistedDraft,
    };
  }

  return { ...current, historyKey, baselineSignature: persistedSignature };
}

/**
 * Bounded undo/redo history for the custom dashboard editor draft. Autosave may
 * advance the persisted baseline while the user keeps editing, so syncing keeps
 * local history when the persisted document catches up to the current draft.
 */
export default function useDashboardEditHistory({
  historyKey,
  persistedDraft,
  maxDepth = DEFAULT_MAX_HISTORY_DEPTH,
}: UseDashboardEditHistoryArgs): UseDashboardEditHistoryResult {
  const initialPersistedSignature = getDraftSignature(persistedDraft);
  const [state, setState] = useState<DashboardEditHistoryState>(() => ({
    ...emptyHistoryState(historyKey, initialPersistedSignature),
    present: persistedDraft,
  }));

  const persistedSignature = useMemo(() => getDraftSignature(persistedDraft), [persistedDraft]);
  const didHistoryKeyChange = state.historyKey !== historyKey;
  const didPersistedBaselineChange = state.baselineSignature !== persistedSignature;
  if (didHistoryKeyChange || didPersistedBaselineChange) {
    const previousBaselineSignature = didHistoryKeyChange ? null : state.baselineSignature;
    const syncedState = getSyncedHistoryState({
      current: state,
      historyKey,
      persistedDraft,
      persistedSignature,
      previousBaselineSignature,
    });
    if (syncedState !== state) {
      setState(syncedState);
    }
  }

  const commitDraft = useCallback(
    (nextDraft: DashboardDraft) => {
      const validatedDraft = validateDashboardDraft(nextDraft);
      setState((current) => {
        const currentSignature = getDraftSignature(current.present);
        const nextSignature = getDashboardDraftSignature(validatedDraft);
        if (currentSignature === nextSignature) {
          return current;
        }
        const nextPast = current.present
          ? [...current.past, current.present].slice(-maxDepth)
          : current.past;
        return {
          historyKey: current.historyKey,
          baselineSignature: current.baselineSignature,
          past: nextPast,
          present: validatedDraft,
          future: [],
        };
      });
    },
    [maxDepth, setState],
  );

  const undoDraft = useCallback(() => {
    setState((current) => {
      if (!current.present || current.past.length === 0) {
        return current;
      }
      const previousDraft = current.past[current.past.length - 1];
      return {
        historyKey: current.historyKey,
        baselineSignature: current.baselineSignature,
        past: current.past.slice(0, -1),
        present: previousDraft,
        future: [current.present, ...current.future].slice(0, maxDepth),
      };
    });
  }, [maxDepth, setState]);

  const redoDraft = useCallback(() => {
    setState((current) => {
      if (!current.present || current.future.length === 0) {
        return current;
      }
      const nextDraft = current.future[0];
      return {
        historyKey: current.historyKey,
        baselineSignature: current.baselineSignature,
        past: [...current.past, current.present].slice(-maxDepth),
        present: nextDraft,
        future: current.future.slice(1),
      };
    });
  }, [maxDepth, setState]);

  return {
    draft: state.present,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    commitDraft,
    undoDraft,
    redoDraft,
  };
}
