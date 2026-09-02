import { Fragment } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  makeStyles,
  Typography,
} from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

interface CommerceAcceptBundlingFeeModalProps {
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

const CommerceAcceptBundlingFeeModal = ({
  onCancel,
  onConfirm,
  isLoading,
}: CommerceAcceptBundlingFeeModalProps) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();

  return (
    <>
      <DialogTitle>{translate('Heading.AcceptBundlingFees')}</DialogTitle>
      <DialogContent>
        <DialogContentText className={classes.dialog}>
          <Typography variant='body1' color='primary'>
            {translate('Description.AcceptBundlingFee')}
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
          size='large'
          onClick={onConfirm}
          disabled={isLoading}
          loading={isLoading}>
          {translate('Action.Accept')}
        </Button>
      </DialogActions>
    </>
  );
};

export default withTranslation(CommerceAcceptBundlingFeeModal, [TranslationNamespace.Commerce]);
