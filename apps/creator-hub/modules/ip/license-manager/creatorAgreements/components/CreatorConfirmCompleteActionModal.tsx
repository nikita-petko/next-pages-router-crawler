import { FunctionComponent, useCallback } from 'react';
import {
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Button,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../../utils/logger';

export enum CreatorConfirmationType {
  ChangeRequest = 'ChangeRequest',
  IpRemoval = 'IpRemoval',
}

interface CreatorConfirmCompleteActionModalProps {
  agreementId: string;
  isOpen: boolean;
  confirmationType: CreatorConfirmationType;
  closeModal: () => void;
  submitComplete: () => void;
}

const CreatorConfirmCompleteActionModal: FunctionComponent<
  CreatorConfirmCompleteActionModalProps
> = ({ agreementId, isOpen, confirmationType, closeModal, submitComplete }) => {
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();
  const isChangeRequest = confirmationType === CreatorConfirmationType.ChangeRequest;

  const handleConfirm = useCallback(() => {
    submitComplete();
  }, [submitComplete]);

  const handleCancel = useCallback(() => {
    if (isChangeRequest) {
      logEvent(
        LicenseManagerClickEvent.CreatorAgreementDetailsPageCloseCompleteChangeRequestModalClickEvent,
        {
          agreementId,
        },
      );
    }

    closeModal();
  }, [agreementId, closeModal, isChangeRequest, logEvent]);

  return (
    <Dialog fullWidth maxWidth='Medium' open={isOpen}>
      <DialogTitle>
        <Typography variant='h5'>
          {isChangeRequest
            ? translate('Heading.CreatorConfirmChangeImplemented')
            : translate('Heading.CreatorConfirmIpRemoved')}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant='body1' color='secondary'>
          {isChangeRequest
            ? translate('Description.CreatorConfirmChangeImplemented')
            : translate('Description.CreatorConfirmIpRemoved')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Grid container flexDirection='row' justifyContent='flex-end' spacing={1.5}>
          <Grid item>
            <Button size='large' variant='contained' color='secondary' onClick={handleCancel}>
              {translate('Action.Cancel')}
            </Button>
          </Grid>
          <Grid item>
            <Button size='large' variant='contained' color='primaryBrand' onClick={handleConfirm}>
              {translate('Action.Confirm')}
            </Button>
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );
};

export default CreatorConfirmCompleteActionModal;
