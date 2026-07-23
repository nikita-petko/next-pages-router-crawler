import { Autocomplete, Grid, SearchIcon, TextField, Typography } from '@rbx/ui';
import React, { FunctionComponent, useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { SharedSubjectDetails } from './PermissionDeveloperItemTable';
import useCollaboratorAutocompleteStyles from './CollaboratorAutocomplete.styles';

export type CollaboratorAutocompleteProps = {
  errorMessage?: string;
  onAutocompleteAdd: (id: number) => void;
  searchLabel: string;
  sharedSubjectDetailsList: Map<number, SharedSubjectDetails>;
};

const CollaboratorAutocomplete: FunctionComponent<
  React.PropsWithChildren<CollaboratorAutocompleteProps>
> = ({ errorMessage, onAutocompleteAdd, searchLabel, sharedSubjectDetailsList }) => {
  const {
    classes: { avatarCell, input },
  } = useCollaboratorAutocompleteStyles();
  const { translate } = useTranslation();

  const handleAutocompleteChange = useCallback(
    (event: React.SyntheticEvent, option: SharedSubjectDetails | null, reason: string) => {
      if (reason === 'selectOption' && option) {
        onAutocompleteAdd(option.subjectId);
      }
    },
    [onAutocompleteAdd],
  );

  return (
    <Grid item XSmall={8}>
      <Autocomplete
        options={Array.from(sharedSubjectDetailsList.values()) || []}
        noOptionsText={translate('Label.NoOptions')}
        onChange={(event, value, reason) => handleAutocompleteChange(event, value, reason)}
        forcePopupIcon={false}
        blurOnSelect
        value={null}
        renderOption={(props, option) => (
          <li {...props}>
            <Grid container classes={{ root: avatarCell }}>
              <Grid item>{option.thumbnail}</Grid>
              <Grid item>
                <Grid item>
                  <Typography variant='h6'>{option.subjectName}</Typography>
                </Grid>
                <Grid item>
                  <Typography variant='body2'>{option.subjectId}</Typography>
                </Grid>
              </Grid>
            </Grid>
          </li>
        )}
        getOptionLabel={(option) => option.subjectName}
        renderInput={(params) => (
          <TextField
            {...params}
            error={!!errorMessage}
            helperText={errorMessage ?? ''}
            size='small'
            InputProps={{
              ...params.InputProps,
              classes: { input },
              startAdornment: <SearchIcon />,
            }}
            label={params.inputProps.value ? searchLabel : ''}
            placeholder={searchLabel}
          />
        )}
      />
    </Grid>
  );
};

export default CollaboratorAutocomplete;
