// Adapted from creator-hub: https://github.rbx.com/Roblox/creator-hub/blob/master/apps/creator-hub/modules/charts-generic/components/FilterDrawer/FilterDrawerButton.tsx

import { Button, FilterListIcon } from '@rbx/ui';
import { ReactNode, useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { EventName, unifiedLogger } from '@clients/unifiedLogger';

import FilterDrawer from './FilterDrawer';
import useFilterDrawerButtonStyles from './FilterDrawerButton.styles';

interface FilterDrawerButtonProps {
  buttonLabel: string;
  disabled: boolean;
  drawerTitle: string;
  filterDrawerContent: ReactNode;
  getDrawerContainer: () => HTMLElement | null;
}

function FilterDrawerButton({
  buttonLabel,
  disabled,
  drawerTitle,
  filterDrawerContent,
  getDrawerContainer,
}: FilterDrawerButtonProps) {
  const {
    classes: { buttonRoot },
  } = useFilterDrawerButtonStyles();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const toggleDrawer = useCallback(() => {
    setOpen((wasOpen) => {
      if (!wasOpen) {
        unifiedLogger.logClickEvent({
          eventName: EventName.FilterDrawerOpened,
        });
      }
      return !wasOpen;
    });
  }, []);
  const closeDrawer = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  return (
    <>
      <Button
        classes={{
          root: buttonRoot,
        }}
        color='inherit'
        disabled={disabled}
        endIcon={<FilterListIcon />}
        onClick={toggleDrawer}
        ref={buttonRef}
        size='medium'
        variant='outlined'>
        {buttonLabel}
      </Button>
      {createPortal(
        <FilterDrawer onClose={closeDrawer} open={open} title={drawerTitle}>
          {filterDrawerContent}
        </FilterDrawer>,
        getDrawerContainer() ?? document.body,
      )}
    </>
  );
}

export default FilterDrawerButton;
