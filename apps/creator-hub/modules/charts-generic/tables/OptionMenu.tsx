import React, { useState, useCallback, useRef, useMemo } from 'react';
import { IconButton, Menu, MenuItem, MoreVertIcon, Typography } from '@rbx/ui';
import { Link } from '@modules/miscellaneous/common';
import { ActionCellAction } from './types/GenericTableType';

type OptionMenuProps<TActionType extends string, TActionOn = string> = {
  options: ActionCellAction<TActionType, TActionOn>[];
  selectedOptions?: ActionCellAction<TActionType, TActionOn>[];
  onSelected: (given: ActionCellAction<TActionType, TActionOn>) => void;
};

const OptionMenu = <TActionType extends string, TActionOn>({
  options,
  selectedOptions,
  onSelected,
}: OptionMenuProps<TActionType, TActionOn>) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const buttonClick = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);
  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  const valueToOptions = useMemo(() => {
    return options.reduce((acc, option) => {
      acc.set(option.actionType, option);
      return acc;
    }, new Map<TActionType, ActionCellAction<TActionType, TActionOn>>());
  }, [options]);

  const onOptionSelect = useCallback(
    (e: React.MouseEvent<HTMLLIElement>) => {
      const value = e.currentTarget.getAttribute('value');
      const option = value !== null ? valueToOptions.get(value as TActionType) : null;
      if (option != null) onSelected(option);
      closeMenu();
    },
    [closeMenu, onSelected, valueToOptions],
  );

  return (
    <React.Fragment>
      <IconButton
        onClick={buttonClick}
        data-testid='option-menu-icon-button'
        aria-label='more'
        ref={buttonRef}
        disableRipple
        size='small'
        color='secondary'>
        <MoreVertIcon />
      </IconButton>
      <Menu
        open={open}
        anchorEl={buttonRef.current}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}>
        {options.map(({ actionType: value, color, displayLabel, disabled, href }) => {
          const menuItem = (
            <MenuItem
              key={value}
              selected={
                selectedOptions?.find((selected) => selected.actionType === value) !== undefined
              }
              value={value}
              onClick={href ? undefined : onOptionSelect}
              disabled={disabled}
              disableRipple>
              <Typography color={color}>{displayLabel}</Typography>
            </MenuItem>
          );

          return href && !disabled ? (
            <Link key={value} href={href} underline='none' onClick={closeMenu}>
              {menuItem}
            </Link>
          ) : (
            menuItem
          );
        })}
      </Menu>
    </React.Fragment>
  );
};

export default OptionMenu;
