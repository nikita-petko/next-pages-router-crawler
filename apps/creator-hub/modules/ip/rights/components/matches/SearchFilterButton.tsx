import React, { useCallback, useRef } from 'react';
import { Button, FilterListIcon, IconButton, TTheme, makeStyles } from '@rbx/ui';
import { createPortal } from 'react-dom';
import { FilterDrawer } from '@modules/charts-generic';
import { FormattedText } from '@modules/analytics-translations';

const useFilterDrawerButtonStyles = makeStyles()((theme: TTheme) => {
  return {
    buttonRoot: {
      fontWeight: theme.typography.body1.fontWeight,
      borderColor: theme.palette.surface.outline,
    },
  };
});

interface SearchFilterButtonProps {
  isMobile: boolean;
  buttonLabel: FormattedText;
  drawerTitle: FormattedText;
  filterDrawerContent: React.ReactNode;
  getDrawerContainer: () => HTMLElement | null;
  canFilter: boolean;
}

function SearchFilterButton({
  isMobile,
  getDrawerContainer,
  buttonLabel,
  drawerTitle,
  filterDrawerContent,
  canFilter,
}: SearchFilterButtonProps) {
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

  const button = isMobile ? (
    <IconButton
      color='inherit'
      onClick={toggleDrawer}
      classes={{
        root: buttonRoot,
      }}
      aria-label='filtering'
      disabled={!canFilter}>
      <FilterListIcon />
    </IconButton>
  ) : (
    <Button
      ref={buttonRef}
      onClick={toggleDrawer}
      endIcon={<FilterListIcon />}
      variant='outlined'
      color='inherit'
      classes={{
        root: buttonRoot,
      }}
      disabled={!canFilter}>
      {buttonLabel}
    </Button>
  );
  return (
    <React.Fragment>
      {button}
      {createPortal(
        <FilterDrawer title={drawerTitle} open={open} onClose={closeDrawer}>
          {filterDrawerContent}
        </FilterDrawer>,
        getDrawerContainer() ?? document.body,
      )}
    </React.Fragment>
  );
}

export default SearchFilterButton;
