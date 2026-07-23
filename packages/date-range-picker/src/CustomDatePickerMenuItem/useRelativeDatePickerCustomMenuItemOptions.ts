import React, { useCallback, useMemo, useRef, useState } from 'react';

const useRelativeDatePickerCustomMenuItemOptions = () => {
  const [isSelectDropdownOpen, setSelectDropdownOpen] = useState(false);
  const customDateItemRef = useRef<HTMLLIElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => {
    setSelectDropdownOpen(false);
  }, []);
  const [datePickerPopoverOpen, setDatePickerPopoverOpen] = useState(false);

  const menuItemOnKeyUp = useCallback(
    (e: React.KeyboardEvent) => {
      // Temporary a11y solution for keyboard navigation. A proper solution
      // needs a page-wide focus manager - do not use this as a guide.
      const dateMenuItemElement = customDateItemRef.current;
      if (e.key === 'Escape') {
        if (dateMenuItemElement === e.target) {
          closeMenu();
        } else if (e.target instanceof Node && dateMenuItemElement?.contains(e.target)) {
          dateMenuItemElement.focus();
        }
      } else if (e.key === 'Enter') {
        const inputElements = dateMenuItemElement?.querySelectorAll('input');
        if (!inputElements?.length) {
          return;
        }

        if (dateMenuItemElement === e.target) {
          inputElements.item(0).focus();
        } else {
          const foundIndex = Array.from(inputElements.values()).findIndex((el) => e.target === el);
          if (foundIndex === inputElements.length - 1) {
            confirmButtonRef.current?.focus();
          } else {
            inputElements.item(foundIndex + 1).focus();
          }
        }
      }
    },
    [closeMenu],
  );

  const selectProps = useMemo(
    () => ({
      open: isSelectDropdownOpen,
      onOpen: () => {
        setSelectDropdownOpen(true);
      },
      onClose: (e: React.SyntheticEvent) => {
        if (datePickerPopoverOpen) {
          return;
        }
        if (!(e.target instanceof Node) || !customDateItemRef.current?.contains(e.target)) {
          closeMenu();
        }
      },
    }),
    [closeMenu, datePickerPopoverOpen, isSelectDropdownOpen],
  );

  return {
    setDatePickerPopoverOpen,
    closeMenu,
    confirmButtonRef,
    customDateItemRef,
    selectProps,
    menuItemOnKeyUp,
  };
};

export default useRelativeDatePickerCustomMenuItemOptions;
