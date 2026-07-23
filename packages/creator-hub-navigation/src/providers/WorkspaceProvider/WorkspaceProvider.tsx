import React, {
  FunctionComponent,
  useEffect,
  useContext,
  createContext,
  useMemo,
  useCallback,
} from 'react';
import { useRobloxAuthentication as useAuthentication } from '@rbx/auth';
import Router, { useRouter } from 'next/router';
import { useLocalStorage } from '@rbx/react-utilities';
import calculatePriorityValue from './utils/calculatePriorityValue';
import useGetGroupsList from '../../queries/useGetGroupsList';
import {
  CreatorType,
  WorkspaceSorts,
  isAcceptedWorkspacePath,
  type TWorkspace,
  type TGroupData,
  type TSorts,
} from './constants';
import useGetUserById from '../../queries/useGetUserById';
import useProductUrls from '../../utils/useProductUrls';
import { ProductKey } from '../../types';
import useNavigationConfigs from '../../hooks/useNavigationConfigs';

export type TWorkspaceContext = {
  workspaces: TWorkspace[] | null;
  sort: TSorts;
  isLoading: boolean;
  currentWorkspace: TWorkspace;
  refreshWorkspaces: ReturnType<typeof useGetGroupsList>['refetch'];
  setCurrentWorkspace: (workspace: TWorkspace) => void;
  setWorkspaceByGroupId: (id: number | null) => void;
  setSort: (sort: TSorts) => void;
};

export const WorkspaceContext = createContext<TWorkspaceContext | null>(null);

export const useWorkspaces = () => {
  const context = useContext(WorkspaceContext);
  if (context === null) {
    throw new Error('useWorkspaces must be used within a WorkspaceProvider');
  }
  return context;
};

export const WorkspaceProvider: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const router = useRouter();
  const { pathname } = router;

  const { user } = useAuthentication();
  const { data, isLoading: isGroupsLoading, refetch } = useGetGroupsList();
  const { currentProduct } = useNavigationConfigs();
  const { data: userData, isLoading: isUserDataLoading } = useGetUserById(user?.id);
  const {
    Dashboard: { creations },
  } = useProductUrls();

  const [sort, setSort] = useLocalStorage<TSorts>('workspaceSort', WorkspaceSorts.CreatedAt);
  const [currentGroupId, setCurrentGroupId] = useLocalStorage<number | null>(
    `creatorHubGroup.${user?.id}`,
    null,
  );
  const [workspaceData, setWorkspaceData] = useLocalStorage<TGroupData>(
    `creatorHubGroupData.${user?.id}`,
    {},
  );

  const groups = useMemo(() => data?.groups || [], [data?.groups]);

  const creator: TWorkspace = useMemo(
    () => ({
      creatorId: userData?.id ?? 0,
      creatorName: userData?.name,
      creatorType: CreatorType.User,
      priority: workspaceData.user?.priority ?? 0,
      createdAt: userData?.created ?? 0,
      lastSelected: workspaceData.user?.lastSelected,
    }),
    [
      userData?.created,
      userData?.id,
      userData?.name,
      workspaceData.user?.lastSelected,
      workspaceData.user?.priority,
    ],
  );

  const workspaces = useMemo(() => {
    if (isUserDataLoading || isGroupsLoading) {
      return null;
    }

    const groupCreators = groups.map((group) => ({
      creatorId: group.id,
      creatorName: group.name,
      creatorType: CreatorType.Group,
      createdAt: group.createdAt,
      priority: workspaceData[group.id]?.priority ?? 0,
      lastSelected: workspaceData[group.id]?.lastSelected ?? 0,
    }));

    let sortedWorkspaces = [creator, ...groupCreators];
    if (sort === WorkspaceSorts.CreatedAt) {
      sortedWorkspaces = sortedWorkspaces?.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
    }
    if (sort === WorkspaceSorts.Priority) {
      sortedWorkspaces = sortedWorkspaces?.sort((a, b) => b.priority - a.priority);
    }

    if (sort === WorkspaceSorts.Recent) {
      sortedWorkspaces = sortedWorkspaces?.sort((a, b) => b.lastSelected - a.lastSelected);
    }

    if (sort === WorkspaceSorts.Alphabetically) {
      sortedWorkspaces = sortedWorkspaces?.sort((a, b) => {
        const aName = (a.creatorName || '').toLowerCase();
        const bName = (b.creatorName || '').toLowerCase();

        return aName < bName ? -1 : 1;
      });
    }

    return sortedWorkspaces;
  }, [isUserDataLoading, isGroupsLoading, groups, creator, sort, workspaceData]);

  const currentWorkspace: TWorkspace = useMemo(() => {
    if (currentGroupId === null) {
      return creator;
    }

    return (
      workspaces?.find(
        ({ creatorId, creatorType }) => currentGroupId === creatorId && creatorType === 'Group',
      ) ?? creator
    );
  }, [creator, currentGroupId, workspaces]);

  const setCurrentWorkspace = useCallback(
    (workspace: TWorkspace) => {
      if (workspace.creatorType === 'Group') {
        setCurrentGroupId(workspace.creatorId);
      } else {
        setCurrentGroupId(null);
      }

      const key = workspace.creatorType === 'User' ? 'user' : workspace.creatorId;
      setWorkspaceData((prev) => {
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

      if (!isAcceptedWorkspacePath(pathname) && currentProduct === ProductKey.CreatorDashboard) {
        Router.push({
          pathname: creations,
        });
      }
    },
    [creations, pathname, currentProduct, setCurrentGroupId, setWorkspaceData],
  );

  const setWorkspaceByGroupId = useCallback(
    (id: number | null) => {
      setCurrentGroupId(id);
    },
    [setCurrentGroupId],
  );

  useEffect(() => {
    if (
      router.isReady &&
      typeof router.query.groupId === 'string' &&
      !isGroupsLoading &&
      user?.id
    ) {
      const parsedGroupId = parseInt(router.query.groupId, 10);
      if (!Number.isNaN(parsedGroupId)) {
        setCurrentGroupId(parsedGroupId);
      }

      const query = { ...router.query };
      delete query.groupId;
      Router.push({ query }, undefined, { shallow: true });
    }
  }, [
    isGroupsLoading,
    router.isReady,
    router.query,
    router.query.groupId,
    setCurrentGroupId,
    user?.id,
  ]);

  const value: TWorkspaceContext = useMemo(
    () => ({
      workspaces,
      currentWorkspace,
      sort,
      isLoading: isGroupsLoading && isUserDataLoading,
      setSort,
      refreshWorkspaces: refetch,
      setCurrentWorkspace,
      setWorkspaceByGroupId,
    }),
    [
      currentWorkspace,
      isGroupsLoading,
      isUserDataLoading,
      refetch,
      setCurrentWorkspace,
      setSort,
      setWorkspaceByGroupId,
      sort,
      workspaces,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};
