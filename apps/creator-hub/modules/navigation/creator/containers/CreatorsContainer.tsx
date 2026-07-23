import React, { FunctionComponent, useEffect } from 'react';
import { useAuthentication } from '@modules/authentication/providers';
import { CircularProgress, Grid } from '@rbx/ui';
import { useGroups } from '@modules/providers/groups/GroupsProvider';
import useGetUserById from '@modules/react-query/users/userQueries';
import useAppBreadcrumbsData from '../../layout/hooks/useAppBreadcrumbsData';
import CreatorStatus from '../components/CreatorStatus';

const CreatorsContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { user } = useAuthentication();
  const { groups, currentGroup, isFetched: isGroupsFetched, setCurrentGroup } = useGroups();
  const { currentItemType, isCurrentItemLoading, currentItemGroupId } = useAppBreadcrumbsData();
  const { data: userData, isFetched: isUserDataFetched } = useGetUserById(user?.id);
  const isFetched = isGroupsFetched && isUserDataFetched;

  useEffect(() => {
    if (currentItemType && !isCurrentItemLoading) {
      setCurrentGroup(currentItemGroupId ?? null);
    }
  }, [currentItemGroupId, currentItemType, isCurrentItemLoading, setCurrentGroup]);

  return (
    <Grid container justifyContent='flex-start' alignItems='center' wrap='nowrap'>
      {isFetched && user !== null && groups && userData && typeof currentGroup !== 'undefined' ? (
        <CreatorStatus
          authenticatedUser={user}
          groups={groups}
          currentGroup={currentGroup}
          setCurrentGroup={setCurrentGroup}
        />
      ) : (
        <CircularProgress color='secondary' />
      )}
    </Grid>
  );
};

export default CreatorsContainer;
