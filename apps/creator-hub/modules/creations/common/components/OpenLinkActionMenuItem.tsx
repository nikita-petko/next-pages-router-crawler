import React, { FunctionComponent } from 'react';
import { LaunchIcon, ListItemIcon, MenuItem } from '@rbx/ui';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';

export type OpenLinkActionMenuItemProps = {
  url?: string;
  actionKey: string;
  actionName: string;
};

// TODO(yanzhuang, CRF-4038): add tests for action menu item
const OpenLinkActionMenuItem: FunctionComponent<
  React.PropsWithChildren<OpenLinkActionMenuItemProps>
> = ({ url, actionKey, actionName }) => {
  return (
    <MenuItem
      onClick={() => {
        unifiedLoggerClient.logClickEvent({ eventName: `clickActionMenuItem.${actionKey}` });
        window.open(url || '', '_blank')?.focus();
      }}>
      <ListItemIcon>
        <LaunchIcon />
      </ListItemIcon>
      {actionName}
    </MenuItem>
  );
};

export default OpenLinkActionMenuItem;
