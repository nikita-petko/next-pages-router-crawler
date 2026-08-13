import { useEffect, useMemo, useState } from 'react';

type UseBatchedNameMapOptions<Id> = {
  ids: Set<Id>;
  batchSize: number;
  fetchBatch: (batch: Id[]) => Promise<Map<string, string>>;
  toKey: (id: Id) => string;
  enabled?: boolean;
  resetKey?: unknown;
};

// Shared pending/fail/cancel loop for id→name maps. Unresolved ids have to be
// recorded or they stay pending and every later id change drags them into
// another doomed batch.
const useBatchedNameMap = <Id>({
  ids,
  batchSize,
  fetchBatch,
  toKey,
  enabled = true,
  resetKey,
}: UseBatchedNameMapOptions<Id>): Map<string, string> => {
  const [nameMap, setNameMap] = useState<Map<string, string>>(() => new Map());
  const [failedIds, setFailedIds] = useState<Set<Id>>(() => new Set());
  const [prevResetKey, setPrevResetKey] = useState(resetKey);

  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setNameMap(new Map());
    setFailedIds(new Set());
  }

  const pendingIds = useMemo(
    () => Array.from(ids).filter((id) => !nameMap.has(toKey(id)) && !failedIds.has(id)),
    [failedIds, ids, nameMap, toKey],
  );

  useEffect(() => {
    if (!pendingIds.length || !enabled) {
      return undefined;
    }

    let cancelled = false;
    const batchIds = pendingIds.slice(0, batchSize);

    void fetchBatch(batchIds).then((batchResults) => {
      if (cancelled) {
        return;
      }
      if (batchResults.size > 0) {
        setNameMap((prevMap) => {
          const nextMap = new Map(prevMap);
          batchResults.forEach((value, key) => {
            nextMap.set(key, value);
          });
          return nextMap;
        });
      }
      const unresolvedIds = batchIds.filter((id) => !batchResults.has(toKey(id)));
      if (unresolvedIds.length > 0) {
        setFailedIds((prev) => {
          const next = new Set(prev);
          unresolvedIds.forEach((id) => next.add(id));
          return next;
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [batchSize, enabled, fetchBatch, pendingIds, toKey]);

  return nameMap;
};

export default useBatchedNameMap;
