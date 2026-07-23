import { Grid } from '@rbx/ui';
import React, { FunctionComponent, useCallback, useState } from 'react';
import CollaboratorsTableHeader from './CollaboratorsTableHeader';
import { PermissionAccessLevel, SharedSubjectDetails } from '../../Shared/types';
import CollaboratorsTable from './CollaboratorsTable';

export interface CollaboratorsTableContainerProps {
  editPermissionAccessLevelEnabled: boolean;
  existingCollaborators: {
    all: SharedSubjectDetails[];
    changed: SharedSubjectDetails[];
  };
  handleCancelProposedCollaboratorsAccess: () => void;
  handleOpenAddPermissions: () => void;
  handleRemoveStoredCollaboratorAccess: (collaborator: SharedSubjectDetails) => void;
  handleUpdateProposedCollaboratorAccess: (
    collaborator: SharedSubjectDetails,
    proposedAccessLevel: PermissionAccessLevel,
  ) => void;
  handleUpdateStoredCollaboratorsAccess: (newCollaboratorsOnly: boolean) => void;
}

const CollaboratorsTableContainer: FunctionComponent<
  React.PropsWithChildren<CollaboratorsTableContainerProps>
> = ({
  editPermissionAccessLevelEnabled,
  existingCollaborators,
  handleCancelProposedCollaboratorsAccess,
  handleOpenAddPermissions,
  handleRemoveStoredCollaboratorAccess,
  handleUpdateProposedCollaboratorAccess,
  handleUpdateStoredCollaboratorsAccess,
}) => {
  const [filteredExistingCollaborators, setFilteredExistingCollaborators] = useState(
    existingCollaborators.all,
  );

  const handleSetFilteredExistingCollaborators = useCallback(
    (filteredCollaborators: SharedSubjectDetails[]) => {
      setFilteredExistingCollaborators(filteredCollaborators);
    },
    [],
  );

  return (
    <Grid container data-testid='collaborators-table-container' gap={2}>
      <Grid item XSmall={12}>
        <CollaboratorsTableHeader
          existingCollaborators={existingCollaborators.all}
          handleOpenAddPermissions={handleOpenAddPermissions}
          handleSetFilteredExistingCollaborators={handleSetFilteredExistingCollaborators}
        />
      </Grid>
      <Grid item XSmall={12}>
        <CollaboratorsTable
          changedCount={existingCollaborators.changed.length}
          collaborators={filteredExistingCollaborators}
          editPermissionAccessLevelEnabled={editPermissionAccessLevelEnabled}
          handleCancelProposedCollaboratorsAccess={handleCancelProposedCollaboratorsAccess}
          handleUpdateProposedCollaboratorAccess={handleUpdateProposedCollaboratorAccess}
          handleUpdateStoredCollaboratorsAccess={handleUpdateStoredCollaboratorsAccess}
          handleRemoveCollaboratorAccess={handleRemoveStoredCollaboratorAccess}
          isModalView={false}
        />
      </Grid>
    </Grid>
  );
};

export default CollaboratorsTableContainer;
