import React, { useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button, IconButton } from '@rbx/foundation-ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import FilterDrawer from '@modules/charts-generic/components/FilterDrawer/FilterDrawer';

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
      ref={buttonRef}
      icon='icon-regular-three-bars-horizontal-narrowing'
      variant='Utility'
      size='Small'
      ariaLabel={buttonLabel}
      isDisabled={!canFilter}
      onClick={toggleDrawer}
    />
  ) : (
    <Button
      ref={buttonRef}
      icon='icon-regular-three-bars-horizontal-narrowing'
      variant='Standard'
      size='Large'
      isDisabled={!canFilter}
      onClick={toggleDrawer}>
      {buttonLabel}
    </Button>
  );
  return (
    <>
      {button}
      {createPortal(
        <FilterDrawer title={drawerTitle} open={open} onClose={closeDrawer}>
          {filterDrawerContent}
        </FilterDrawer>,
        getDrawerContainer() ?? document.body,
      )}
    </>
  );
}

export default SearchFilterButton;
