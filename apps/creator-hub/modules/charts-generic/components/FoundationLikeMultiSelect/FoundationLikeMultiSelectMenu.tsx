import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react';
// oxlint-disable jsx-a11y/prefer-tag-over-role -- this file implements a custom ARIA listbox/menu; native select/option cannot host the needed layout and interactions.
import { useContext, useRef } from 'react';
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

// Pointer selection can be followed by a synthetic click after the menu rerender.
// Keep the document-level guard alive just long enough to catch that paired click,
// then let later clicks through if the browser/test environment never emits one.
const MENU_ITEM_CLICK_GUARD_TIMEOUT_MS = 100;

let pendingMenuItemClickGuardCleanup: (() => void) | null = null;

const installMenuItemClickGuard = () => {
  if (typeof document === 'undefined') {
    return;
  }

  pendingMenuItemClickGuardCleanup?.();

  const controller = new AbortController();
  let timeoutId: number | null = null;
  const cleanup = () => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
    controller.abort();
    if (pendingMenuItemClickGuardCleanup === cleanup) {
      pendingMenuItemClickGuardCleanup = null;
    }
  };
  const handleClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    cleanup();
  };

  document.addEventListener('click', handleClick, {
    capture: true,
    once: true,
    signal: controller.signal,
  });
  timeoutId = window.setTimeout(cleanup, MENU_ITEM_CLICK_GUARD_TIMEOUT_MS);
  pendingMenuItemClickGuardCleanup = cleanup;
};

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
    'bg-surface-100 stroke-standard stroke-default shadow-transient-high',
    MENU_RADIUS_CLASS_BY_SIZE[size],
    className,
  );

  return (
    <div
      id={dropdownContext?.contentId}
      role='listbox'
      aria-multiselectable='true'
      aria-labelledby={dropdownContext?.labelId}
      tabIndex={-1}
      onKeyDown={dropdownContext?.onContentKeyDown}
      className={clsx(menuClassName, 'outline-none')}
      style={{
        width: dropdownContext?.triggerWidth ? `${dropdownContext.triggerWidth}px` : undefined,
        maxHeight: dropdownContext?.menuMaxHeight,
        overflowY: dropdownContext?.menuMaxHeight ? 'auto' : undefined,
        overflowX: 'hidden',
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
  <hr className={clsx('border-0 border-t border-stroke-default', className)} />
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
  const handledByPointerRef = useRef(false);

  const selectItem = () => {
    dropdownContext?.onItemSelect?.(value);
    onSelect?.();
  };

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

  const handlePointerDown = disabled
    ? undefined
    : (event: ReactPointerEvent<HTMLDivElement>) => {
        // Prevent the same pointer interaction from falling through to controls
        // underneath this portalled menu after selection updates rerender the page.
        event.preventDefault();
        event.stopPropagation();
        handledByPointerRef.current = true;
        installMenuItemClickGuard();
        selectItem();
      };

  const handleClick = disabled
    ? undefined
    : (event: ReactMouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        // jsdom tests often fire click without pointerdown; real pointers select above.
        if (!handledByPointerRef.current) {
          selectItem();
        }
        handledByPointerRef.current = false;
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
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events -- keyboard handled by parent listbox onKeyDown
    <div
      role='option'
      aria-selected={isSelected}
      aria-disabled={disabled}
      data-value={value}
      data-label={title}
      tabIndex={disabled ? -1 : 0}
      className={itemClassName}
      style={{ outlineOffset: 0 }}
      onPointerDown={handlePointerDown}
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
