import type { FunctionComponent } from 'react';
import { useCallback, useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Button,
  IconButton,
  List,
  ListItem,
  ListItemLeadingAccessorySpacer,
  Menu,
  MenuItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Snackbar,
  TextInput,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Avatar, Typography } from '@rbx/ui';
import { evictTeamCreatePlayer } from '@modules/clients/teamCreateCollaboration';
import type { User } from '@modules/clients/users';
import usersClient from '@modules/clients/users';
import { getUserUrl } from '@modules/miscellaneous/urls/www';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { POLLING_CONSTANTS } from '../../constants';
import useGameServers from '../../hooks/useGameServers';
import { seedServerSummary } from '../../hooks/useServerSummary';
import { useServerType } from '../../providers/ServerTypeContext';
import styles from './ServerPlayersList.module.css';

export interface ServerPlayersListProps {
  placeId?: number;
  jobId?: string;
}

const arePlayerIdsEqual = (a: number[] | null, b: number[] | null): boolean => {
  if (a === b) {
    return true;
  }
  if (!a || !b || a.length !== b.length) {
    return false;
  }
  const set = new Set(a);
  return b.every((id) => set.has(id));
};

const ServerPlayersList: FunctionComponent<ServerPlayersListProps> = ({ placeId, jobId }) => {
  const { translate } = useTranslation();
  const { fetchGameServers, error: gameServersError } = useGameServers();
  const { serverType, setServerType } = useServerType();
  const { gameDetails } = useCurrentGame();
  const queryClient = useQueryClient();
  const universeId = gameDetails?.id;

  const [playerIds, setPlayerIds] = useState<number[] | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [usersError, setUsersError] = useState<Error | null>(null);
  const [search, setSearch] = useState('');
  const [menuOpenUserId, setMenuOpenUserId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<'success' | 'error' | null>(null);

  const fetchPlayerIds = useCallback(async () => {
    if (!placeId || !jobId) {
      return;
    }

    const serversResponse = await fetchGameServers(placeId, undefined, { search: jobId });

    if (serversResponse && serversResponse.length > 0) {
      const server = serversResponse[0];
      const nextPlayerIds = server.playerIds;
      setPlayerIds((prev) => (arePlayerIdsEqual(prev, nextPlayerIds) ? prev : nextPlayerIds));
      setServerType(server.serverType);
      // header reads useServerSummary; keep that cache warm on deep link / tab fetch
      if (universeId !== undefined) {
        seedServerSummary(
          queryClient,
          { universeId, placeId, jobId },
          {
            jobId: server.jobId,
            serverType: server.serverType,
            status: server.status,
            isShutdown: server.isShutdown,
          },
        );
      }
    } else if (serversResponse) {
      setPlayerIds((prev) => prev ?? []);
    }
  }, [fetchGameServers, jobId, placeId, queryClient, setServerType, universeId]);

  const fetchUsers = useCallback(async () => {
    if (playerIds === null) {
      return;
    }

    if (playerIds.length === 0) {
      setUsers((prev) => prev ?? []);
      return;
    }

    try {
      setUsersError(null);
      const usersResponse = await usersClient.getUsersByIds(playerIds);
      setUsers(usersResponse.data?.sort((a, b) => (a.id ?? 0) - (b.id ?? 0)) ?? []);
    } catch (err) {
      setUsersError(err instanceof Error ? err : new Error('Failed to fetch users'));
    }
  }, [playerIds]);

  // defer to next tick so setState inside fetchPlayerIds isn't synchronous in the effect body
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchPlayerIds();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchPlayerIds]);

  useEffect(() => {
    if (!placeId) {
      return undefined;
    }
    const interval = setInterval(() => {
      void fetchPlayerIds();
    }, POLLING_CONSTANTS.INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchPlayerIds, placeId]);

  // defer to next tick so setState inside fetchUsers isn't synchronous in the effect body
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchUsers();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchUsers]);

  const handleEvictUser = useCallback(
    async (userId: number) => {
      if (!universeId) {
        return;
      }
      setMenuOpenUserId(null);
      try {
        await evictTeamCreatePlayer(universeId, userId);
        setUsers((prev) => prev?.filter((u) => u.id !== userId) ?? null);
        setSnackbar('success');
      } catch {
        setSnackbar('error');
      }
    },
    [universeId],
  );

  const filteredUsers = useMemo(() => {
    const lowerCaseSearch = search.toLowerCase();
    return (users ?? []).filter((user) => {
      if (!user.id) {
        return false;
      }
      const name = user.name?.toLowerCase() ?? '';
      const displayName = user.displayName?.toLowerCase() ?? '';
      const idString = user.id.toString();
      return (
        name.includes(lowerCaseSearch) ||
        displayName.includes(lowerCaseSearch) ||
        idString.includes(lowerCaseSearch)
      );
    });
  }, [users, search]);

  const loading = playerIds === null || users === null;
  const error = gameServersError ?? usersError;

  return (
    <div className='flex flex-col'>
      <TextInput
        placeholder={translate('ServerDetailsPage.PlayersSearch')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ maxWidth: 440 }}
        id='search-players'
        size='Medium'
        leadingIconName='icon-regular-magnifying-glass'
        className={styles.tightOutline}
      />
      <Typography variant='h6' className='padding-top-xxlarge'>
        {loading || error
          ? translate('ServerDetailsPage.PlayersHeaderEmpty')
          : translate('ServerDetailsPage.PlayersHeader', {
              count: filteredUsers.length.toString(),
            })}
      </Typography>
      {error && <Typography>{translate('ServerDetailsPage.PlayersError.Generic')}</Typography>}
      {loading && !error && (
        <Typography>{translate('ServerDetailsPage.PlayersLoading')}</Typography>
      )}
      {!loading && !error && filteredUsers.length === 0 && (
        <Typography>{translate('ServerDetailsPage.NoPlayers')}</Typography>
      )}
      {!loading && !error && filteredUsers.length > 0 && (
        <List>
          {filteredUsers.map((user, index) => (
            <ListItem
              key={user.id}
              divider={index === filteredUsers.length - 1 ? 'None' : 'Full'}
              isContained
              leading={
                <ListItemLeadingAccessorySpacer>
                  <Avatar
                    alt='avatar'
                    className={`size-1400 shrink-0 flex items-center justify-center ${styles.playerAvatar}`}>
                    <Thumbnail2d
                      targetId={user.id ?? 0}
                      type={ThumbnailTypes.avatarHeadshot}
                      alt='thumbnail'
                      returnPolicy={ReturnPolicy.PlaceHolder}
                      includeBackground
                    />
                  </Avatar>
                </ListItemLeadingAccessorySpacer>
              }
              trailing={
                <div className='flex items-center gap-small'>
                  <Button
                    variant='Standard'
                    size='Medium'
                    onClick={() => {
                      window.open(getUserUrl(user.id ?? 0));
                    }}>
                    {translate('ServerDetailPage.PlayerViewProfile')}
                  </Button>
                  {serverType === 'ServerType.TeamCreate' && (
                    <Popover
                      open={menuOpenUserId === user.id}
                      onOpenChange={(open) => setMenuOpenUserId(open ? (user.id ?? 0) : null)}>
                      <PopoverTrigger asChild>
                        <IconButton
                          ariaLabel={translate('ServerDetailsPage.PlayerActionsMenu')}
                          variant='Utility'
                          size='Small'
                          icon='icon-regular-three-dots-vertical'
                          data-testid={`player-actions-menu-${user.id}`}
                        />
                      </PopoverTrigger>
                      <PopoverContent
                        side='bottom'
                        align='end'
                        ariaLabel={translate('ServerDetailsPage.PlayerActionsMenu')}>
                        <Menu>
                          <MenuItem
                            value='remove'
                            title={translate('ServerDetailsPage.PlayerRemoveFromServer')}
                            onSelect={() => void handleEvictUser(user.id ?? 0)}
                          />
                        </Menu>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              }
              metadata={`@${user.name ?? user.id}`}
              description={user.id?.toString()}
              title={user.displayName ?? user.name ?? user.id?.toString()}
            />
          ))}
        </List>
      )}
      {snackbar !== null && (
        <div className={styles.snackbarContainer}>
          <Snackbar
            title={translate(
              snackbar === 'success'
                ? 'ServerDetailsPage.EvictUserSuccess'
                : 'ServerDetailsPage.EvictUserError',
            )}
            shouldAutoDismiss
            onClose={() => setSnackbar(null)}
          />
        </div>
      )}
    </div>
  );
};

export default ServerPlayersList;
