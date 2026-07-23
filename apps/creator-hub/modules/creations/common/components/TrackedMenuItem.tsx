import React from 'react';
import { MenuItem, TMenuItemProps } from '@rbx/ui';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';

type TrackingProps = {
  itemKey: string;
} & TMenuItemProps;

type OnClickCallback = React.MouseEventHandler<HTMLLIElement> | undefined;

const TrackedMenuItem = React.forwardRef((props: TrackingProps, ref) => {
  const { onClick, itemKey, ...propsToPass } = props;
  const handleClick = React.useCallback(
    (cb: OnClickCallback) => {
      return (e: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
        unifiedLoggerClient.logClickEvent({ eventName: `clickContextMenuItem.${itemKey}` });
        cb?.(e);
      };
    },
    [itemKey],
  );

  return <MenuItem {...propsToPass} ref={ref} onClick={handleClick(onClick)} />;
});

TrackedMenuItem.displayName = 'TrackedMenuItem';

export default TrackedMenuItem;
