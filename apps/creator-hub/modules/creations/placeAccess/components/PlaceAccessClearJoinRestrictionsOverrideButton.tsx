import React, { FunctionComponent, useCallback, useMemo, useState, type JSX } from 'react';
import { Button, DialogTemplate, useDialog, useSnackbar } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { toastDurationTime } from '@modules/miscellaneous/common';
import { universesClient } from '@modules/clients';

export interface PlaceAccessClearJoinRestrictionsOverrideButtonProps {
  placeId: number;
  handleClear: () => void;
}

const PlaceAccessClearJoinRestrictionsOverrideButton: FunctionComponent<
  React.PropsWithChildren<PlaceAccessClearJoinRestrictionsOverrideButtonProps>
> = ({ placeId, handleClear }) => {
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const { open, close: closeDialog, configure } = useDialog();
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const { translate } = useTranslation();

  const showSnackbar = useCallback(
    (msg: JSX.Element) => {
      enqueue({
        message: msg,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: closeSnackbar,
      });
    },
    [enqueue, closeSnackbar],
  );

  const handleClearJoinRestrictionsOverride = useCallback(async () => {
    setIsClearing(true);
    try {
      await universesClient.updatePlaceJoinRestrictions({
        placeId,
        placesUpdatePlaceJoinRestrictionsRequest: {},
      });
      showSnackbar(
        <span data-testid='success-message'>
          {translate('Message.ClearJoinRestrictionsOverrideSuccess')}
        </span>,
      );
      handleClear();
    } catch {
      showSnackbar(
        <span data-testid='error-message'>
          {translate('Message.ClearJoinRestrictionsOverrideError')}
        </span>,
      );
    } finally {
      setIsClearing(false);
      closeDialog();
    }
  }, [placeId, showSnackbar, translate, closeDialog, handleClear]);

  const confirmClearJoinRestrictionsOverride = useMemo(
    () => (
      <DialogTemplate
        color='destructive'
        onConfirm={handleClearJoinRestrictionsOverride}
        onCancel={closeDialog}
        title={translate('Title.ClearJoinRestrictionOverride')}
        content={translate('Description.ClearJoinRestrictionsOverrideDialog')}
        confirmText={translate('Action.ConfirmReset')}
        cancelText={translate('Action.Cancel')}
        loading={isClearing}
      />
    ),
    [isClearing, handleClearJoinRestrictionsOverride, closeDialog, translate],
  );

  const handleOpenDialog = useCallback(() => {
    configure(confirmClearJoinRestrictionsOverride);
    open();
  }, [configure, confirmClearJoinRestrictionsOverride, open]);

  return (
    <Button size='small' onClick={handleOpenDialog}>
      {translate('Action.Reset')}
    </Button>
  );
};

export default PlaceAccessClearJoinRestrictionsOverrideButton;
