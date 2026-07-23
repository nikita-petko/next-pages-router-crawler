import React, { useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button, FilterListIcon } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import FilterDrawer from './FilterDrawer';
import useFilterDrawerButtonStyles from './FilterDrawerButton.styles';

interface FilterDrawerButtonProps {
  buttonLabel: FormattedText;
  drawerTitle: FormattedText;
  filterDrawerContent: React.ReactNode;
  getDrawerContainer: () => HTMLElement | null;
}

function FilterDrawerButton({
  getDrawerContainer,
  buttonLabel,
  drawerTitle,
  filterDrawerContent,
}: FilterDrawerButtonProps) {
  const {
    classes: { buttonRoot },
  } = useFilterDrawerButtonStyles();
  const [open, setOpen] = React.useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const toggleDrawer = useCallback(() => {
    setOpen((wasOpen) => !wasOpen);
  }, []);
  const closeDrawer = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  return (
    <>
      <Button
        ref={buttonRef}
        onClick={toggleDrawer}
        endIcon={<FilterListIcon />}
        variant='outlined'
        color='inherit'
        classes={{
          root: buttonRoot,
        }}>
        {buttonLabel}
      </Button>
      {createPortal(
        <FilterDrawer title={drawerTitle} open={open} onClose={closeDrawer}>
          {filterDrawerContent}
        </FilterDrawer>,
        getDrawerContainer() ?? document.body,
      )}
    </>
  );
}

export default FilterDrawerButton;
