import React, {
  Fragment,
  FunctionComponent,
  ReactNode,
  useCallback,
  useRef,
  useState,
} from 'react';
import { Menu, IconButton, MoreVertIcon, TIconButtonProps } from '@rbx/ui';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';

export interface StatusCardContextMenuProps {
  menuItems: Array<ReactNode>;
  size?: TIconButtonProps['size'];
}

const StatusCardContextMenu: FunctionComponent<
  React.PropsWithChildren<StatusCardContextMenuProps>
> = ({ menuItems, size }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const handleClose = useCallback(() => {
    setIsMenuOpen(false);
  }, []);
  const handleClick = useCallback(() => {
    unifiedLoggerClient.logClickEvent({ eventName: 'clickStatusCardMoreButton' });
    setIsMenuOpen(true);
  }, []);

  return (
    <Fragment>
      <IconButton
        aria-label='more'
        color='secondary'
        ref={buttonRef}
        onClick={handleClick}
        size={size}>
        <MoreVertIcon fontSize={size} />
      </IconButton>
      <Menu
        open={isMenuOpen}
        anchorEl={buttonRef.current}
        onClose={handleClose}
        onClick={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
        {menuItems}
      </Menu>
    </Fragment>
  );
};

export default StatusCardContextMenu;
