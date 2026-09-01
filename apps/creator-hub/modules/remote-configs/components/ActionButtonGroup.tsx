import type { FC } from 'react';
import React, { useState, useCallback, useRef, useLayoutEffect } from 'react';
import { ArrowDownwardIcon, Button, ButtonGroup, makeStyles, Menu, MenuItem } from '@rbx/ui';
import type { Action } from './ActionButton';

const anchorOrigin = {
  vertical: 'bottom',
  horizontal: 'left',
} as const;

const transformOrigin = {
  vertical: 'top',
  horizontal: 'left',
} as const;

const useStyles = makeStyles()((theme) => ({
  menu: {
    marginTop: '8px',
  },
  arrowDownButton: {
    borderLeft: `1px solid ${theme.palette.content.inverse}`,
  },
}));

type ActionInGroup = Omit<Action, 'variant'>;
export type ActionsInGroup = [ActionInGroup, ActionInGroup, ...ActionInGroup[]];

type ActionButtonGroupProps = {
  actions: ActionsInGroup;
  variant?: 'outlined' | 'contained';
};

const ActionButtonGroup: FC<ActionButtonGroupProps> = ({ actions, variant }) => {
  const {
    classes: { menu, arrowDownButton },
  } = useStyles();
  const [open, setOpen] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);
  const anchorRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setOpen(false), []);
  const toggleMenu = useCallback(() => setOpen((prev) => !prev), []);

  const onSelectMenuItem = useCallback(
    (event: React.MouseEvent<HTMLLIElement>) => {
      setSelectedOptionIndex(event.currentTarget.value);
      closeMenu();
    },
    [closeMenu],
  );

  const selectedAction = actions[selectedOptionIndex];

  const [menuListProps, setMenuListProps] = useState<{ sx: { minWidth: number } } | undefined>();
  useLayoutEffect(() => {
    if (anchorRef.current) {
      setMenuListProps({
        sx: { minWidth: anchorRef.current.offsetWidth },
      });
    }
  }, [selectedAction.buttonLabel]);

  return (
    <>
      <ButtonGroup ref={anchorRef}>
        <Button
          variant={variant}
          color='secondary'
          onClick={selectedAction.onAction}
          disabled={selectedAction.isDisabled}
          data-testid={selectedAction.dataTestId}>
          {selectedAction.buttonLabel}
        </Button>
        <Button
          data-testid='dropdown-button'
          variant={variant}
          color='secondary'
          onClick={toggleMenu}
          classes={{ root: arrowDownButton }}
          disabled={actions.every((action) => action.isDisabled)}>
          <ArrowDownwardIcon fontSize='small' data-testid='arrow-down' />
        </Button>
      </ButtonGroup>
      <Menu
        open={open}
        onClose={closeMenu}
        anchorEl={anchorRef.current}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
        MenuListProps={menuListProps}
        classes={{ root: menu }}
        data-testid='menu'>
        {actions.map(({ optionLabel, isDisabled }, idx) => (
          <MenuItem
            data-testid='menu-item'
            key={optionLabel}
            value={idx}
            onClick={onSelectMenuItem}
            disabled={isDisabled}>
            {optionLabel}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ActionButtonGroup;
