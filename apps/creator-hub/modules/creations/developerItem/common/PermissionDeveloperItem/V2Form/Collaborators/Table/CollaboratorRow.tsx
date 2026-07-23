import { Grid, Link, Typography } from '@rbx/ui';
import React, { FunctionComponent } from 'react';
import { SubjectType } from '@rbx/clients/assetPermissionsApi';
import { SharedSubjectDetails } from '../../Shared/types';
import PermissionThumbnail from '../../Shared/PermissionThumbnail';

const wwwPath = `https://${process.env.robloxSiteDomain}`;
const getCollaboratorPath = (collaborator: SharedSubjectDetails) => {
  switch (collaborator.subjectType) {
    case 'User':
      return `${wwwPath}/users/${collaborator.subjectId}/profile`;
    case 'Group':
      return `${wwwPath}/groups/${collaborator.subjectId}`;
    default:
      return '';
  }
};

export interface CollaboratorRowProps {
  collaborator: SharedSubjectDetails;
}

const CollaboratorRow: FunctionComponent<React.PropsWithChildren<CollaboratorRowProps>> = ({
  collaborator,
}) => {
  const collaboratorLinkName =
    collaborator.subjectType === SubjectType.User
      ? `@${collaborator?.subjectUsername ?? collaborator.subjectName}`
      : collaborator.subjectName; // Groups and experiences don't have usernames

  return (
    <Grid container alignItems='center' gap={1}>
      <PermissionThumbnail subject={collaborator} />
      <Grid item>
        <Grid item>
          <Typography variant='body1'>{collaborator.subjectName}</Typography>
        </Grid>
        <Grid item>
          <Link color='inherit' href={getCollaboratorPath(collaborator)} target='_blank'>
            <Typography color='primary' variant='body2'>
              {collaboratorLinkName}
            </Typography>
          </Link>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default CollaboratorRow;
