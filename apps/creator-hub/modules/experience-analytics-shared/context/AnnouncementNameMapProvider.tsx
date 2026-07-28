import type { FunctionComponent } from 'react';
import React, { useContext, createContext, useState, useMemo, useCallback, useEffect } from 'react';
import groupsClient from '@modules/clients/groups';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { MAX_ANNOUNCEMENT_BATCH_SIZE } from '../constants/announcementDisplay';

type AnnouncementNameMapBundle = {
  announcementNamesMap: ReadonlyMap<string, string>;
  addAnnouncementIds: (ids: string[]) => void;
};

export const AnnouncementNameMapContext = createContext<AnnouncementNameMapBundle>({
  announcementNamesMap: new Map<string, string>(),
  addAnnouncementIds: () => {},
});
AnnouncementNameMapContext.displayName = 'AnnouncementNameMapContext';

export const useAnnouncementNameMapFromContext = (): AnnouncementNameMapBundle => {
  return useContext(AnnouncementNameMapContext);
};

const processBatch = async (groupId: number, batch: string[]): Promise<Map<string, string>> => {
  try {
    return await groupsClient.getAnnouncementNames(groupId, batch);
  } catch {
    return new Map<string, string>();
  }
};

const useGetAnnouncementNameMap = (announcementIds: Set<string>, groupId: number | null) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [announcementMap, setAnnouncementMap] = useState<Map<string, string>>(new Map());
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const [prevGroupId, setPrevGroupId] = useState(groupId);

  if (prevGroupId !== groupId) {
    setPrevGroupId(groupId);
    setAnnouncementMap(new Map());
    setFailedIds(new Set());
  }

  const pendingIDs = useMemo(
    () =>
      Array.from(announcementIds).filter((id) => !announcementMap.has(id) && !failedIds.has(id)),
    [announcementIds, announcementMap, failedIds],
  );

  const processNextBatch = useCallback(async () => {
    if (isProcessing || !pendingIDs.length || !groupId) {
      return;
    }

    const batchIds = pendingIDs.slice(0, MAX_ANNOUNCEMENT_BATCH_SIZE);
    try {
      setIsProcessing(true);
      const batchResults = await processBatch(groupId, batchIds);
      setAnnouncementMap((prevMap) => {
        const newMap = new Map(prevMap);
        batchResults.forEach((value, key) => {
          newMap.set(key, value);
        });
        return newMap;
      });
      const unresolvedIds = batchIds.filter((id) => !batchResults.has(id));
      if (unresolvedIds.length > 0) {
        setFailedIds((prev) => {
          const next = new Set(prev);
          unresolvedIds.forEach((id) => next.add(id));
          return next;
        });
      }
    } catch {
      setFailedIds((prev) => {
        const next = new Set(prev);
        batchIds.forEach((id) => next.add(id));
        return next;
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, pendingIDs, groupId]);

  /* oxlint-disable react/react-compiler -- mirrors UniverseNameMapProvider sequential-batch pattern */
  useEffect(() => {
    void processNextBatch();
  }, [processNextBatch]);
  /* oxlint-enable react/react-compiler */

  return {
    data: announcementMap,
  };
};

export const AnnouncementNameMapProvider: FunctionComponent<React.PropsWithChildren> = ({
  children,
}) => {
  const currentGroup = useCurrentGroup();
  const groupId = currentGroup?.id ?? null;
  const [announcementIds, setAnnouncementIds] = useState<Set<string>>(new Set<string>());

  const [prevGroupId, setPrevGroupId] = useState(groupId);
  if (prevGroupId !== groupId) {
    setPrevGroupId(groupId);
    setAnnouncementIds(new Set<string>());
  }

  const { data: announcementNamesMap } = useGetAnnouncementNameMap(announcementIds, groupId);

  const addAnnouncementIds = useCallback((ids: string[]) => {
    setAnnouncementIds((prev) => {
      const newIds = ids.filter((id) => id.length > 0 && !prev.has(id));
      if (!newIds.length) {
        return prev;
      }
      const next = new Set(prev);
      newIds.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const context = useMemo(() => {
    return {
      announcementNamesMap: announcementNamesMap as ReadonlyMap<string, string>,
      addAnnouncementIds,
    };
  }, [announcementNamesMap, addAnnouncementIds]);

  return (
    <AnnouncementNameMapContext.Provider value={context}>
      {children}
    </AnnouncementNameMapContext.Provider>
  );
};

export default AnnouncementNameMapProvider;
