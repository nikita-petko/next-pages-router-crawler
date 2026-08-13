import type { FunctionComponent } from 'react';
import React, { useContext, createContext, useState, useMemo, useCallback } from 'react';
import developClient from '@modules/clients/develop';
import useBatchedNameMap from '../hooks/useBatchedNameMap';

const MAX_BATCH_SIZE = 100;

type UniverseNameMapBundle = {
  universeNamesMap: ReadonlyMap<string, string>;
  addUniverseIds: (ids: number[]) => void;
};

export const UniverseNameMapContext = createContext<UniverseNameMapBundle>({
  universeNamesMap: new Map<string, string>(),
  addUniverseIds: () => {},
});
UniverseNameMapContext.displayName = 'UniverseNameMapContext';

export const useUniverseNameMapFromContext = (): UniverseNameMapBundle => {
  return useContext(UniverseNameMapContext);
};

const universeIdToKey = (id: number) => id.toString();

const processBatch = async (batch: number[]): Promise<Map<string, string>> => {
  try {
    const response = await developClient.getUniversesDetails(batch);
    const universeMap = new Map<string, string>();
    response.data?.forEach((universe) => {
      if (universe.id !== undefined && universe.name) {
        universeMap.set(universe.id.toString(), universe.name);
      }
    });

    return universeMap;
  } catch {
    return new Map<string, string>();
  }
};

export const UniverseNameMapProvider: FunctionComponent<React.PropsWithChildren> = ({
  children,
}) => {
  const [universeIds, setUniverseIds] = useState<Set<number>>(new Set<number>());

  const universeNamesMap = useBatchedNameMap({
    ids: universeIds,
    batchSize: MAX_BATCH_SIZE,
    fetchBatch: processBatch,
    toKey: universeIdToKey,
  });

  const addUniverseIds = useCallback(
    (ids: number[]) => {
      const newIds = ids.filter((id) => id > 0 && !universeIds.has(id));
      if (!newIds.length) {
        return;
      }
      const result = new Set(universeIds);
      newIds.forEach((id) => result.add(id));
      setUniverseIds(result);
    },
    [universeIds, setUniverseIds],
  );

  const context = useMemo(() => {
    return {
      universeNamesMap,
      addUniverseIds,
    };
  }, [universeNamesMap, addUniverseIds]);

  return (
    <UniverseNameMapContext.Provider value={context}>{children}</UniverseNameMapContext.Provider>
  );
};

export default UniverseNameMapProvider;
