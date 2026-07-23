import React, { FunctionComponent, useCallback, useState, useEffect, useMemo } from 'react';
import { User, usersClient } from '@modules/clients';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  List,
  ListItem,
  ListItemLeadingAccessorySpacer,
  TextInput,
} from '@rbx/foundation-ui';
import { Avatar, Typography } from '@rbx/ui';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { getUserUrl } from '@modules/miscellaneous/common/urls/www';
import useGameServers from '../../hooks/useGameServers';
import { POLLING_CONSTANTS } from '../../constants';
import { useServerType } from '../../providers/ServerTypeContext';
import styles from './ServerPlayersList.module.css';

export interface ServerPlayersListProps {
  placeId?: number;
  jobId?: string;
}

const ServerPlayersList: FunctionComponent<ServerPlayersListProps> = ({ placeId, jobId }) => {
  const { translate } = useTranslation();
  const { fetchGameServers, error: gameServersError } = useGameServers();
  const { setServerType } = useServerType();

  const [playerIds, setPlayerIds] = useState<number[] | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [usersError, setUsersError] = useState<Error | null>(null);
  const [search, setSearch] = useState('');

  const fetchPlayerIds = useCallback(async () => {
    if (!placeId || !jobId) return;

    const serversResponse = await fetchGameServers(placeId, undefined, { search: jobId });

    if (serversResponse && serversResponse.length > 0) {
      setPlayerIds(serversResponse[0].playerIds);
      setServerType(serversResponse[0].serverType);
    } else if (serversResponse) {
      setPlayerIds((prev) => prev ?? []);
    }
  }, [fetchGameServers, placeId, jobId, setServerType]);

  const fetchUsers = useCallback(async () => {
    if (playerIds === null) return;

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

  useEffect(() => {
    fetchPlayerIds();
  }, [fetchPlayerIds]);

  useEffect(() => {
    if (placeId) {
      const interval = setInterval(() => {
        fetchPlayerIds();
      }, POLLING_CONSTANTS.INTERVAL_MS);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [fetchPlayerIds, placeId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const lowerCaseSearch = search.toLowerCase();
    return (users ?? []).filter(
      (user) =>
        user.id &&
        (user.name?.toLowerCase().includes(lowerCaseSearch) ||
          user.displayName?.toLowerCase().includes(lowerCaseSearch) ||
          user.id.toString().includes(lowerCaseSearch)),
    );
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
      {error && (
        <Typography>
          {translate('ServerDetailsPage.PlayersError', { error: error.message })}
        </Typography>
      )}
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
                <Button
                  variant='Standard'
                  size='Medium'
                  onClick={() => {
                    window.open(getUserUrl(user.id ?? 0));
                  }}>
                  {translate('ServerDetailPage.PlayerViewProfile')}
                </Button>
              }
              metadata={`@${user.name ?? user.id}`}
              description={user.id?.toString()}
              title={user.displayName ?? user.name ?? user.id?.toString()}
            />
          ))}
        </List>
      )}
    </div>
  );
};

export default ServerPlayersList;
