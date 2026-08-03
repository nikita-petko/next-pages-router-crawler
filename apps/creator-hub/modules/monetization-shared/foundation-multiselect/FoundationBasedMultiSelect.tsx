/**
 * NOTE(jeminpark@20260317): This is a temporary implementation migrated from the indefinitely pending
 * [foundation-web MultiSelect component](github.rbx.com/Roblox/foundation-web/pull/940).
 * This is forked from charts-generic/components/FoundationLikeMultiSelect/FoundationLikeMultiSelect.tsx
 * to allow differentiation in design flows (notably the leading prop is not supported).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clsx, Popover, PopoverAnchor, PopoverContent } from '@rbx/foundation-ui';
import {
  StateLayer,
  disabledOpacity,
  useId,
  dropdownSizes,
  DropdownContext,
  ICON_SIZE_CLASS_BY_SIZE,
  PADDING_X_CLASS_BY_SIZE,
  LABEL_CLASS_BY_SIZE,
  TEXT_CLASS_BY_SIZE,
  GAP_CLASS_BY_SIZE,
  DROPDOWN_RADIUS_CLASS_BY_SIZE,
  HEIGHT_CLASS_BY_SIZE,
  BACKGROUND_CLASS_BY_INPUT_VARIANT,
  STROKE_CLASS_BY_INPUT_VARIANT,
  inputVariants,
} from '../lib/foundation-base-shared';
import type { TDropdownSize, TDropdownContext, TInputVariant } from '../lib/foundation-base-shared';
import { useListboxController } from '../lib/foundation-listbox';

export const multiSelectSizes = dropdownSizes;
export type TMultiSelectSize = TDropdownSize;
export const multiSelectVariants = inputVariants;
export type TMultiSelectVariant = TInputVariant;
export type TMultiSelectValue = string[];

/**
 * Horizontal placement of the menu relative to the trigger (LTR).
 * - `start`: align the menu's **left** edge to the trigger's left; clamp so the **right** edge stays on-screen.
 * - `end`: align the menu's **right** edge to the trigger's right; clamp so the **left** edge stays on-screen.
 */
export type TMultiSelectMenuAlign = 'start' | 'end';

/**
 * A button-triggered listbox for selecting zero or more composed menu options.
 *
 * Use `MultiSelect.Menu` with `MultiSelect.MenuItem` children to define the available values.
 * The trigger renders a button and accepts button attributes such as `id`, `name`, `onFocus`,
 * and `onBlur`; `value` changes are reported through `onValueChange`.
 */
export type TMultiSelectProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'value' | 'defaultValue' | 'onChange' | 'disabled' | 'size' | 'type'
> & {
  label?: string;
  ariaLabelledBy?: string;
  ariaLabel?: string;
  size: TMultiSelectSize;
  variant?: TInputVariant;
  value?: string[];
  defaultValue?: string[];
  placeholder: string;
  isDisabled?: boolean;
  hint?: string;
  hasError?: boolean;
  className?: string;
  onValueChange?: (value: string[]) => void;
  onOpenChange?: (open: boolean) => void;
  /** Customize the trigger text. Receives the current selected values array. */
  formatValue?: (selectedValues: string[]) => string;
  /** Optional leading element rendered before the trigger text. */
  leading?: React.ReactNode;
  placeholderClassName?: string;
  trailingClassName?: string;
  /** See {@link TMultiSelectMenuAlign}. Default `start`. */
  menuAlign?: TMultiSelectMenuAlign;
  children: React.ReactNode;
  ref?: React.Ref<HTMLButtonElement>;
};

const defaultFormatValue = (selectedValues: string[]): string => {
  if (selectedValues.length === 0) {
    return '';
  }
  return `${selectedValues.length} selected`;
};

function assignForwardedRef<T>(instanceRef: React.Ref<T> | undefined, node: T | null): void {
  if (typeof instanceRef === 'function') {
    instanceRef(node);
  } else if (instanceRef) {
    // Ref forwarding: update object ref `.current` (React 19 ref-as-prop pattern).
    instanceRef.current = node;
  }
}

type TPendingMenuFocus = 'first' | 'last';

export function MultiSelect({
  ref,
  label,
  ariaLabelledBy,
  ariaLabel,
  className,
  size,
  variant = 'Standard',
  value: valueProp,
  defaultValue,
  placeholder,
  isDisabled,
  hasError,
  hint: helperText,
  onValueChange,
  onOpenChange,
  formatValue = defaultFormatValue,
  leading,
  placeholderClassName,
  trailingClassName,
  menuAlign = 'start',
  children,
  onClick,
  onKeyDown,
  ...buttonProps
}: TMultiSelectProps) {
  const labelId = useId();
  const contentId = useId(':multiselect-content');
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue ?? []);
  const isControlled = valueProp !== undefined;
  const selectedValues = isControlled ? valueProp : internalValue;

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const pendingMenuFocusRef = useRef<TPendingMenuFocus | null>(null);
  // PopoverAnchor is not a trigger, so clicks on the trigger need a one-shot dismiss guard.
  const ignoreNextAnchorDismissRef = useRef(false);
  // Keep selection callbacks stable so menu rows do not re-register and reset active focus.
  const selectedValuesRef = useRef(selectedValues);
  const onValueChangeRef = useRef(onValueChange);
  const {
    activeId,
    activeOption,
    activateFirst,
    activateLast,
    activateNext,
    activatePrevious,
    clearActive,
    handleTypeahead,
    isTypeaheadKey,
    options,
    registerOption,
    resetTypeahead,
    setActiveId,
  } = useListboxController();

  const setTriggerRef = useCallback(
    (node: HTMLButtonElement | null) => {
      triggerRef.current = node;
      assignForwardedRef(ref, node);
    },
    [ref],
  );

  useEffect(() => {
    selectedValuesRef.current = selectedValues;
  }, [selectedValues]);

  useEffect(() => {
    onValueChangeRef.current = onValueChange;
  }, [onValueChange]);

  const handleItemSelect = useCallback(
    (itemValue: string) => {
      const current = selectedValuesRef.current;
      const next = current.includes(itemValue)
        ? current.filter((v) => v !== itemValue)
        : [...current, itemValue];
      selectedValuesRef.current = next;
      if (!isControlled) {
        setInternalValue(next);
      }
      onValueChangeRef.current?.(next);
    },
    [isControlled],
  );

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen && ignoreNextAnchorDismissRef.current) {
        ignoreNextAnchorDismissRef.current = false;
        return;
      }
      if (!isOpen) {
        clearActive();
        resetTypeahead();
      }
      setOpen((current) => {
        if (current === isOpen) {
          return current;
        }
        onOpenChange?.(isOpen);
        return isOpen;
      });
    },
    [clearActive, onOpenChange, resetTypeahead],
  );

  const handleTriggerPointerDownCapture = useCallback(() => {
    if (open) {
      ignoreNextAnchorDismissRef.current = true;
    }
  }, [open]);

  useEffect(() => {
    if (!open || options.length === 0) {
      return;
    }

    // On first open, match Dropdown behavior: focus selected item, requested edge, or first item.
    const pendingFocus = pendingMenuFocusRef.current;
    if (pendingFocus === 'first') {
      activateFirst();
    } else if (pendingFocus === 'last') {
      activateLast();
    } else if (!activeId) {
      const lastSelected = selectedValues.at(-1);
      const selectedOption = options.find(
        (option) => option.value === lastSelected && !option.disabled,
      );
      setActiveId(selectedOption?.id);
      if (!selectedOption) {
        activateFirst();
      }
    }

    pendingMenuFocusRef.current = null;
    document.getElementById(contentId)?.focus();
  }, [
    activateFirst,
    activateLast,
    activeId,
    contentId,
    open,
    options,
    selectedValues,
    setActiveId,
  ]);

  const handleContentKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          activateNext();
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          activatePrevious();
          break;
        }
        case 'Home': {
          e.preventDefault();
          activateFirst();
          break;
        }
        case 'End': {
          e.preventDefault();
          activateLast();
          break;
        }
        case 'Enter':
        case ' ': {
          e.preventDefault();
          activeOption?.onSelect?.();
          break;
        }
        case 'Tab': {
          handleOpenChange(false);
          break;
        }
        case 'Escape': {
          e.preventDefault();
          handleOpenChange(false);
          triggerRef.current?.focus();
          break;
        }
        default: {
          if (isTypeaheadKey(e.key)) {
            e.preventDefault();
            handleTypeahead(e.key);
          }
        }
      }
    },
    [
      activateFirst,
      activateLast,
      activateNext,
      activatePrevious,
      activeOption,
      handleOpenChange,
      handleTypeahead,
      isTypeaheadKey,
    ],
  );

  const handleTriggerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        pendingMenuFocusRef.current = e.key === 'ArrowUp' ? 'last' : 'first';
        handleOpenChange(true);
        if (open) {
          if (e.key === 'ArrowUp') {
            activateLast();
          } else {
            activateFirst();
          }
          document.getElementById(contentId)?.focus();
        }
        onKeyDown?.(e);
        return;
      }
      onKeyDown?.(e);
    },
    [activateFirst, activateLast, contentId, handleOpenChange, onKeyDown, open],
  );

  const handleTriggerClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      handleOpenChange(!open);
      onClick?.(event);
    },
    [handleOpenChange, onClick, open],
  );

  const contextValue: TDropdownContext = useMemo(
    () => ({
      size,
      selectedValues,
      onItemSelect: handleItemSelect,
      onContentKeyDown: handleContentKeyDown,
      contentId,
      triggerWidth: 1,
      activeOptionId: activeId,
      registerOption,
      setActiveOptionId: setActiveId,
    }),
    [
      size,
      selectedValues,
      handleItemSelect,
      handleContentKeyDown,
      contentId,
      activeId,
      registerOption,
      setActiveId,
    ],
  );

  const triggerLabel = formatValue(selectedValues);
  const hasSelection = selectedValues.length > 0;

  return (
    <DropdownContext.Provider value={contextValue}>
      <div
        className={clsx(
          'flex flex-col',
          isDisabled && clsx(disabledOpacity, 'pointer-events-none'),
          GAP_CLASS_BY_SIZE[size],
          className,
        )}>
        {label && (
          <span id={labelId} className={clsx(LABEL_CLASS_BY_SIZE[size], 'content-emphasis')}>
            {label}
          </span>
        )}
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverAnchor className='width-full'>
            <button
              {...buttonProps}
              type='button'
              ref={setTriggerRef}
              disabled={isDisabled}
              aria-labelledby={label ? labelId : ariaLabelledBy}
              aria-label={ariaLabel}
              aria-haspopup='listbox'
              aria-expanded={open}
              aria-controls={open ? contentId : undefined}
              onPointerDownCapture={handleTriggerPointerDownCapture}
              onKeyDown={handleTriggerKeyDown}
              onClick={handleTriggerClick}
              className={clsx(
                'relative clip group/interactable outline-none',
                'foundation-web-input flex items-center justify-between width-full cursor-pointer',
                BACKGROUND_CLASS_BY_INPUT_VARIANT[variant],
                STROKE_CLASS_BY_INPUT_VARIANT[variant],
                leading ? 'gap-small' : undefined,
                DROPDOWN_RADIUS_CLASS_BY_SIZE[size],
                HEIGHT_CLASS_BY_SIZE[size],
                PADDING_X_CLASS_BY_SIZE[size],
                TEXT_CLASS_BY_SIZE[size],
                hasError ? 'stroke-system-alert' : 'stroke-contrast-alpha',
                hasSelection ? 'content-default' : 'content-muted',
              )}>
              <StateLayer />
              {leading}
              <div
                className={clsx(
                  'grow-1 text-truncate-split text-align-x-left',
                  placeholderClassName,
                )}>
                <span>{hasSelection ? triggerLabel : placeholder}</span>
              </div>
              <span
                aria-hidden='true'
                className={clsx(
                  ICON_SIZE_CLASS_BY_SIZE[size],
                  'icon content-default icon-regular-chevron-large-down',
                  trailingClassName,
                )}
              />
            </button>
          </PopoverAnchor>

          {open && (
            <>
              {/* The listbox owns keyboard focus, not the PopoverContent wrapper. */}
              <PopoverContent
                side='bottom'
                align={menuAlign}
                sideOffset={0}
                collisionPadding={8}
                onOpenAutoFocus={(event) => event.preventDefault()}
                aria-labelledby={label ? labelId : (ariaLabelledBy ?? contentId)}
                className='padding-y-small'>
                <div className='width-[var(--radix-popover-trigger-width)] max-height-[var(--radix-popover-content-available-height)] [overflow-x:hidden] [overflow-y:auto] [box-sizing:border-box]'>
                  {children}
                </div>
              </PopoverContent>
            </>
          )}
        </Popover>

        {helperText && <span className='text-caption-small content-default'>{helperText}</span>}
      </div>
    </DropdownContext.Provider>
  );
}

MultiSelect.displayName = 'FoundationBasedMultiSelect';
