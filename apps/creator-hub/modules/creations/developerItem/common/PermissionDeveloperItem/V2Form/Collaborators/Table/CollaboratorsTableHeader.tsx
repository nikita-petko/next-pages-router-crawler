import {
  AddIcon,
  Button,
  Grid,
  InputAdornment,
  MenuItem,
  SearchIcon,
  Select,
  TextField,
} from '@rbx/ui';
import React, { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { SubjectType } from '@rbx/clients/assetPermissionsApi';
import useCollaboratorsTableHeaderStyles from './CollaboratorsTableHeader.styles';
import { SharedSubjectDetails } from '../../Shared/types';

export interface CollaboratorsTableHeaderProps {
  existingCollaborators: SharedSubjectDetails[];
  handleOpenAddPermissions: () => void;
  handleSetFilteredExistingCollaborators: (filteredCollaborators: SharedSubjectDetails[]) => void;
}

const CollaboratorsTableHeader: FunctionComponent<
  React.PropsWithChildren<CollaboratorsTableHeaderProps>
> = ({
  existingCollaborators,
  handleOpenAddPermissions,
  handleSetFilteredExistingCollaborators,
}) => {
  const {
    classes: {
      addCollaboratorsButton,
      collaboratorSearchInput,
      collaboratorTypeDropdown,
      headerContainer,
    },
  } = useCollaboratorsTableHeaderStyles();
  const { translate } = useTranslation();

  const [collaboratorSearchValue, setCollaboratorSearchValue] = useState<string>('');
  const [collaboratorType, setCollaboratorType] = useState<SubjectType>(SubjectType.All);

  const previousFilteredExistingCollaborators = useRef<SharedSubjectDetails[] | null>(null);

  const handleSetCollaboratorSearchValue = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCollaboratorSearchValue(event.target.value);
    },
    [],
  );

  const handleSetCollaboratorType = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCollaboratorType(event.target.value as SubjectType);
  }, []);

  const filteredExistingCollaborators = useMemo(() => {
    let filteredCollaborators = existingCollaborators;

    if (collaboratorType !== SubjectType.All) {
      filteredCollaborators = filteredCollaborators.filter(
        (collaborator) => collaborator.subjectType === collaboratorType,
      );
    }

    if (collaboratorSearchValue !== '') {
      filteredCollaborators = existingCollaborators.filter((collaborator) =>
        collaborator.subjectName.toLowerCase().includes(collaboratorSearchValue.toLowerCase()),
      );
    }

    return filteredCollaborators;
  }, [collaboratorSearchValue, collaboratorType, existingCollaborators]);

  useEffect(() => {
    // Only update the filtered collaborators if they have changed
    if (
      previousFilteredExistingCollaborators.current &&
      previousFilteredExistingCollaborators.current !== filteredExistingCollaborators
    ) {
      handleSetFilteredExistingCollaborators(filteredExistingCollaborators);
    }
    previousFilteredExistingCollaborators.current = filteredExistingCollaborators;
  }, [filteredExistingCollaborators, handleSetFilteredExistingCollaborators]);

  return (
    <Grid
      container
      item
      data-testid='collaborators-table-header'
      justifyContent='space-between'
      XSmall={12}
      classes={{ root: headerContainer }}>
      <Grid item container spacing={2} XSmall={8}>
        <Grid item XSmall={8}>
          <TextField
            fullWidth
            id='search'
            label={collaboratorSearchValue ? translate('Label.SearchCollaborators') : ''}
            onChange={handleSetCollaboratorSearchValue}
            placeholder={translate('Label.SearchCollaborators')}
            value={collaboratorSearchValue}
            InputProps={{
              classes: { root: collaboratorSearchInput },
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item XSmall={4}>
          <Select
            fullWidth
            id='collaborator-type'
            label={translate('Label.CollaboratorType')}
            onChange={handleSetCollaboratorType}
            value={collaboratorType}
            classes={{ root: collaboratorTypeDropdown }}>
            <MenuItem value={SubjectType.All}>{translate('Label.CollaboratorTypeAll')}</MenuItem>
            <MenuItem value={SubjectType.User}>{translate('Label.CollaboratorTypeUser')}</MenuItem>
            <MenuItem value={SubjectType.Group}>
              {translate('Label.CollaboratorTypeGroup')}
            </MenuItem>
          </Select>
        </Grid>
      </Grid>
      <Grid container item justifyContent='flex-end' XSmall={3}>
        <Button
          color='primary'
          variant='contained'
          onClick={handleOpenAddPermissions}
          startIcon={<AddIcon />}
          classes={{ root: addCollaboratorsButton }}>
          {translate('Button.AddCollaborators')}
        </Button>
      </Grid>
    </Grid>
  );
};

export default CollaboratorsTableHeader;
