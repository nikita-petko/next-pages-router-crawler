import type { FC } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { CircularProgress, Grid, Typography } from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { useListAssetPermissionRequests } from '@modules/react-query/assetPermissions/assetAccessRequestsQueries';
import AccessRequestsTable from './Table/AccessRequestsTable';

export type CollaboratorAccessRequestsViewProps = {
  assetId: number;
};

const CollaboratorAccessRequestsView: FC<CollaboratorAccessRequestsViewProps> = ({ assetId }) => {
  const { translate } = useTranslation();
  const { data, isPending, isError } = useListAssetPermissionRequests(assetId);

  if (isPending) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  if (isError) {
    return (
      <Grid container justifyContent='center' padding={4}>
        <Typography variant='body1'>{translate('Error.LoadAccessRequests')}</Typography>
      </Grid>
    );
  }

  const requests = data?.requests ?? [];

  if (requests.length === 0) {
    return (
      <Grid container justifyContent='center' padding={4}>
        <Typography variant='body1'>{translate('Message.NoAccessRequests')}</Typography>
      </Grid>
    );
  }

  return (
    <Grid container data-testid='access-requests-view'>
      <Grid item XSmall={12}>
        <AccessRequestsTable assetId={assetId} requests={requests} />
      </Grid>
    </Grid>
  );
};

export default CollaboratorAccessRequestsView;
