import React, { useCallback, useRef } from 'react';
import { Button, FilterListIcon } from '@rbx/ui';
import { createPortal } from 'react-dom';
import { FormattedText } from '@modules/analytics-translations';
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
    <React.Fragment>
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
    </React.Fragment>
  );
}

export default FilterDrawerButton;
