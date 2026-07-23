// oxlint-disable jsx-a11y/prefer-tag-over-role -- intended for combobox popup menus
import { Children, isValidElement, useCallback, useContext, useEffect, useMemo } from 'react';
import { clsx, MenuSeparator as FoundationMenuSeparator } from '@rbx/foundation-ui';
import type { TMenuSeparatorProps as TFoundationMenuSeparatorProps } from '@rbx/foundation-ui';
import {
  interactable,
  StateLayer,
  disabledOpacity,
  DropdownContext,
  useId,
  MENU_RADIUS_CLASS_BY_SIZE,
  SECTION_PADDING_CLASS_BY_SIZE,
  MENU_PADDING_X_CLASS_BY_SIZE,
  MENU_ITEM_PADDING_Y_CLASS_BY_SIZE,
  MENU_ITEM_GAP_X_CLASS_BY_SIZE,
  MENU_ITEM_GAP_Y_CLASS_BY_SIZE,
  MENU_ITEM_RADIUS_CLASS_BY_SIZE,
  TEXT_CLASS_BY_SIZE,
} from '../lib/foundation-base-shared';
import type { TDropdownSize } from '../lib/foundation-base-shared';
import { ComboboxContext } from './FoundationBasedComboboxContext';
import type {
  TComboboxContext,
  TComboboxMenuChildProps,
  TComboboxOptionData,
} from './FoundationBasedComboboxContext';

const MENU_ITEM_DISPLAY_NAME = 'FoundationBasedCombobox.MenuItem';
const MENU_LABEL_DISPLAY_NAME = 'FoundationBasedCombobox.MenuLabel';
const MENU_SECTION_DISPLAY_NAME = 'FoundationBasedCombobox.MenuSection';
const MENU_DISPLAY_NAME = 'FoundationBasedCombobox.Menu';

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export type TMenuProps = {
  children: React.ReactNode;
  className?: string;
  size?: TDropdownSize;
};

function isMenuItemElement(child: React.ReactNode): child is React.ReactElement<TMenuItemProps> {
  return (
    isValidElement(child) &&
    typeof child.type !== 'string' &&
    'displayName' in child.type &&
    child.type.displayName === MENU_ITEM_DISPLAY_NAME
  );
}

function countVisibleOptions(
  children: React.ReactNode,
  inputValue: string,
  comboboxContext: TComboboxContext | null,
  includeDisabled = false,
): number {
  let count = 0;
  Children.forEach(children, (child) => {
    if (!isValidElement<TComboboxMenuChildProps>(child)) {
      return;
    }

    if (isMenuItemElement(child)) {
      const option: TComboboxOptionData = {
        value: child.props.value,
        title: child.props.title,
        disabled: child.props.disabled,
      };
      if (
        (includeDisabled || !child.props.disabled) &&
        (comboboxContext?.filterOption(inputValue, option) ?? true)
      ) {
        count += 1;
      }
      return;
    }

    if (child.props.children) {
      count += countVisibleOptions(
        child.props.children,
        inputValue,
        comboboxContext,
        includeDisabled,
      );
    }
  });
  return count;
}

export const Menu = ({ children, className, size: sizeProp }: TMenuProps) => {
  const dropdownContext = useContext(DropdownContext);
  const comboboxContext = useContext(ComboboxContext);
  const size = sizeProp ?? dropdownContext?.size ?? 'Medium';
  const inputValue = comboboxContext?.inputValue ?? '';
  const visibleOptionCount = countVisibleOptions(children, inputValue, comboboxContext);
  const renderedOptionCount = countVisibleOptions(children, inputValue, comboboxContext, true);
  const contextValue = useMemo(
    () => (comboboxContext ? { ...comboboxContext, visibleOptionCount } : null),
    [comboboxContext, visibleOptionCount],
  );
  const menuChildren = !comboboxContext || renderedOptionCount > 0 ? children : null;

  return (
    <ComboboxContext.Provider value={contextValue}>
      <div
        id={dropdownContext?.contentId}
        role='listbox'
        tabIndex={-1}
        onKeyDown={dropdownContext?.onContentKeyDown}
        className={clsx(
          'foundation-web-menu bg-surface-100 stroke-standard stroke-default shadow-transient-high',
          MENU_RADIUS_CLASS_BY_SIZE[size],
          className,
          // Intentionally forcing overrides on these
          'outline-none max-width-full [box-sizing:border-box]',
          dropdownContext?.triggerWidth ? 'width-full' : undefined,
        )}>
        {menuChildren}
      </div>
    </ComboboxContext.Provider>
  );
};
Menu.displayName = MENU_DISPLAY_NAME;

// ---------------------------------------------------------------------------
// MenuSection
// ---------------------------------------------------------------------------

export type TMenuSectionProps = {
  children: React.ReactNode;
  className?: string;
};

export const MenuSection = ({ children, className }: TMenuSectionProps) => {
  const dropdownContext = useContext(DropdownContext);
  const size = dropdownContext?.size ?? 'Medium';
  return (
    <div role='group' className={clsx(SECTION_PADDING_CLASS_BY_SIZE[size], className)}>
      {children}
    </div>
  );
};
MenuSection.displayName = MENU_SECTION_DISPLAY_NAME;

// ---------------------------------------------------------------------------
// MenuSeparator
// ---------------------------------------------------------------------------

export type TMenuSeparatorProps = TFoundationMenuSeparatorProps;

export const MenuSeparator = FoundationMenuSeparator;

// ---------------------------------------------------------------------------
// MenuLabel
// ---------------------------------------------------------------------------

export type TMenuLabelProps = {
  title: string;
  description?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  disabled?: boolean;
  className?: string;
};

export const MenuLabel = ({
  title,
  description,
  leading,
  trailing,
  disabled,
  className,
}: TMenuLabelProps) => {
  const dropdownContext = useContext(DropdownContext);
  const size = dropdownContext?.size ?? 'Medium';

  return (
    <div
      role='none'
      className={clsx(
        'foundation-web-menu-label flex items-center content-default text-truncate-split text-align-x-left width-full',
        TEXT_CLASS_BY_SIZE[size],
        MENU_PADDING_X_CLASS_BY_SIZE[size],
        MENU_ITEM_PADDING_Y_CLASS_BY_SIZE[size],
        MENU_ITEM_GAP_X_CLASS_BY_SIZE[size],
        disabled && disabledOpacity,
        className,
      )}>
      {leading}
      <div
        className={clsx(
          'grow-1 text-truncate-split flex flex-col',
          MENU_ITEM_GAP_Y_CLASS_BY_SIZE[size],
        )}>
        <span className='foundation-web-menu-label-title text-no-wrap text-truncate-split content-emphasis'>
          {title}
        </span>
        {description && (
          <div className='foundation-web-menu-label-description content-muted'>{description}</div>
        )}
      </div>
      {trailing}
    </div>
  );
};
MenuLabel.displayName = MENU_LABEL_DISPLAY_NAME;

// ---------------------------------------------------------------------------
// MenuItem
// ---------------------------------------------------------------------------

export type TMenuItemProps = {
  value: string;
  leading?: React.ReactNode;
  disabled?: boolean;
  title: string;
  description?: string;
  trailing?: React.ReactNode;
  className?: string;
  onSelect?: (value: string, title: string) => void;
};

export const MenuItem = ({
  value,
  leading,
  title,
  description,
  trailing,
  disabled,
  className,
  onSelect,
}: TMenuItemProps) => {
  const dropdownContext = useContext(DropdownContext);
  const comboboxContext = useContext(ComboboxContext);
  const size = dropdownContext?.size ?? 'Medium';
  const registerOption = comboboxContext?.registerOption;
  const setActiveOptionId = comboboxContext?.setActiveOptionId;
  const onOptionSelect = comboboxContext?.onOptionSelect;
  const isSelected =
    comboboxContext?.selectedValue === value || comboboxContext?.inputValue === title;
  const isVisible =
    comboboxContext?.filterOption(comboboxContext.inputValue, { value, title, disabled }) ?? true;
  const optionId = useId(':combobox-option');
  const isActive = comboboxContext?.activeOptionId === optionId;

  const handleSelect = useCallback(() => {
    if (!disabled) {
      onOptionSelect?.(value, title);
      onSelect?.(value, title);
    }
  }, [disabled, onOptionSelect, onSelect, title, value]);

  useEffect(() => {
    if (!isVisible || !registerOption) {
      return undefined;
    }

    return registerOption({
      id: optionId,
      value,
      label: title,
      disabled,
      onSelect: handleSelect,
    });
  }, [disabled, handleSelect, isVisible, optionId, registerOption, title, value]);

  if (!isVisible) {
    return null;
  }

  return (
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events -- keyboard handled by parent listbox
    <div
      id={optionId}
      role='option'
      aria-selected={isSelected}
      aria-disabled={disabled}
      data-active={isActive ? 'true' : undefined}
      data-value={value}
      data-label={title}
      tabIndex={-1}
      className={clsx(
        interactable,
        'foundation-web-menu-item flex items-center content-default text-truncate-split focus-visible:hover:outline-none cursor-pointer stroke-none bg-none text-align-x-left width-full',
        isActive && 'bg-shift-200',
        TEXT_CLASS_BY_SIZE[size],
        MENU_PADDING_X_CLASS_BY_SIZE[size],
        MENU_ITEM_PADDING_Y_CLASS_BY_SIZE[size],
        MENU_ITEM_GAP_X_CLASS_BY_SIZE[size],
        MENU_ITEM_RADIUS_CLASS_BY_SIZE[size],
        disabled && disabledOpacity,
        disabled && 'pointer-events-none',
        className,
      )}
      style={{ outlineOffset: 0 }}
      onMouseEnter={disabled ? undefined : () => setActiveOptionId?.(optionId)}
      onClick={disabled ? undefined : handleSelect}>
      {!disabled && <StateLayer />}
      {leading}
      <div
        className={clsx(
          'grow-1 text-truncate-split flex flex-col',
          MENU_ITEM_GAP_Y_CLASS_BY_SIZE[size],
        )}>
        <span className='foundation-web-menu-item-title text-no-wrap text-truncate-split content-emphasis'>
          {title}
        </span>
        {description && (
          <div className='foundation-web-menu-item-description content-muted'>{description}</div>
        )}
      </div>
      {trailing}
    </div>
  );
};
MenuItem.displayName = MENU_ITEM_DISPLAY_NAME;

// TODO: If more consumers need a non-option action row, add an explicit
// Combobox.MenuActionItem API instead of baking no-match behavior into combobox.
