import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useNavigationConfigs from '../../../hooks/useNavigationConfigs';
import {
  clickRefreshButtonEventModel,
  refreshDialogImpressionEventModel,
} from '../../../event/eventConstants';

type RefreshDialogProps = {
  isOpen: boolean;
  switchedFromUserId: number;
  switchedToUserId?: number;
};

const RefreshDialog: FunctionComponent<RefreshDialogProps> = ({
  isOpen,
  switchedFromUserId,
  switchedToUserId,
}) => {
  const { translate } = useTranslation();
  const { sendEvent } = useNavigationConfigs();
  const [isRefreshButtonDisabled, setIsRefreshButtonDisabled] = useState(false);

  useEffect(() => {
    if (isOpen) {
      sendEvent(
        refreshDialogImpressionEventModel({
          switchedFromUserId,
          switchedToUserId,
        }),
      );
    }
  }, [isOpen, sendEvent, switchedFromUserId, switchedToUserId]);

  const onClickRefresh = useCallback(() => {
    sendEvent(
      clickRefreshButtonEventModel({
        switchedFromUserId,
        switchedToUserId,
      }),
    );
    setIsRefreshButtonDisabled(true);
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }, [sendEvent, switchedFromUserId, switchedToUserId]);

  // Prevent automatic visible focus ring on the button when the dialog opens
  const onOpenAutoFocus = useCallback((e: Event) => {
    e.preventDefault();
  }, []);

  return (
    <Dialog isModal open={isOpen} size='Small' hasCloseAffordance={false}>
      <DialogContent onOpenAutoFocus={onOpenAutoFocus}>
        <DialogTitle className='text-heading-medium padding-x-large padding-top-large margin-none outline-none'>
          {translate('Heading.RefreshNeeded')}
        </DialogTitle>
        <DialogBody className='padding-top-xsmall'>
          {translate('Message.ThisPageWillRefresh')}
        </DialogBody>
        <DialogFooter className='flex'>
          <Button
            variant='Emphasis'
            isDisabled={isRefreshButtonDisabled}
            onClick={isRefreshButtonDisabled ? undefined : onClickRefresh}
            className='fill'
            data-testid='refresh-dialog-button'>
            {translate('Action.Ok')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RefreshDialog;
