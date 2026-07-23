import type { FunctionComponent } from 'react';
import React, { useEffect, useContext, createContext, useMemo, useCallback } from 'react';
import { useRobloxAuthentication as useAuthentication } from '@rbx/auth';
import { useLocalStorage } from '@rbx/react-utilities';
import type { TGroup } from '@modules/react-query/creatorHome';
import { useGetGroupsList } from '@modules/react-query/creatorHome';
import calculatePriorityValue from './utils/calculatePriorityValue';

type GroupData = Record<
  string,
  {
    lastSelected: number;
    priority: number;
  }
>;

export type TGroupsContext = {
  groups: TGroup[] | null;
  isFetched: boolean;
  groupData: GroupData;
  currentGroup: TGroup | null;
  refreshGroups: ReturnType<typeof useGetGroupsList>['refetch'];
  setCurrentGroup: (groupId: number | null) => void;
};

const GroupsContext = createContext<TGroupsContext | null>(null);

export const useGroups = () => {
  const context = useContext(GroupsContext);
  if (context === null) {
    throw new Error('useGroups must be used within a GroupsProvider');
  }
  return context;
};

export const useCurrentGroup = () => {
  const context = useContext(GroupsContext);
  if (context === null) {
    throw new Error('useCurrentGroup must be used within a GroupsProvider');
  }
  return context.currentGroup;
};

export const MockedGroupsProvider: FunctionComponent<React.PropsWithChildren<TGroupsContext>> = ({
  children,
  ...args
}) => {
  return <GroupsContext.Provider value={args}>{children}</GroupsContext.Provider>;
};

export const GroupsProvider: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const { user } = useAuthentication();
  const { data, isLoading, refetch } = useGetGroupsList();
  const [cachedGroups, setCachedGroups] = useLocalStorage<TGroup[] | string | null>(
    `creatorHubGroups.${user?.id}`,
    null,
  );
  const [currentGroupId, setCurrentGroupId] = useLocalStorage<number | null>(
    `creatorHubGroup.${user?.id}`,
    null,
  );
  const [groupData, setGroupData] = useLocalStorage<GroupData>(
    `creatorHubGroupData.${user?.id}`,
    {},
  );

  const setCurrentGroup = useCallback(
    (id: number | null) => {
      setCurrentGroupId(id);
      const key = id === null ? 'user' : id;
      setGroupData((prev) => {
        const current = {
          lastSelected: Date.now(),
          priority: 1,
        };
        if (prev[key]) {
          const { priority, lastSelected } = prev[key];
          // Value is stored in local storage. Type checking in case it gets malformed.
          if (
            typeof priority === 'number' &&
            !Number.isNaN(priority) &&
            typeof lastSelected === 'number' &&
            !Number.isNaN(lastSelected)
          ) {
            current.priority = calculatePriorityValue(priority, lastSelected);
          }
        }

        return {
          ...prev,
          [key]: current,
        };
      });
    },
    [setCurrentGroupId, setGroupData],
  );

  const groups = useMemo(() => {
    if (data?.groups) {
      return data?.groups;
    }

    if (cachedGroups === null) {
      return [];
    }

    try {
      return typeof cachedGroups === 'string'
        ? (JSON.parse(cachedGroups) as TGroup[])
        : cachedGroups;
    } catch {
      return [];
    }
  }, [cachedGroups, data?.groups]);

  const currentGroup = useMemo(() => {
    return currentGroupId ? (groups.find(({ id }) => id === currentGroupId) ?? null) : null;
  }, [currentGroupId, groups]);

  useEffect(() => {
    if (user?.id && data?.groups && !isLoading) {
      setCachedGroups(data?.groups);
    }
  }, [data?.groups, groups, isLoading, setCachedGroups, user?.id]);

  const value = useMemo(
    () => ({
      groups,
      currentGroup,
      groupData,
      isFetched: !isLoading && Boolean(user?.id),
      refreshGroups: refetch,
      setCurrentGroup,
    }),
    [currentGroup, groupData, groups, isLoading, refetch, setCurrentGroup, user?.id],
  );
  return <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>;
};
