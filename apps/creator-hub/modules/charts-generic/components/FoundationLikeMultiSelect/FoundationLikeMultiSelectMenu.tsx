import React, { ReactNode, useContext } from 'react';
import {
  clsx,
  interactable,
  StateLayer,
  disabledOpacity,
  DropdownContext,
  MENU_RADIUS_CLASS_BY_SIZE,
  SECTION_PADDING_CLASS_BY_SIZE,
  MENU_PADDING_X_CLASS_BY_SIZE,
  MENU_ITEM_PADDING_Y_CLASS_BY_SIZE,
  MENU_ITEM_GAP_X_CLASS_BY_SIZE,
  MENU_ITEM_GAP_Y_CLASS_BY_SIZE,
  MENU_ITEM_RADIUS_CLASS_BY_SIZE,
  CHECK_ICON_SIZE_CLASS_BY_SIZE,
  TEXT_CLASS_BY_SIZE,
} from './FoundationLikeShared';
import type { TDropdownSize } from './FoundationLikeShared';

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export type TMenuProps = {
  children: ReactNode;
  className?: string;
  size?: TDropdownSize;
};

export const Menu = ({ children, className, size: sizeProp }: TMenuProps) => {
  const dropdownContext = useContext(DropdownContext);
  const size = sizeProp ?? dropdownContext?.size ?? 'Medium';

  const menuClassName = clsx(
    'bg-surface-100 stroke-standard stroke-default',
    MENU_RADIUS_CLASS_BY_SIZE[size],
    className,
  );

  return (
    <div
      id={dropdownContext?.contentId}
      role='listbox'
      aria-multiselectable='true'
      tabIndex={-1}
      onKeyDown={dropdownContext?.onContentKeyDown}
      className={clsx(menuClassName, 'outline-none')}
      style={{
        boxShadow: [
          'var(--size-0) var(--size-50) var(--size-100) -0.5px var(--alpha-color-shadow-subtle)',
          'var(--size-0) var(--size-250) var(--size-500) -0.75px var(--alpha-color-shadow-subtle)',
          'var(--size-0) var(--size-400) var(--size-800) -1px var(--alpha-color-shadow-subtle)',
          'var(--size-0) var(--size-1200) var(--size-1400) -1.5px var(--alpha-color-shadow-subtle)',
        ].join(', '),
        width: dropdownContext?.triggerWidth ? `${dropdownContext.triggerWidth}px` : undefined,
      }}>
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// MenuSection
// ---------------------------------------------------------------------------

export type TMenuSectionProps = {
  children: ReactNode;
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

// ---------------------------------------------------------------------------
// MenuSeparator
// ---------------------------------------------------------------------------

export type TMenuSeparatorProps = {
  className?: string;
};

export const MenuSeparator = ({ className }: TMenuSeparatorProps) => (
  <div
    role='separator'
    className={className}
    style={{ borderTop: '1px solid var(--color-stroke-default)' }}
  />
);

// ---------------------------------------------------------------------------
// MenuLabel
// ---------------------------------------------------------------------------

export type TMenuLabelProps = {
  title: string;
  description?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
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

// ---------------------------------------------------------------------------
// MenuItem
// ---------------------------------------------------------------------------

export type TMenuItemProps = {
  value: string;
  leading?: ReactNode;
  disabled?: boolean;
  title: string;
  description?: string;
  trailing?: ReactNode;
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
  const isSelected = dropdownContext?.selectedValues?.includes(value);

  const itemClassName = clsx(
    interactable,
    'flex items-center content-default text-truncate-split focus-visible:hover:outline-none cursor-pointer stroke-none bg-none text-align-x-left width-full',
    TEXT_CLASS_BY_SIZE[size],
    MENU_PADDING_X_CLASS_BY_SIZE[size],
    MENU_ITEM_PADDING_Y_CLASS_BY_SIZE[size],
    MENU_ITEM_GAP_X_CLASS_BY_SIZE[size],
    MENU_ITEM_RADIUS_CLASS_BY_SIZE[size],
    disabled && disabledOpacity,
    disabled && 'pointer-events-none',
    className,
  );

  const handleClick = disabled
    ? undefined
    : () => {
        dropdownContext?.onItemSelect?.(value);
        onSelect?.();
      };

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
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- keyboard handled by parent listbox onKeyDown
    <div
      role='option'
      aria-selected={isSelected}
      aria-disabled={disabled}
      data-value={value}
      data-label={title}
      tabIndex={disabled ? -1 : 0}
      className={itemClassName}
      style={{ outlineOffset: 0 }}
      onClick={handleClick}>
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
