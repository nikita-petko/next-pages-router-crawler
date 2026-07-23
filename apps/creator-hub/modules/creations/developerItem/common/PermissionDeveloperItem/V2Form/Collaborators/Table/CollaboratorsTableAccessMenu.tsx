import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { SubjectType } from '@rbx/client-asset-permissions-api/v1';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  Select,
  Typography,
} from '@rbx/ui';
import type { SharedSubjectDetails } from '../../Shared/types';
import { PermissionAccessLevel } from '../../Shared/types';
import useCollaboratorsTableAccessMenuStyles from './CollaboratorsTableAccessMenu.styles';

export interface CollaboratorsTableAccessMenuProps {
  areRemovalsLocal: boolean;
  collaborator: SharedSubjectDetails;
  editPermissionAccessLevelEnabled: boolean;
  handleUpdateProposedCollaboratorAccess: (
    collaborator: SharedSubjectDetails,
    proposedAccessLevel: PermissionAccessLevel,
  ) => void;
  handleRemoveCollaboratorAccess: (collaborator: SharedSubjectDetails) => void;
}

const CollaboratorsTableAccessMenu: FunctionComponent<
  React.PropsWithChildren<CollaboratorsTableAccessMenuProps>
> = ({
  areRemovalsLocal,
  collaborator,
  editPermissionAccessLevelEnabled,
  handleUpdateProposedCollaboratorAccess,
  handleRemoveCollaboratorAccess,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { dialog, divider, removeText },
  } = useCollaboratorsTableAccessMenuStyles();

  const [openRemoveConfirmation, setOpenRemoveConfirmation] = useState(false);

  // Currently, only users can have EDIT permissions
  const displayEditAccessLevel =
    editPermissionAccessLevelEnabled && collaborator.subjectType === SubjectType.User;

  const renderValue = useMemo(() => {
    if (displayEditAccessLevel && collaborator.proposedAccessLevel === PermissionAccessLevel.EDIT) {
      return translate('Message.Edit');
    }

    return translate('Message.Use');
  }, [collaborator.proposedAccessLevel, displayEditAccessLevel, translate]);

  const cancelRemoveCollaborator = useCallback(() => {
    setOpenRemoveConfirmation(false);
  }, []);

  const confirmRemoveCollaborator = useCallback(() => {
    handleRemoveCollaboratorAccess(collaborator);
    setOpenRemoveConfirmation(false);
  }, [collaborator, handleRemoveCollaboratorAccess]);

  const handleProposeAccessLevel = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const proposedAccessLevel = event.target.value as PermissionAccessLevel;
      if (proposedAccessLevel === PermissionAccessLevel.NONE) {
        if (areRemovalsLocal) {
          // Local removals do not require confirmation
          handleRemoveCollaboratorAccess(collaborator);
        } else {
          setOpenRemoveConfirmation(true);
        }
      } else {
        handleUpdateProposedCollaboratorAccess(collaborator, proposedAccessLevel);
      }
    },
    [
      areRemovalsLocal,
      collaborator,
      handleRemoveCollaboratorAccess,
      handleUpdateProposedCollaboratorAccess,
    ],
  );

  return (
    <Grid container>
      <Select
        fullWidth
        data-testid='collaborators-table-access-menu'
        onChange={handleProposeAccessLevel}
        value={collaborator.proposedAccessLevel}
        // renderValue is used to avoid displaying the subtitle in the select field
        renderValue={() => renderValue}>
        <MenuItem value={PermissionAccessLevel.USE}>
          <Grid container item direction='column'>
            <Typography color='primary' variant='body1'>
              {translate('Message.Use')}
            </Typography>
            <Typography color='secondary' variant='caption'>
              {translate('Label.UseSubtitle')}
            </Typography>
          </Grid>
        </MenuItem>
        {displayEditAccessLevel && (
          <MenuItem value={PermissionAccessLevel.EDIT}>
            <Grid container direction='column'>
              <Typography color='primary' variant='body1'>
                {translate('Message.Edit')}
              </Typography>
              <Typography color='secondary' variant='caption'>
                {translate('Label.EditSubtitle')}
              </Typography>
            </Grid>
          </MenuItem>
        )}
        <Divider className={divider} />
        <MenuItem value={PermissionAccessLevel.NONE}>
          <Typography variant='body1' className={removeText}>
            {translate('Action.Remove')}
          </Typography>
        </MenuItem>
      </Select>
      <Dialog open={openRemoveConfirmation} classes={{ paper: dialog }}>
        <DialogTitle>{translate('Heading.RemoveCollaborator')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{translate('Description.RemoveCollaborator')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color='primary' variant='outlined' onClick={cancelRemoveCollaborator}>
            {translate('Action.Cancel')}
          </Button>
          <Button color='destructive' variant='contained' onClick={confirmRemoveCollaborator}>
            {translate('Action.Remove')}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default CollaboratorsTableAccessMenu;
