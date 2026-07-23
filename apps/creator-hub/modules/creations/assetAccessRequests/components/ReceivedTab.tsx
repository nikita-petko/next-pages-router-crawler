import type { FC } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import type { AssetPermissionRequest } from '@modules/clients/assetPermissions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import UniversalAccessRequestsTable from './UniversalAccessRequestsTable';

type ReceivedTabProps = {
  requests: AssetPermissionRequest[];
  selectedRequestIds: ReadonlySet<string>;
  onSelectionChange: (requestId: string, isSelected: boolean) => void;
  onSelectAll: (selectAll: boolean) => void;
};

const ReceivedTab: FC<ReceivedTabProps> = ({
  requests,
  selectedRequestIds,
  onSelectionChange,
  onSelectAll,
}) => {
  const { translateWithNamespace } = useTranslation();

  if (requests.length === 0) {
    return (
      <Grid container justifyContent='center' padding={4}>
        <Typography variant='body1'>
          {translateWithNamespace(
            TranslationNamespace.AssetPermissions,
            'Message.NoAccessRequests',
          )}
        </Typography>
      </Grid>
    );
  }

  return (
    <UniversalAccessRequestsTable
      requests={requests}
      selectedRequestIds={selectedRequestIds}
      onSelectionChange={onSelectionChange}
      onSelectAll={onSelectAll}
    />
  );
};

export default ReceivedTab;
