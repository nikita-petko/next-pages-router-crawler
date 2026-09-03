import type { FunctionComponent } from 'react';
import type { IPFamily, IPFamilyStatusReasonEnum } from '@rbx/client-rights/v1';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  makeStyles,
} from '@rbx/ui';
import getIpFamilyStatusReason from '../common/getIpFamilyStatusReason';
import { IP_FAMILY_EDIT_HREF } from '../urls';

const useStyles = makeStyles()(() => ({
  dialogContent: {
    paddingTop: 0,
  },
  dialogTitle: {
    paddingBottom: 16,
  },
}));

interface IpFamilyRejectReasonModalProps {
  ipFamily: IPFamily | null;
  reason: IPFamilyStatusReasonEnum;
  dialogOpen: boolean;
  onDialogClose: () => void;
}

// Dialog modal for viewing the reject reason of an IP Family.
const IpFamilyRejectReasonModal: FunctionComponent<IpFamilyRejectReasonModalProps> = ({
  ipFamily,
  reason,
  dialogOpen,
  onDialogClose,
}) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();

  if (ipFamily === null) {
    return null;
  }

  return (
    <Dialog open={dialogOpen} onClose={onDialogClose} onClick={(event) => event.stopPropagation()}>
      <DialogTitle className={classes.dialogTitle}>
        {translate('Label.RejectionReason')}
      </DialogTitle>
      <DialogContent className={classes.dialogContent}>
        <DialogContentText>{getIpFamilyStatusReason(reason, translate)}</DialogContentText>
      </DialogContent>
      <DialogContent className={classes.dialogContent}>
        <DialogContentText>{translate('Description.EditAndReview')}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          color='primaryBrand'
          variant='contained'
          onClick={onDialogClose}
          href={IP_FAMILY_EDIT_HREF(ipFamily.id ? ipFamily.id : '')}>
          {translate('Action.EditVerificationForm')}
        </Button>
        <Button color='secondary' variant='contained' onClick={onDialogClose}>
          {translate('Action.Cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IpFamilyRejectReasonModal;
