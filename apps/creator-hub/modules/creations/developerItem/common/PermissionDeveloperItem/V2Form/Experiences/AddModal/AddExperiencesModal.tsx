import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Link,
  TextField,
  Typography,
} from '@rbx/ui';
import { ASSET_ACCESS_PRIVACY } from '../../../../../../../miscellaneous/common/constants/linkConstants';
import type { SharedSubjectDetails } from '../../Shared/types';
import ExperiencesTable from '../Table/ExperiencesTable';
import useAddExperiencesModalStyles from './AddExperiencesModal.styles';

export type AddExperiencesModalProps = {
  open: boolean;
  proposedExperiences: SharedSubjectDetails[];
  proposedExperienceErrors: string[];
  isAddingProposedExperiencesLoading: boolean;
  handleProposeExperiences: (search: string) => Promise<void>;
  handleRemoveProposedExperience: (experience: SharedSubjectDetails) => void;
  handleSubmitProposedExperienceAccess: () => void;
};

const AddExperiencesModal: FunctionComponent<React.PropsWithChildren<AddExperiencesModalProps>> = ({
  open,
  proposedExperiences,
  proposedExperienceErrors,
  isAddingProposedExperiencesLoading,
  handleProposeExperiences,
  handleRemoveProposedExperience,
  handleSubmitProposedExperienceAccess,
}) => {
  const {
    classes: { addButton, searchContainer, searchFieldErrored, titleContainer },
  } = useAddExperiencesModalStyles();
  const { translate } = useTranslation();

  const [searchInputValue, setSearchInputValue] = useState('');

  const memoizedHelperTextComponent = useMemo(() => {
    if (proposedExperienceErrors.length === 0) {
      <Typography variant='body2'>{translate('Label.SeparateIdsCommas')}</Typography>;
    }

    return (
      // Grid component set to 'span' to avoid linting error from nesting 'div' tag inside 'p' tag
      <Grid container component='span' direction='column'>
        {proposedExperienceErrors.map((error) => (
          <Typography variant='body2' key={error}>
            {error}
          </Typography>
        ))}
      </Grid>
    );
  }, [proposedExperienceErrors, translate]);

  const handleTextFieldChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInputValue(event.target.value);
  }, []);

  const handleExperienceSearchSubmit = useCallback(async () => {
    await handleProposeExperiences(searchInputValue);
    setSearchInputValue('');
  }, [handleProposeExperiences, searchInputValue]);

  return (
    <Dialog
      data-testid='add-experiences-modal'
      maxWidth='Medium'
      closeAfterTransition={false} // Needed to prevent "blocked area-hidden" error
      open={open}>
      <DialogTitle>
        <Grid container gap={1} classes={{ root: titleContainer }}>
          <Typography color='primary' variant='h1'>
            {translate('Heading.AddExperiences')}
          </Typography>
          <Typography color='secondary' variant='body1'>
            {translate('Description.AddExperiences')}
          </Typography>
        </Grid>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} classes={{ root: searchContainer }}>
          <Grid item XSmall={10}>
            <TextField
              fullWidth
              id='proposed-experience-search'
              size='small'
              error={proposedExperienceErrors.length !== 0}
              label={translate('Label.ExperienceIdSearchLabel')}
              onChange={handleTextFieldChange}
              value={searchInputValue}
              helperText={memoizedHelperTextComponent}
              classes={{ root: proposedExperienceErrors.length !== 0 ? searchFieldErrored : '' }}
            />
          </Grid>
          <Grid item XSmall={2}>
            <Button
              fullWidth
              color='primary'
              size='large'
              variant='outlined'
              disabled={searchInputValue === ''}
              loading={isAddingProposedExperiencesLoading}
              onClick={handleExperienceSearchSubmit}
              classes={{ root: addButton }}>
              {translate('Button.Add')}
            </Button>
          </Grid>
        </Grid>
        {proposedExperiences.length > 0 && (
          <>
            <ExperiencesTable
              proposedExperiences={proposedExperiences}
              handleRemoveProposedExperience={handleRemoveProposedExperience}
            />
            <Alert severity='warning'>
              <Typography variant='body2'>
                {translate('Message.PermissionPermanent')}
                &nbsp;
              </Typography>
              <Typography
                variant='body2'
                component={Link}
                aria-label={translate('Link.LearnMore')}
                href={ASSET_ACCESS_PRIVACY}
                target='_blank'>
                {translate('Link.LearnMore')}
              </Typography>
            </Alert>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant='contained' onClick={handleSubmitProposedExperienceAccess}>
          {translate('Button.Done')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddExperiencesModal;
