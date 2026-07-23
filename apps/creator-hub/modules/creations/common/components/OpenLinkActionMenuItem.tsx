import type { FunctionComponent } from 'react';
import React from 'react';
import { LaunchIcon, ListItemIcon, MenuItem } from '@rbx/ui';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';

export type OpenLinkActionMenuItemProps = {
  url?: string;
  actionKey: string;
  actionName: string;
};

const OpenLinkActionMenuItem: FunctionComponent<
  React.PropsWithChildren<OpenLinkActionMenuItemProps>
> = ({ url, actionKey, actionName }) => {
  return (
    <MenuItem
      onClick={() => {
        unifiedLoggerClient.logClickEvent({ eventName: `clickActionMenuItem.${actionKey}` });
        window.open(url ?? '', '_blank')?.focus();
      }}>
      <ListItemIcon>
        <LaunchIcon />
      </ListItemIcon>
      {actionName}
    </MenuItem>
  );
};

export default OpenLinkActionMenuItem;
