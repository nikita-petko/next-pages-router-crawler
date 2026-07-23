import React, { FunctionComponent } from 'react';
import { useAuthentication } from '@modules/authentication/providers';
import { useGroups } from '@modules/providers/groups/GroupsProvider';
import { CircularProgress, Grid } from '@rbx/ui';

const CurrentCreatorName: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { user } = useAuthentication();
  const { groups, currentGroup } = useGroups();
  const userName = process.env.buildTarget === 'luobu' ? user?.displayName : user?.name;
  const currentCreatorName = currentGroup ? currentGroup.name : userName;

  return (
    <Grid container justifyContent='flex-start' alignItems='center' wrap='nowrap'>
      {user !== null && groups !== null && typeof currentGroup !== 'undefined' ? (
        currentCreatorName
      ) : (
        <CircularProgress color='secondary' />
      )}
    </Grid>
  );
};

export default CurrentCreatorName;
