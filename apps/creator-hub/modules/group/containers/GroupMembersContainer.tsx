import React, { FunctionComponent } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import { CircularProgress, Grid } from '@rbx/ui';
import useCurrentOrganization from '../hooks/useCurrentOrganization';
import GroupMembersV2 from '../components/groupMembersV2/GroupMembersV2';

const GroupMembersContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
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
