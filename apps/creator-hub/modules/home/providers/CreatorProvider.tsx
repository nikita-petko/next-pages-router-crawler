import type { FunctionComponent } from 'react';
import React, { useEffect, useState, useContext, createContext, useMemo } from 'react';
import type { TGroup, TUser } from '@modules/authentication/types';
import { CreatorType } from '@modules/miscellaneous/common';
import { useGroups } from '@modules/providers/groups/GroupsProvider';
import { getGroupMembership } from '../utils/apiUtils';

export type TCreator = { type: CreatorType; name: string; id: string };
export type TPermissions = {
  canManageGames: boolean;
  canViewGameAnalytics: boolean;
  canManageAvatarItems: boolean;
};
export type TCreatorContext = {
  context: TCreator;
  contexts: TCreator[];
  permissions: TPermissions | null;
  updateContext: (context: TCreator) => void;
};

const CreatorContext = createContext<TCreatorContext>({
  context: { id: '', name: '', type: CreatorType.User },
  contexts: [],
  permissions: null,
  updateContext: () => new Error('useCreator should be used within a CreatorProvider'),
});

export const useCreator = () => {
  const { permissions, context, contexts, updateContext } = useContext(CreatorContext);
  return { permissions, context, contexts, updateContext };
};

type TCreatorProviderProps = {
  user: TUser;
  groups: TGroup[];
};
export const CreatorProvider: FunctionComponent<React.PropsWithChildren<TCreatorProviderProps>> = ({
  user,
  groups,
  children,
}) => {
  const { currentGroup, setCurrentGroup } = useGroups();
  const [permissions, setPermissions] = useState<TPermissions | null>(null);
  const contexts = useMemo(
    () => [
      {
        id: String(user.id ?? ''),
        name: user.name ?? '',
        type: CreatorType.User,
      },
      ...groups.map<TCreator>((group) => {
        return {
          id: String(group.id ?? ''),
          name: group.name ?? '',
          type: CreatorType.Group,
        };
      }),
    ],
    [user, groups],
  );

  const context = useMemo(() => {
    return currentGroup
      ? {
          id: String(currentGroup.id ?? ''),
          name: currentGroup.name ?? '',
          type: CreatorType.Group,
        }
      : {
          id: String(user.id ?? ''),
          name: user.name ?? '',
          type: CreatorType.User,
        };
  }, [currentGroup, user.id, user.name]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setPermissions(null);
        if (context.type === 'User') {
          setPermissions({
            canManageGames: true,
            canViewGameAnalytics: true,
            canManageAvatarItems: true,
          });
        } else {
          const {
            groupEconomyPermissions: { viewAnalytics, manageGroupGames, manageItems },
          } = await getGroupMembership(context.id);

          setPermissions({
            canManageGames: manageGroupGames,
            canViewGameAnalytics: viewAnalytics,
            canManageAvatarItems: manageItems,
          });
        }
      } catch {
        setPermissions(null);
      }
    };
    loadData();
  }, [context]);

  const memoizedContextValue = useMemo(
    () => ({
      context,
      contexts,
      permissions,
      updateContext: (item: TCreator) => {
        const itemId = parseInt(item.id, 10);
        if (item.type === CreatorType.Group) {
          setCurrentGroup(itemId);
        } else {
          setCurrentGroup(null);
        }
      },
    }),
    [context, contexts, permissions, setCurrentGroup],
  );
  return <CreatorContext.Provider value={memoizedContextValue}>{children}</CreatorContext.Provider>;
};

export default CreatorProvider;
