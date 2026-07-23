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
      // note: a temporary solution for keyboard navigation.
      // a11y should be solved at a higher level that takes
      // the entire app under consideration. the implementation
      // here should NOT viewed as a guide
      const dateMenuItemElement = customDateItemRef.current;
      if (e.key === 'Escape') {
        if (dateMenuItemElement === e.target) {
          closeMenu();
        } else if (e.target && dateMenuItemElement?.contains(e.target as Node)) {
          dateMenuItemElement?.focus();
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

  return useMemo(() => {
    const selectProps = {
      open: isSelectDropdownOpen,
      onOpen: () => {
        setSelectDropdownOpen(true);
      },
      onClose: (e: React.SyntheticEvent) => {
        if (datePickerPopoverOpen) {
          return;
        }

        if (!e.target || !customDateItemRef.current?.contains(e.target as Node)) {
          closeMenu();
        }
      },
    };
    return {
      setDatePickerPopoverOpen,
      closeMenu,
      confirmButtonRef,
      customDateItemRef,
      selectProps,
      menuItemOnKeyUp,
    };
  }, [closeMenu, datePickerPopoverOpen, isSelectDropdownOpen, menuItemOnKeyUp]);
};

export default useRelativeDatePickerCustomMenuItemOptions;
