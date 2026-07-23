import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { MenuItem, useSnackbar } from '@rbx/ui';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { toastDurationTime } from '@modules/miscellaneous/common';

export type CopyTextActionMenuItemProps = {
  textToCopy?: string;
  itemName: string;
  actionKey: string;
  actionName: string;
};

const CopyTextActionMenuItem: FunctionComponent<
  React.PropsWithChildren<CopyTextActionMenuItemProps>
> = ({ textToCopy, itemName, actionKey, actionName }) => {
  const { translate } = useTranslation();
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const showBottomMsg = useCallback(
    (msg: string) => {
      enqueue({
        message: <span data-testid='success-message'>{msg}</span>,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: closeSnackbar,
      });
    },
    [enqueue, closeSnackbar],
  );
  const copyText = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      void navigator.clipboard.writeText(textToCopy ?? '').then(() => {
        showBottomMsg(translate('Message.CopySuccess', { item: itemName }));
      });
      unifiedLoggerClient.logClickEvent({ eventName: `clickActionMenuItem.${actionKey}` });
    },
    [textToCopy, actionKey, showBottomMsg, translate, itemName],
  );
  return <MenuItem onClick={copyText}>{actionName}</MenuItem>;
};

export default CopyTextActionMenuItem;
