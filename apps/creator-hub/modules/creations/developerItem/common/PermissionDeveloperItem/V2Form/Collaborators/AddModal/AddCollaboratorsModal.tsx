import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
// TODO: Replace with `@rbx/ui` or `@rbx/foundation-ui` import — `createFilterOptions` is not yet exported from either
import { createFilterOptions } from '@mui/material/Autocomplete';
import { useTranslation } from '@rbx/intl';
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  SearchIcon,
  TextField,
  Typography,
} from '@rbx/ui';
import type { SharedSubjectDetails } from '../../Shared/types';
import { PermissionAccessLevel } from '../../Shared/types';
import CollaboratorRow from '../Table/CollaboratorRow';
import CollaboratorsTable from '../Table/CollaboratorsTable';
import useAddCollaboratorsModalStyles from './AddCollaboratorsModal.styles';

export type AddCollaboratorsModalProps = {
  editPermissionAccessLevelEnabled: boolean;
  potentialCollaborators: {
    proposed: SharedSubjectDetails[];
    unproposed: SharedSubjectDetails[];
  };
  handleCloseAddPermissions: () => void;
  handleRemoveProposedCollaboratorAccess: (collaborator: SharedSubjectDetails) => void;
  handleUpdateProposedCollaboratorAccess: (
    collaborator: SharedSubjectDetails,
    proposedAccessLevel: PermissionAccessLevel,
  ) => void;
  handleUpdateStoredCollaboratorsAccess: (newCollaboratorsOnly: boolean) => void;
  open: boolean;
};

const AddCollaboratorsModal: FunctionComponent<
  React.PropsWithChildren<AddCollaboratorsModalProps>
> = ({
  editPermissionAccessLevelEnabled,
  potentialCollaborators,
  handleCloseAddPermissions,
  handleRemoveProposedCollaboratorAccess,
  handleUpdateProposedCollaboratorAccess,
  handleUpdateStoredCollaboratorsAccess,
  open,
}) => {
  const {
    classes: { autocomplete, input, titleContainer },
  } = useAddCollaboratorsModalStyles();
  const { translate } = useTranslation();

  const handleAutocompleteChange = useCallback(
    (event: React.SyntheticEvent, option: SharedSubjectDetails | null, reason: string) => {
      if (reason === 'selectOption' && option) {
        handleUpdateProposedCollaboratorAccess(option, PermissionAccessLevel.USE);
      }
    },
    [handleUpdateProposedCollaboratorAccess],
  );

  const handleClickDone = useCallback(() => {
    handleUpdateStoredCollaboratorsAccess(true);
    handleCloseAddPermissions();
  }, [handleCloseAddPermissions, handleUpdateStoredCollaboratorsAccess]);

  const autocompleteFilterOptions = createFilterOptions({
    // Include both the username (if present) and the name in the stringified option
    // This allows for the autocomplete to match on both the username and the name
    stringify: (option: SharedSubjectDetails) =>
      option.subjectUsername
        ? `${option.subjectUsername} ${option.subjectName}`
        : option.subjectName,
  });

  return (
    <Dialog
      data-testid='add-collaborators-modal'
      maxWidth='Medium'
      closeAfterTransition={false} // Needed to prevent "blocked area-hidden" error
      open={open}
      onClose={handleCloseAddPermissions}>
      <DialogTitle>
        <Grid container gap={1} classes={{ root: titleContainer }}>
          <Typography color='primary' variant='h1'>
            {translate('Heading.AddCollaborators')}
          </Typography>
          <Typography color='secondary' variant='body1'>
            {translate('Description.AddCollaborators.FriendsRename')}
          </Typography>
        </Grid>
      </DialogTitle>
      <DialogContent>
        <Autocomplete
          blurOnSelect
          data-testid='autocomplete'
          forcePopupIcon={false}
          filterOptions={autocompleteFilterOptions}
          isOptionEqualToValue={(option, value) => option.subjectId === value.subjectId}
          onChange={handleAutocompleteChange}
          options={potentialCollaborators.unproposed}
          noOptionsText={translate('Label.NoOptions')}
          renderInput={(params) => (
            <TextField
              {...params}
              size='small'
              InputProps={{
                ...params.InputProps,
                classes: { input },
                startAdornment: <SearchIcon />,
              }}
              // Only display the label when the input field is populated
              // When the input field is empty, this will be displayed as a placeholder
              label={
                params.inputProps.value
                  ? translate('Label.SearchFriendsAndGroups.FriendsRename')
                  : ''
              }
              placeholder={translate('Label.SearchFriendsAndGroups.FriendsRename')}
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.subjectId}>
              <CollaboratorRow collaborator={option} />
            </li>
          )}
          value={null}
          classes={{ root: autocomplete }}
        />
        <CollaboratorsTable
          collaborators={potentialCollaborators.proposed}
          editPermissionAccessLevelEnabled={editPermissionAccessLevelEnabled}
          handleUpdateProposedCollaboratorAccess={handleUpdateProposedCollaboratorAccess}
          handleUpdateStoredCollaboratorsAccess={handleUpdateStoredCollaboratorsAccess}
          handleRemoveCollaboratorAccess={handleRemoveProposedCollaboratorAccess}
          isModalView
        />
      </DialogContent>
      <DialogActions>
        <Button variant='contained' onClick={handleClickDone}>
          {translate('Button.Done')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCollaboratorsModal;
