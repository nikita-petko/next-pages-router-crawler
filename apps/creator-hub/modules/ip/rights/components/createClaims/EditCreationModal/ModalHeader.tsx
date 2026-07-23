import React from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, makeStyles, Typography } from '@rbx/ui';

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

export default withTranslation(ModalHeader, [TranslationNamespace.RightsPortal]);
