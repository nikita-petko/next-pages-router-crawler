import type { FunctionComponent } from 'react';
import React, { Fragment } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, DialogActions, DialogContent, DialogTitle, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export type ExpiredTransferAcknowledgementDialogProps = {
  targetGameName?: string;
  targetGroupName?: string;
  onClose: () => void;
};

const ExpiredTransferAcknowledgementDialog: FunctionComponent<
  React.PropsWithChildren<ExpiredTransferAcknowledgementDialogProps>
> = ({ targetGameName, targetGroupName, onClose }) => {
  const { translate, translateHTML } = useTranslation();

  return (
    <>
      <DialogTitle>{translate('Heading.RequestExpired')}</DialogTitle>
      <DialogContent dividers>
        <Typography variant='body1' color='secondary'>
          {translateHTML('Description.RequestExpired', [], {
            gameName: <b>{targetGameName}</b>,
            groupName: <b>{targetGroupName}</b>,
          })}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          variant='contained'
          size='medium'
          color='secondary'
          style={{ marginRight: 8 }}
          onClick={onClose}>
          {translate('Action.Close')}
        </Button>
      </DialogActions>
    </>
  );
};

export default withTranslation(ExpiredTransferAcknowledgementDialog, [
  TranslationNamespace.OwnershipTransfer,
  TranslationNamespace.Payouts,
]);
