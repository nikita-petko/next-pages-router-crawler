import { useFormContext } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, Container, Drawer, Grid } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ClaimRequest } from '../../../types/types';
import type { SingleCreationFields } from './EditSingleCreationForm';
import EditSingleCreationForm from './EditSingleCreationForm';
import ModalHeader from './ModalHeader';

export interface EditCreationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDuplicating: boolean;
  claimRequests: ClaimRequest[];
  onSubmit: () => void;
}

/**
 * EditCreationModal presents a modal housing a form to edit a creation.
 */
const EditCreationModal = ({
  isOpen,
  onClose,
  isDuplicating,
  claimRequests,
  onSubmit,
}: EditCreationsModalProps) => {
  const { ready, translate } = useTranslation();

  const {
    formState: { isDirty },
  } = useFormContext<SingleCreationFields>();

  if (!ready) {
    return null;
  }
  return (
    <Drawer
      anchor='right'
      variant='temporary'
      open={isOpen}
      PaperProps={{ style: { width: '40%', minWidth: 600 } }}
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Container>
        <ModalHeader isDuplicating={isDuplicating} />
        <EditSingleCreationForm claimRequests={claimRequests} />
        <Grid item container spacing={1}>
          <Grid item>
            <Button variant='outlined' color='primary' size='medium' onClick={onClose}>
              {translate('Label.Cancel')}
            </Button>
          </Grid>
          <Grid item>
            <Button
              disabled={!isDuplicating && !isDirty}
              variant='contained'
              color='primary'
              size='medium'
              onClick={onSubmit}>
              {isDuplicating ? translate('Label.AddCreation') : translate('Label.SaveCreation')}
            </Button>
          </Grid>
        </Grid>
      </Container>
    </Drawer>
  );
};

export default withTranslation(EditCreationModal, [TranslationNamespace.RightsPortal]);
