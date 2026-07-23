import type { FC } from 'react';
import React from 'react';
import PermissionEmptyState from '../Shared/PermissionEmptyState';
import type { PermissionAccessLevel, SharedSubjectDetails } from '../Shared/types';
import { PermissionTab } from '../Shared/types';
import AddCollaboratorsModal from './AddModal/AddCollaboratorsModal';
import CollaboratorsTableContainer from './Table/CollaboratorsTableContainer';

export type CollaboratorAccessActiveViewProps = {
  editPermissionAccessLevelEnabled: boolean;
  existingCollaborators: {
    all: SharedSubjectDetails[];
    changed: SharedSubjectDetails[];
  };
  potentialCollaborators: {
    proposed: SharedSubjectDetails[];
    unproposed: SharedSubjectDetails[];
  };
  openAddPermissionsModal: boolean;
  handleOpenAddPermissions: () => void;
  handleCloseAddPermissions: () => void;
  handleCancelProposedCollaboratorsAccess: () => void;
  handleUpdateProposedCollaboratorAccess: (
    collaborator: SharedSubjectDetails,
    proposedAccessLevel: PermissionAccessLevel,
  ) => void;
  handleUpdateStoredCollaboratorsAccess: (newCollaboratorsOnly?: boolean) => Promise<void>;
  handleRemoveStoredCollaboratorAccess: (collaborator: SharedSubjectDetails) => Promise<void>;
  handleRemoveProposedCollaboratorAccess: (collaborator: SharedSubjectDetails) => void;
};

const CollaboratorAccessActiveView: FC<CollaboratorAccessActiveViewProps> = ({
  editPermissionAccessLevelEnabled,
  existingCollaborators,
  potentialCollaborators,
  openAddPermissionsModal,
  handleOpenAddPermissions,
  handleCloseAddPermissions,
  handleCancelProposedCollaboratorsAccess,
  handleUpdateProposedCollaboratorAccess,
  handleUpdateStoredCollaboratorsAccess,
  handleRemoveStoredCollaboratorAccess,
  handleRemoveProposedCollaboratorAccess,
}) => (
  <>
    {existingCollaborators.all.length === 0 ? (
      <PermissionEmptyState
        handleOpenAddPermissions={handleOpenAddPermissions}
        permissionTab={PermissionTab.COLLABORATORS}
      />
    ) : (
      <CollaboratorsTableContainer
        editPermissionAccessLevelEnabled={editPermissionAccessLevelEnabled}
        existingCollaborators={existingCollaborators}
        handleCancelProposedCollaboratorsAccess={handleCancelProposedCollaboratorsAccess}
        handleOpenAddPermissions={handleOpenAddPermissions}
        handleUpdateProposedCollaboratorAccess={handleUpdateProposedCollaboratorAccess}
        handleUpdateStoredCollaboratorsAccess={handleUpdateStoredCollaboratorsAccess}
        handleRemoveStoredCollaboratorAccess={handleRemoveStoredCollaboratorAccess}
      />
    )}
    <AddCollaboratorsModal
      editPermissionAccessLevelEnabled={editPermissionAccessLevelEnabled}
      potentialCollaborators={potentialCollaborators}
      handleCloseAddPermissions={handleCloseAddPermissions}
      handleRemoveProposedCollaboratorAccess={handleRemoveProposedCollaboratorAccess}
      handleUpdateProposedCollaboratorAccess={handleUpdateProposedCollaboratorAccess}
      handleUpdateStoredCollaboratorsAccess={handleUpdateStoredCollaboratorsAccess}
      open={openAddPermissionsModal}
    />
  </>
);

export default CollaboratorAccessActiveView;
