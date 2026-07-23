import React, {
  FunctionComponent,
  useContext,
  createContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from 'react';
import { developClient } from '@modules/clients';

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

const useGetUniverseNameMap = (universeIds: Set<number>) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [universeMap, setUniverseMap] = useState<Map<string, string>>(new Map());

  const pendingIDs = useMemo(
    () => Array.from(universeIds).filter((id) => !universeMap.has(`${id}`)),
    [universeIds, universeMap],
  );

  const processNextBatch = useCallback(async () => {
    if (isProcessing || !pendingIDs.length) return;

    const batchIds = Array.from(pendingIDs).slice(0, MAX_BATCH_SIZE);
    try {
      setIsProcessing(true);
      const batchResults = await processBatch(batchIds);
      setUniverseMap((prevMap) => {
        const newMap = new Map(prevMap);
        batchResults.forEach((value, key) => {
          newMap.set(key, value);
        });
        return newMap;
      });
    } catch {
      /* empty */
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, pendingIDs]);

  useEffect(() => {
    processNextBatch();
  }, [processNextBatch]);

  return {
    data: universeMap,
  };
};

export const UniverseNameMapProvider: FunctionComponent<React.PropsWithChildren> = ({
  children,
}) => {
  const [universeIds, setUniverseIds] = useState<Set<number>>(new Set<number>());

  const { data: universeNamesMap } = useGetUniverseNameMap(universeIds);

  const addUniverseIds = useCallback(
    (ids: number[]) => {
      const newIds = ids.filter((id) => id > 0 && !universeIds.has(id));
      if (!newIds.length) return;
      const result = new Set(universeIds);
      newIds.forEach((id) => result.add(id));
      setUniverseIds(result);
    },
    [universeIds, setUniverseIds],
  );

  const context = useMemo(() => {
    return {
      universeNamesMap: universeNamesMap as ReadonlyMap<string, string>,
      addUniverseIds,
    };
  }, [universeNamesMap, addUniverseIds]);

  return (
    <UniverseNameMapContext.Provider value={context}>{children}</UniverseNameMapContext.Provider>
  );
};

export default UniverseNameMapProvider;
