import type { FC } from 'react';
import React, { useCallback, useState } from 'react';
import { Menu, MenuItem, IconButton, MoreHorizIcon, MoreVertIcon } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';

export type ActionItem = {
  text: FormattedText;
  onClick: () => void;
};

type GenericActionMenuProps = {
  actions: ActionItem[];
  useVerticalIcon?: boolean;
  onClose?: () => void;
};

const GenericActionMenu: FC<GenericActionMenuProps> = ({ actions, onClose, useVerticalIcon }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      // NOTE(lucaswang, 2025-04-22): Stop propagation in cases when menu is contained within a interactive element.
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
    },
    [setAnchorEl],
  );

  const handleClose = useCallback(
    (event: React.MouseEvent) => {
      // NOTE(lucaswang, 2025-04-22): Stop propagation in cases when menu is contained within a interactive element.
      event.stopPropagation();
      setAnchorEl(null);
      onClose?.();
    },
    [setAnchorEl, onClose],
  );

  const handleActionClick = useCallback(
    (onClick: () => void) => (event: React.MouseEvent) => {
      onClick();
      handleClose(event);
    },
    [handleClose],
  );

  if (!actions.length) {
    return null;
  }

  return (
    <>
      <IconButton
        id='generic-action-menu-button'
        color='secondary'
        sx={{
          borderRadius: 3,
        }}
        aria-label='action'
        aria-controls={open ? 'generic-action-menu' : undefined}
        aria-haspopup='true'
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        size='small'>
        {useVerticalIcon ? <MoreVertIcon /> : <MoreHorizIcon />}
      </IconButton>
      <Menu
        id='generic-action-menu'
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'generic-action-menu-button',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}>
        {actions.map((action) => (
          <MenuItem key={action.text} onClick={handleActionClick(action.onClick)}>
            {action.text}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default GenericActionMenu;
