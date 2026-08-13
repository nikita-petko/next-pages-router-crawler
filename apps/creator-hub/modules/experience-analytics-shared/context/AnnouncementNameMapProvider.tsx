import type { FunctionComponent } from 'react';
import React, { useContext, createContext, useState, useMemo, useCallback } from 'react';
import groupsClient from '@modules/clients/groups';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { MAX_ANNOUNCEMENT_BATCH_SIZE } from '../constants/announcementDisplay';
import useBatchedNameMap from '../hooks/useBatchedNameMap';

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

const announcementIdToKey = (id: string) => id;

const processBatch = async (groupId: number, batch: string[]): Promise<Map<string, string>> => {
  try {
    return await groupsClient.getAnnouncementNames(groupId, batch);
  } catch {
    return new Map<string, string>();
  }
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

  const fetchBatch = useCallback(
    async (batch: string[]) => {
      if (groupId == null) {
        return new Map<string, string>();
      }
      return processBatch(groupId, batch);
    },
    [groupId],
  );

  const announcementNamesMap = useBatchedNameMap({
    ids: announcementIds,
    batchSize: MAX_ANNOUNCEMENT_BATCH_SIZE,
    fetchBatch,
    toKey: announcementIdToKey,
    enabled: groupId != null,
    resetKey: groupId,
  });

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
      announcementNamesMap,
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
