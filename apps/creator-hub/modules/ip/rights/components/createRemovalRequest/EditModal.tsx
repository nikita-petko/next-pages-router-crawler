import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Container, Drawer, Grid, makeStyles, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { TAddCreationProps } from './AddCreation';
import AddCreation from './AddCreation';

const useModalStyles = makeStyles()(() => {
  return {
    modalHeader: {
      marginTop: '24px',
      marginBottom: '40px',
    },
  };
});

const ModalHeader = ({ isDuplicating }: { isDuplicating: boolean }) => {
  const { translate, ready } = useTranslation();
  const {
    classes: { modalHeader },
  } = useModalStyles();
  if (!ready) {
    return null;
  }
  return (
    <Grid className={modalHeader}>
      <Typography variant='h1'>
        {isDuplicating ? translate('Heading.DuplicateCreation') : translate('Heading.EditCreation')}
      </Typography>
    </Grid>
  );
};

const EditModal: FunctionComponent<React.PropsWithChildren<TAddCreationProps>> = ({
  defaultValues,
  formMethods,
  takedownRequests,
  setTakedownRequests,
  setShowAddCreation,
  isEditing,
  setIsEditing,
  isDuplicating,
  editIndex,
  setEditIndex,
  rowsPerPage,
  setPage,
  activeStep,
  setActiveStep,
}) => {
  return (
    <Drawer
      anchor='right'
      variant='temporary'
      open={isEditing}
      PaperProps={{ style: { width: '40%', minWidth: 600 } }}
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Container>
        <ModalHeader isDuplicating={isDuplicating} />
        <AddCreation
          defaultValues={defaultValues}
          formMethods={formMethods}
          takedownRequests={takedownRequests}
          setTakedownRequests={setTakedownRequests}
          setShowAddCreation={setShowAddCreation}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          isDuplicating={isDuplicating}
          editIndex={editIndex}
          setEditIndex={setEditIndex}
          rowsPerPage={rowsPerPage}
          setPage={setPage}
          activeStep={activeStep}
          setActiveStep={setActiveStep}
        />
      </Container>
    </Drawer>
  );
};

export default withTranslation(EditModal, [TranslationNamespace.RightsPortal]);
