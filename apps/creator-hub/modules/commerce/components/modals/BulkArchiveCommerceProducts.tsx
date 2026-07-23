import React, { Fragment, FunctionComponent } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  makeStyles,
  Typography,
} from '@rbx/ui';

export interface BulkArchiveCommerceProductsProps {
  onCancel: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const useStyles = makeStyles()((theme) => {
  return {
    dialog: {
      marginBottom: theme.spacing(0.5),
    },
  };
});

/**
 * Modal to prompt the user to confirm before bulk archiving commerce items.
 */
const BulkArchiveCommerceProducts: FunctionComponent<BulkArchiveCommerceProductsProps> = ({
  onCancel,
  onConfirm,
  isLoading,
}) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();

  return (
    <Fragment>
      <DialogTitle>{translate('Heading.ArchiveCommerceProduct')}</DialogTitle>
      <DialogContent>
        <DialogContentText className={classes.dialog}>
          <Typography variant='body1' color='primary'>
            {translate('Description.ArchiveCommerceProduct')}
          </Typography>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          variant='outlined'
          color='primary'
          onClick={onCancel}
          size='large'
          disabled={isLoading}>
          {translate('Action.Cancel')}
        </Button>
        <Button
          variant='contained'
          color='destructive'
          size='large'
          onClick={onConfirm}
          disabled={isLoading}
          loading={isLoading}>
          {translate('Action.Remove')}
        </Button>
      </DialogActions>
    </Fragment>
  );
};

export default withTranslation(BulkArchiveCommerceProducts, [TranslationNamespace.Commerce]);
