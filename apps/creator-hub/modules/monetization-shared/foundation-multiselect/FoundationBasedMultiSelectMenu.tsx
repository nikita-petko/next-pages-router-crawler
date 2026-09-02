// oxlint-disable jsx-a11y/prefer-tag-over-role -- intended for dropdown
import { Children, isValidElement, useCallback, useContext, useEffect } from 'react';
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
  CHECK_ICON_SIZE_CLASS_BY_SIZE,
  TEXT_CLASS_BY_SIZE,
} from '../lib/foundation-base-shared';
import type { TDropdownSize } from '../lib/foundation-base-shared';

const MENU_ITEM_DISPLAY_NAME = 'FoundationBasedMultiSelect.MenuItem';
const MENU_LABEL_DISPLAY_NAME = 'FoundationBasedMultiSelect.MenuLabel';
const MENU_SECTION_DISPLAY_NAME = 'FoundationBasedMultiSelect.MenuSection';
const MENU_DISPLAY_NAME = 'FoundationBasedMultiSelect.Menu';

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

function countOptionRows(children: React.ReactNode): number {
  let count = 0;
  Children.forEach(children, (child) => {
    if (!isValidElement<TMenuSectionProps>(child)) {
      return;
    }

    if (isMenuItemElement(child)) {
      count += 1;
      return;
    }

    if (child.props.children) {
      count += countOptionRows(child.props.children);
    }
  });
  return count;
}

export const Menu = ({ children, className, size: sizeProp }: TMenuProps) => {
  const dropdownContext = useContext(DropdownContext);
  const size = sizeProp ?? dropdownContext?.size ?? 'Medium';
  const optionRowCount = countOptionRows(children);
  const menuChildren = !dropdownContext || optionRowCount > 0 ? children : null;

  return (
    <div
      id={dropdownContext?.contentId}
      role='listbox'
      aria-multiselectable='true'
      aria-activedescendant={dropdownContext?.activeOptionId}
      tabIndex={-1}
      onKeyDown={dropdownContext?.onContentKeyDown}
      className={clsx(
        'foundation-web-menu bg-surface-100 stroke-standard stroke-default shadow-transient-high',
        MENU_RADIUS_CLASS_BY_SIZE[size],
        className,
        // Intentionally forcing overrides on these
        'outline-none max-width-full [box-sizing:border-box]',
        dropdownContext?.triggerWidth ? 'width-full' : undefined,
      )}
      style={{
        boxShadow: [
          'var(--size-0) var(--size-50) var(--size-100) -0.5px var(--alpha-color-shadow-subtle)',
          'var(--size-0) var(--size-250) var(--size-500) -0.75px var(--alpha-color-shadow-subtle)',
          'var(--size-0) var(--size-400) var(--size-800) -1px var(--alpha-color-shadow-subtle)',
          'var(--size-0) var(--size-1200) var(--size-1400) -1.5px var(--alpha-color-shadow-subtle)',
        ].join(', '),
      }}>
      {menuChildren}
    </div>
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

  const labelClassName = clsx(
    'flex items-center content-default text-truncate-split text-align-x-left width-full',
    TEXT_CLASS_BY_SIZE[size],
    MENU_PADDING_X_CLASS_BY_SIZE[size],
    MENU_ITEM_PADDING_Y_CLASS_BY_SIZE[size],
    MENU_ITEM_GAP_X_CLASS_BY_SIZE[size],
    disabled && disabledOpacity,
    className,
  );

  return (
    <div role='none' className={labelClassName}>
      {leading}
      <div
        className={clsx(
          'grow-1 text-truncate-split flex flex-col',
          MENU_ITEM_GAP_Y_CLASS_BY_SIZE[size],
        )}>
        <span className='text-no-wrap text-truncate-split content-emphasis'>{title}</span>
        {description && <div className='content-muted'>{description}</div>}
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
  onSelect?: () => void;
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
  const size = dropdownContext?.size ?? 'Medium';
  const onItemSelect = dropdownContext?.onItemSelect;
  const registerOption = dropdownContext?.registerOption;
  const setActiveOptionId = dropdownContext?.setActiveOptionId;
  const isSelected = dropdownContext?.selectedValues?.includes(value);
  const optionId = useId(':multiselect-option');
  const isActive = dropdownContext?.activeOptionId === optionId;

  const handleSelect = useCallback(() => {
    onItemSelect?.(value);
    onSelect?.();
  }, [onItemSelect, onSelect, value]);

  useEffect(() => {
    if (!registerOption) {
      return undefined;
    }

    return registerOption({
      id: optionId,
      value,
      label: title,
      disabled,
      onSelect: disabled ? undefined : handleSelect,
    });
  }, [disabled, handleSelect, optionId, registerOption, title, value]);

  const itemClassName = clsx(
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
  );

  const checkIcon = isSelected && (
    <span
      role='presentation'
      className={clsx(
        'grow-0 shrink-0 basis-auto icon icon-filled-check',
        CHECK_ICON_SIZE_CLASS_BY_SIZE[size],
      )}
    />
  );

  return (
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events -- keyboard handled by parent listbox onKeyDown
    <div
      id={optionId}
      role='option'
      aria-selected={isSelected}
      aria-disabled={disabled}
      data-active={isActive ? 'true' : undefined}
      data-value={value}
      data-label={title}
      tabIndex={-1}
      className={itemClassName}
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
        <span className='text-no-wrap text-truncate-split content-emphasis'>{title}</span>
        {description && <div className='content-muted'>{description}</div>}
      </div>
      {trailing}
      {checkIcon}
    </div>
  );
};
MenuItem.displayName = MENU_ITEM_DISPLAY_NAME;
