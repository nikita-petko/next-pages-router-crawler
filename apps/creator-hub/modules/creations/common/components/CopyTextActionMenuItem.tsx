import React, { useCallback, FunctionComponent } from 'react';
import { MenuItem, useSnackbar } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { toastDurationTime } from '@modules/miscellaneous/common';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';

export type CopyTextActionMenuItemProps = {
  textToCopy?: string;
  itemName: string;
  actionKey: string;
  actionName: string;
};

// TODO(yanzhuang, CRF-4038): add tests for action menu item
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
      navigator.clipboard.writeText(textToCopy ?? '').then(() => {
        showBottomMsg(translate('Message.CopySuccess', { item: itemName }));
      });
      unifiedLoggerClient.logClickEvent({ eventName: `clickActionMenuItem.${actionKey}` });
    },
    [textToCopy, actionKey, showBottomMsg, translate, itemName],
  );
  return <MenuItem onClick={copyText}>{actionName}</MenuItem>;
};

export default CopyTextActionMenuItem;
