// oxlint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-element-interactions -- The TextInput-style shell forwards pointer focus to the real input.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clsx, Icon, Popover, PopoverAnchor, PopoverContent } from '@rbx/foundation-ui';
import {
  disabledOpacity,
  useId,
  dropdownSizes,
  DropdownContext,
  TEXT_INPUT_PADDING_X_CLASS_BY_SIZE,
  TEXT_INPUT_GAP_X_CLASS_BY_SIZE,
  LABEL_CLASS_BY_SIZE,
  TEXT_INPUT_TEXT_CLASSES_BY_SIZE,
  GAP_CLASS_BY_SIZE,
  DROPDOWN_RADIUS_CLASS_BY_SIZE,
  HEIGHT_CLASS_BY_SIZE,
  BACKGROUND_CLASS_BY_INPUT_VARIANT,
  STROKE_CLASS_BY_INPUT_VARIANT,
  inputVariants,
} from '../lib/foundation-base-shared';
import type { TDropdownSize, TDropdownContext, TInputVariant } from '../lib/foundation-base-shared';
import { useListboxController } from '../lib/foundation-listbox';
import { Tooltip } from '../tooltip';
import { ComboboxContext, defaultFilterOption } from './FoundationBasedComboboxContext';
import type { TComboboxContext, TComboboxFilterOption } from './FoundationBasedComboboxContext';

export const comboboxSizes = dropdownSizes;
export type TComboboxSize = TDropdownSize;
export const comboboxVariants = inputVariants;
export type TComboboxVariant = TInputVariant;

export type TComboboxMenuAlign = 'start' | 'end';
export type TComboboxAutocomplete = 'list' | 'both';

/**
 * A freeform text input with single-item menu suggestions.
 *
 * Unlike Dropdown, a combobox does not reject unlisted text or reset on blur.
 * Unlike TextInput, it can surface typeahead suggestions. Unlike Autocomplete,
 * its options are composed as first-class menu children.
 *
 * Use `Combobox.Menu` with `Combobox.MenuItem` children to define suggestions. The
 * input accepts standard input attributes such as `id`, `name`, `onFocus`, and `onBlur`;
 * committed text changes are reported through `onValueChange`.
 */
export type TComboboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'disabled' | 'size'
> & {
  label?: string;
  /** Renders an info icon with this tooltip text to the right of the label. */
  labelTooltip?: string;
  ariaLabelledBy?: string;
  ariaLabel?: string;
  size: TComboboxSize;
  variant?: TInputVariant;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  isDisabled?: boolean;
  hint?: string;
  hasError?: boolean;
  className?: string;
  onValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  menuAlign?: TComboboxMenuAlign;
  /**
   * Combobox is intended to always provide list autocomplete through its popup suggestions.
   * Use `both` to also show inline completion for the active suggestion.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-autocomplete
   */
  autocomplete?: TComboboxAutocomplete;
  filterOption?: TComboboxFilterOption;
  children: React.ReactNode;
  ref?: React.Ref<HTMLInputElement>;
};

function assignForwardedRef<T>(instanceRef: React.Ref<T> | undefined, node: T | null): void {
  if (typeof instanceRef === 'function') {
    instanceRef(node);
  } else if (instanceRef) {
    instanceRef.current = node;
  }
}

type TPendingActivation = 'first' | 'last';

export function Combobox({
  ref,
  label,
  labelTooltip,
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
  hint,
  onValueChange,
  onOpenChange,
  leading,
  trailing,
  menuAlign = 'start',
  autocomplete = 'both',
  filterOption = defaultFilterOption,
  children,
  id,
  onFocus,
  onBlur,
  onKeyDown,
  ...inputProps
}: TComboboxProps) {
  const autoId = useId(':combobox-input');
  const inputId = id ?? autoId;
  const labelId = useId(':combobox-label');
  const contentId = useId(':combobox-content');
  const descriptionId = `${inputId}-description`;

  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const [selectedValue, setSelectedValue] = useState<string | undefined>(undefined);
  const isControlled = valueProp !== undefined;
  const inputValue = isControlled ? valueProp : internalValue;

  const inputRef = useRef<HTMLInputElement | null>(null);
  // Selection returns focus to the input; this prevents that focus from reopening the popup.
  const skipNextFocusOpenRef = useRef(false);
  // Arrow keys can open the popup before options mount, so activation is completed after mount.
  const pendingActivationRef = useRef<TPendingActivation | null>(null);
  // PopoverAnchor is not a trigger, so internal pointer/focus events need one-shot dismiss guards.
  const ignoreNextAnchorDismissRef = useRef(false);
  const ignoreNextFocusedInputDismissRef = useRef(false);
  const clearFocusedInputDismissTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
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

  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      assignForwardedRef(ref, node);
    },
    [ref],
  );

  const setValue = useCallback(
    (next: string) => {
      if (!isControlled) {
        setInternalValue(next);
      }
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const enterOption = useMemo(() => {
    if (activeOption) {
      return activeOption;
    }
    if (inputValue.length === 0) {
      return undefined;
    }

    const enabledOptions = options.filter((option) => !option.disabled);
    return enabledOptions.length === 1 ? enabledOptions[0] : undefined;
  }, [activeOption, inputValue.length, options]);

  const armFocusedInputDismissGuard = useCallback(() => {
    // Opening from input focus can make Radix immediately request close; ignore only that tick.
    ignoreNextFocusedInputDismissRef.current = true;
    clearTimeout(clearFocusedInputDismissTimerRef.current);
    clearFocusedInputDismissTimerRef.current = setTimeout(() => {
      ignoreNextFocusedInputDismissRef.current = false;
    }, 0);
  }, []);

  const disarmFocusedInputDismissGuard = useCallback(() => {
    clearTimeout(clearFocusedInputDismissTimerRef.current);
    ignoreNextFocusedInputDismissRef.current = false;
  }, []);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isDisabled) {
        return;
      }
      if (!isOpen && ignoreNextAnchorDismissRef.current) {
        ignoreNextAnchorDismissRef.current = false;
        return;
      }
      // Radix may request dismissal while the input is still the active element during focus-open.
      // Treat that as part of opening the combobox, not as an outside click.
      const shouldIgnoreFocusedInputDismiss =
        !isOpen &&
        ignoreNextFocusedInputDismissRef.current &&
        document.activeElement === inputRef.current;
      ignoreNextFocusedInputDismissRef.current = shouldIgnoreFocusedInputDismiss
        ? false
        : ignoreNextFocusedInputDismissRef.current;
      if (!shouldIgnoreFocusedInputDismiss) {
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
      }
    },
    [clearActive, isDisabled, onOpenChange, resetTypeahead],
  );

  const handleOptionSelect = useCallback(
    (itemValue: string, title: string) => {
      setSelectedValue(itemValue);
      setValue(title);
      disarmFocusedInputDismissGuard();
      handleOpenChange(false);
      skipNextFocusOpenRef.current = true;
      inputRef.current?.focus();
    },
    [disarmFocusedInputDismissGuard, handleOpenChange, setValue],
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedValue(undefined);
      clearActive();
      setValue(event.target.value);
      handleOpenChange(true);
    },
    [clearActive, handleOpenChange, setValue],
  );

  const handleInputFocus = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      if (skipNextFocusOpenRef.current) {
        skipNextFocusOpenRef.current = false;
        onFocus?.(event);
        return;
      }
      armFocusedInputDismissGuard();
      handleOpenChange(true);
      onFocus?.(event);
    },
    [armFocusedInputDismissGuard, handleOpenChange, onFocus],
  );

  const handleInputBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(event);
    },
    [onBlur],
  );

  const handleInputClick = useCallback(() => {
    armFocusedInputDismissGuard();
    handleOpenChange(true);
  }, [armFocusedInputDismissGuard, handleOpenChange]);

  const handleInputContainerMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === inputRef.current) {
      return;
    }

    event.preventDefault();
    inputRef.current?.focus();
  }, []);

  const handleInputContainerPointerDownCapture = useCallback(() => {
    if (open) {
      // Clicking the anchored input shell is an internal interaction, not an outside dismiss.
      ignoreNextAnchorDismissRef.current = true;
    }
  }, [open]);

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
        case 'Enter': {
          e.preventDefault();
          enterOption?.onSelect?.();
          break;
        }
        case 'Tab': {
          disarmFocusedInputDismissGuard();
          handleOpenChange(false);
          break;
        }
        case 'Escape': {
          e.preventDefault();
          disarmFocusedInputDismissGuard();
          handleOpenChange(false);
          skipNextFocusOpenRef.current = true;
          inputRef.current?.focus();
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
      disarmFocusedInputDismissGuard,
      enterOption,
      handleOpenChange,
      handleTypeahead,
      isTypeaheadKey,
    ],
  );

  useEffect(() => {
    if (!open || options.length === 0) {
      return;
    }

    // Finish ArrowUp/ArrowDown activation once menu rows have registered with the controller.
    const pendingActivation = pendingActivationRef.current;
    pendingActivationRef.current = null;
    if (pendingActivation === 'first') {
      activateFirst();
    } else if (pendingActivation === 'last') {
      activateLast();
    }
  }, [activateFirst, activateLast, open, options.length]);

  const inlineCompletion = useMemo(() => {
    const activeLabel = activeOption?.label;
    // Only show the untyped suffix after the user has entered text. Otherwise it competes with
    // the placeholder because every option starts with an empty string.
    if (
      autocomplete !== 'both' ||
      !open ||
      inputValue.length === 0 ||
      activeLabel === undefined ||
      activeLabel.length <= inputValue.length ||
      !activeLabel.toLowerCase().startsWith(inputValue.toLowerCase())
    ) {
      return undefined;
    }
    return activeLabel.slice(inputValue.length);
  }, [activeOption?.label, autocomplete, inputValue, open]);

  useEffect(() => () => clearTimeout(clearFocusedInputDismissTimerRef.current), []);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!open) {
          pendingActivationRef.current = 'first';
          handleOpenChange(true);
        } else if (activeId) {
          activateNext();
        } else {
          activateFirst();
        }
        onKeyDown?.(e);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!open) {
          pendingActivationRef.current = 'last';
          handleOpenChange(true);
        } else if (activeId) {
          activatePrevious();
        } else {
          activateLast();
        }
        onKeyDown?.(e);
        return;
      }
      if (e.key === 'Home' && open && activeId) {
        e.preventDefault();
        activateFirst();
        onKeyDown?.(e);
        return;
      }
      if (e.key === 'End' && open && activeId) {
        e.preventDefault();
        activateLast();
        onKeyDown?.(e);
        return;
      }
      if (e.key === 'Enter' && open && enterOption) {
        e.preventDefault();
        enterOption.onSelect?.();
        onKeyDown?.(e);
        return;
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        disarmFocusedInputDismissGuard();
        handleOpenChange(false);
        onKeyDown?.(e);
        return;
      }
      if (e.key === 'Tab' && open) {
        disarmFocusedInputDismissGuard();
        handleOpenChange(false);
        onKeyDown?.(e);
        return;
      }
      onKeyDown?.(e);
    },
    [
      activateFirst,
      activateLast,
      activateNext,
      activatePrevious,
      activeId,
      disarmFocusedInputDismissGuard,
      enterOption,
      handleOpenChange,
      onKeyDown,
      open,
    ],
  );

  const dropdownContextValue: TDropdownContext = useMemo(
    () => ({
      size,
      selectedValues: selectedValue ? [selectedValue] : undefined,
      onContentKeyDown: handleContentKeyDown,
      contentId,
      triggerWidth: 1,
    }),
    [contentId, handleContentKeyDown, selectedValue, size],
  );

  const comboboxContextValue: TComboboxContext = useMemo(
    () => ({
      inputValue,
      selectedValue,
      activeOptionId: activeId,
      visibleOptionCount: 0,
      filterOption,
      registerOption,
      setActiveOptionId: setActiveId,
      onOptionSelect: handleOptionSelect,
    }),
    [
      filterOption,
      handleOptionSelect,
      inputValue,
      activeId,
      registerOption,
      setActiveId,
      selectedValue,
    ],
  );

  return (
    <DropdownContext.Provider value={dropdownContextValue}>
      <ComboboxContext.Provider value={comboboxContextValue}>
        <div
          className={clsx(
            'flex flex-col width-full',
            isDisabled && clsx(disabledOpacity, 'pointer-events-none'),
            GAP_CLASS_BY_SIZE[size],
            className,
          )}>
          {label && (
            <div className='flex items-center gap-xsmall'>
              <label
                id={labelId}
                htmlFor={inputId}
                className={clsx(LABEL_CLASS_BY_SIZE[size], 'content-emphasis')}>
                {label}
              </label>
              {labelTooltip && (
                <Tooltip title={labelTooltip} contentClassName='max-width-[150px]'>
                  <span className='inline-flex items-center content-muted'>
                    <Icon name='icon-regular-circle-i' size='Small' />
                  </span>
                </Tooltip>
              )}
            </div>
          )}
          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverAnchor className='width-full'>
              <div
                data-testid='text-input-container'
                onPointerDownCapture={handleInputContainerPointerDownCapture}
                onMouseDown={handleInputContainerMouseDown}
                className={clsx(
                  'foundation-web-input flex items-center width-full',
                  BACKGROUND_CLASS_BY_INPUT_VARIANT[variant],
                  STROKE_CLASS_BY_INPUT_VARIANT[variant],
                  DROPDOWN_RADIUS_CLASS_BY_SIZE[size],
                  HEIGHT_CLASS_BY_SIZE[size],
                  TEXT_INPUT_PADDING_X_CLASS_BY_SIZE[size],
                  TEXT_INPUT_GAP_X_CLASS_BY_SIZE[size],
                  hasError ? 'stroke-system-alert' : 'stroke-contrast-alpha',
                )}>
                {leading}
                <div className='relative width-full min-width-0'>
                  {inlineCompletion && (
                    <div
                      aria-hidden='true'
                      className={clsx(
                        'pointer-events-none absolute inset-0 flex items-center overflow-hidden text-no-wrap',
                        TEXT_INPUT_TEXT_CLASSES_BY_SIZE[size],
                      )}>
                      {/* Hidden typed text offsets the muted suffix so it appears inline after the cursor. */}
                      <span className='invisible [white-space:pre]'>{inputValue}</span>
                      <span
                        data-testid='combobox-inline-completion'
                        className='content-muted [white-space:pre]'>
                        {inlineCompletion}
                      </span>
                    </div>
                  )}
                  <input
                    {...inputProps}
                    id={inputId}
                    ref={setInputRef}
                    type='text'
                    role='combobox'
                    value={inputValue}
                    placeholder={placeholder}
                    disabled={isDisabled}
                    aria-invalid={hasError}
                    aria-describedby={hint ? descriptionId : undefined}
                    aria-expanded={open}
                    aria-controls={open ? contentId : undefined}
                    aria-activedescendant={open ? activeId : undefined}
                    aria-autocomplete={autocomplete}
                    aria-labelledby={label ? labelId : ariaLabelledBy}
                    aria-label={ariaLabel}
                    className={clsx(
                      'relative width-full min-width-0 padding-none bg-none stroke-none outline-none content-emphasis placeholder:content-muted [appearance:none]',
                      TEXT_INPUT_TEXT_CLASSES_BY_SIZE[size],
                    )}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    onChange={handleInputChange}
                    onClick={handleInputClick}
                    onKeyDown={handleInputKeyDown}
                  />
                </div>
                {trailing}
              </div>
            </PopoverAnchor>

            {open && (
              <>
                {/* The input keeps focus and reports the active option through aria-activedescendant. */}
                <PopoverContent
                  side='bottom'
                  align={menuAlign}
                  sideOffset={0}
                  collisionPadding={8}
                  onOpenAutoFocus={(event) => event.preventDefault()}
                  aria-labelledby={label ? labelId : (ariaLabelledBy ?? inputId)}
                  className='padding-y-small'>
                  <div className='width-[var(--radix-popover-trigger-width)] max-height-[var(--radix-popover-content-available-height)] [overflow-x:hidden] [overflow-y:auto] [box-sizing:border-box]'>
                    {children}
                  </div>
                </PopoverContent>
              </>
            )}
          </Popover>

          {hint && (
            <span
              id={descriptionId}
              className={clsx('text-caption-small', {
                'content-system-alert': hasError,
                'content-default': !hasError,
              })}>
              {hint}
            </span>
          )}
        </div>
      </ComboboxContext.Provider>
    </DropdownContext.Provider>
  );
}

Combobox.displayName = 'FoundationBasedCombobox';
