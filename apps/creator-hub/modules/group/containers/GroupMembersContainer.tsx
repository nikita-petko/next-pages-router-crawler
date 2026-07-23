import type { FunctionComponent } from 'react';
import React from 'react';
import { withTranslation } from '@rbx/intl';
import { CircularProgress, Grid } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import GroupMembersV2 from '../components/groupMembersV2/GroupMembersV2';
import useCurrentOrganization from '../hooks/useCurrentOrganization';

const GroupMembersContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { organization } = useCurrentOrganization();

  if (!organization) {
    return (
      <Grid container justifyContent='center'>
        <CircularProgress />
      </Grid>
    );
  }

  return <GroupMembersV2 />;
};

export default withTranslation(GroupMembersContainer, [TranslationNamespace.Organization]);
