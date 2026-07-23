import React, { useCallback, forwardRef, ForwardRefRenderFunction } from 'react';
import { MenuItem } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useBottomMessage from '../useBottomMessage';

export type TCopyBaseMenuItemProps = {
  onCloseMenu: () => void;
  textToCopy: string;
  itemName: string;
  actionKey: string;
  actionName: string;
};

const CopyBaseMenuItem: ForwardRefRenderFunction<HTMLLIElement, TCopyBaseMenuItemProps> = (
  { onCloseMenu, textToCopy, itemName, actionKey, actionName },
  ref,
) => {
  const { translate } = useTranslation();
  const { showBottomMsg } = useBottomMessage();
  const copyText = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      navigator.clipboard.writeText(textToCopy ?? '').then(() => {
        showBottomMsg(translate('Message.CopySuccess', { item: itemName }));
      });
      onCloseMenu();
    },
    [textToCopy, onCloseMenu, showBottomMsg, translate, itemName],
  );
  return (
    <MenuItem key={`action.${actionKey}`} onClick={copyText} ref={ref}>
      {actionName}
    </MenuItem>
  );
};

export default forwardRef(CopyBaseMenuItem);
