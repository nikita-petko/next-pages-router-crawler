/**
 * NOTE(gperkins@20260305): This is a temporaray implementation copied from the indefinitely pending
 * [foundation-web MultiSelect component](github.rbx.com/Roblox/foundation-web/pull/940).
 * If changes are made to this component, they should be ported to the foundation-web PR as well,
 * or else they will be lost when we switch to the authoritative source!
 */
import React, {
  ForwardedRef,
  forwardRef,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  clsx,
  interactable,
  StateLayer,
  disabledOpacity,
  useId,
  useTypeahead,
  dropdownSizes,
  DropdownContext,
  CHEVRON_SIZE_CLASS_BY_SIZE,
  PADDING_X_CLASS_BY_SIZE,
  LABEL_CLASS_BY_SIZE,
  TEXT_CLASS_BY_SIZE,
  GAP_CLASS_BY_SIZE,
  DROPDOWN_RADIUS_CLASS_BY_SIZE,
  HEIGHT_CLASS_BY_SIZE,
  BACKGROUND_CLASS_BY_INPUT_VARIANT,
  STROKE_CLASS_BY_INPUT_VARIANT,
  inputVariants,
} from './FoundationLikeShared';
import type {
  TDropdownSize,
  TDropdownContext,
  TForwardRefComponent,
  TInputVariant,
} from './FoundationLikeShared';

export const multiSelectSizes = dropdownSizes;
export type TMultiSelectSize = TDropdownSize;
export const multiSelectVariants = inputVariants;
export type TMultiSelectVariant = TInputVariant;
export type TMultiSelectValue = string[];

export type TMultiSelectProps = {
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
  children: ReactNode;
};

const defaultFormatValue = (selectedValues: string[]): string => {
  if (selectedValues.length === 0) return '';
  return `${selectedValues.length} selected`;
};

export const FoundationLikeMultiSelect = forwardRef(
  (
    {
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
      children,
    }: TMultiSelectProps,
    ref: ForwardedRef<HTMLButtonElement>,
  ) => {
    const labelId = useId();
    const contentId = useId(':multiselect-content');
    const [open, setOpen] = useState(false);
    const [internalValue, setInternalValue] = useState<string[]>(defaultValue ?? []);
    const isControlled = valueProp !== undefined;
    const selectedValues = isControlled ? valueProp : internalValue;

    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const [contentPosition, setContentPosition] = useState({
      top: 0,
      left: 0,
      width: 0,
      maxHeight: 0,
    });

    const setTriggerRef = useCallback(
      (node: HTMLButtonElement | null) => {
        triggerRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          const mutableRef = ref as { current: HTMLButtonElement | null };
          mutableRef.current = node;
        }
      },
      [ref],
    );

    const updatePosition = useCallback(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setContentPosition({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(0, window.innerHeight - rect.bottom),
      });
    }, []);

    const handleItemSelect = useCallback(
      (itemValue: string) => {
        const next = selectedValues.includes(itemValue)
          ? selectedValues.filter((v) => v !== itemValue)
          : [...selectedValues, itemValue];
        if (!isControlled) {
          setInternalValue(next);
        }
        onValueChange?.(next);
      },
      [selectedValues, isControlled, onValueChange],
    );

    const getItems = useCallback(() => {
      const content = document.getElementById(contentId);
      if (!content) return [];
      return Array.from(content.querySelectorAll<HTMLElement>('[role="option"]'));
    }, [contentId]);

    const onTypeaheadMatch = useCallback((el: HTMLElement) => el.focus(), []);

    const {
      handleTypeahead,
      isTypeaheadKey,
      reset: resetTypeahead,
    } = useTypeahead({
      getItems,
      onMatch: onTypeaheadMatch,
    });

    const handleOpenChange = useCallback(
      (isOpen: boolean) => {
        if (isOpen && triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          setContentPosition({
            top: rect.bottom,
            left: rect.left,
            width: rect.width,
            maxHeight: Math.max(0, window.innerHeight - rect.bottom),
          });
        }
        setOpen(isOpen);
        onOpenChange?.(isOpen);
        if (!isOpen) {
          resetTypeahead();
        }
      },
      [onOpenChange, resetTypeahead],
    );

    // Focus the last selected item (or first available) when the popover opens.
    const prevOpenRef = useRef(false);
    useEffect(() => {
      if (open && !prevOpenRef.current) {
        requestAnimationFrame(() => {
          const content = document.getElementById(contentId);
          const lastSelected = selectedValues.at(-1);
          const target = lastSelected
            ? content?.querySelector<HTMLElement>(`[data-value="${lastSelected}"]`)
            : content?.querySelector<HTMLElement>('[role="option"]:not([aria-disabled="true"])');
          target?.focus();
        });
      }
      prevOpenRef.current = open;
    }, [open, contentId, selectedValues]);

    // Close on click outside the trigger and content.
    // Uses pointerdown (fires before mousedown) so that Radix-based dropdowns
    // that call preventDefault on pointerdown don't swallow the dismiss signal.
    useEffect(() => {
      if (!open) return undefined;
      const handlePointerDown = (e: PointerEvent) => {
        const target = e.target as Node;
        if (triggerRef.current?.contains(target)) return;
        const content = document.getElementById(contentId);
        if (content?.contains(target)) return;
        handleOpenChange(false);
      };
      document.addEventListener('pointerdown', handlePointerDown);
      return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [open, contentId, handleOpenChange]);

    // Reposition content on scroll or resize while open.
    useEffect(() => {
      if (!open) return undefined;
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }, [open, updatePosition]);

    const handleContentKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLElement>) => {
        const items = getItems();
        const active = document.activeElement as HTMLElement;

        switch (e.key) {
          case 'ArrowDown': {
            e.preventDefault();
            const currentIdx = items.indexOf(active);
            for (let i = 1; i <= items.length; i += 1) {
              const nextIdx = (currentIdx + i) % items.length;
              if (items[nextIdx].getAttribute('aria-disabled') !== 'true') {
                items[nextIdx].focus();
                break;
              }
            }
            break;
          }
          case 'ArrowUp': {
            e.preventDefault();
            const currentIdx = items.indexOf(active);
            for (let i = 1; i <= items.length; i += 1) {
              const prevIdx = (currentIdx - i + items.length) % items.length;
              if (items[prevIdx].getAttribute('aria-disabled') !== 'true') {
                items[prevIdx].focus();
                break;
              }
            }
            break;
          }
          case 'Home': {
            e.preventDefault();
            const firstEnabled = items.find(
              (item) => item.getAttribute('aria-disabled') !== 'true',
            );
            firstEnabled?.focus();
            break;
          }
          case 'End': {
            e.preventDefault();
            const lastEnabled = [...items]
              .reverse()
              .find((item) => item.getAttribute('aria-disabled') !== 'true');
            lastEnabled?.focus();
            break;
          }
          case 'Enter':
          case ' ': {
            e.preventDefault();
            const focused = document.activeElement as HTMLElement | null;
            const value =
              focused?.dataset?.value ??
              focused?.closest<HTMLElement>('[data-value]')?.dataset?.value;
            if (value) handleItemSelect(value);
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
      [getItems, handleItemSelect, handleOpenChange, isTypeaheadKey, handleTypeahead],
    );

    const handleTriggerKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          handleOpenChange(true);
        }
      },
      [handleOpenChange],
    );

    const contextValue: TDropdownContext = useMemo(
      () => ({
        size,
        selectedValues,
        onItemSelect: handleItemSelect,
        onContentKeyDown: handleContentKeyDown,
        contentId,
        triggerWidth: contentPosition.width,
      }),
      [
        size,
        selectedValues,
        handleItemSelect,
        handleContentKeyDown,
        contentId,
        contentPosition.width,
      ],
    );

    const triggerLabel = formatValue(selectedValues);
    const hasSelection = selectedValues.length > 0;

    const portalContainer =
      typeof document === 'undefined'
        ? null
        : (triggerRef.current?.closest<HTMLElement>('[role="dialog"]') ?? document.body);

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
          <button
            type='button'
            ref={setTriggerRef}
            disabled={isDisabled}
            aria-labelledby={label ? labelId : ariaLabelledBy}
            aria-label={ariaLabel}
            aria-haspopup='listbox'
            aria-expanded={open}
            aria-controls={open ? contentId : undefined}
            onKeyDown={handleTriggerKeyDown}
            onClick={() => handleOpenChange(!open)}
            className={clsx(
              interactable,
              'flex items-center justify-between width-full cursor-pointer',
              BACKGROUND_CLASS_BY_INPUT_VARIANT[variant],
              STROKE_CLASS_BY_INPUT_VARIANT[variant],
              DROPDOWN_RADIUS_CLASS_BY_SIZE[size],
              HEIGHT_CLASS_BY_SIZE[size],
              PADDING_X_CLASS_BY_SIZE[size],
              TEXT_CLASS_BY_SIZE[size],
              hasError ? 'stroke-system-alert' : 'stroke-contrast-alpha',
              hasSelection ? 'content-default' : 'content-muted',
            )}>
            <StateLayer />
            <div className='grow-1 text-truncate-split text-align-x-left'>
              <span>{hasSelection ? triggerLabel : placeholder}</span>
            </div>
            <span
              aria-hidden='true'
              className={clsx(
                CHEVRON_SIZE_CLASS_BY_SIZE[size],
                'icon content-default icon-regular-chevron-large-down',
              )}
            />
          </button>

          {open &&
            portalContainer &&
            createPortal(
              <div
                className='padding-y-small'
                style={{
                  position: 'fixed',
                  zIndex: 1050,
                  top: contentPosition.top,
                  left: contentPosition.left,
                  maxHeight: contentPosition.maxHeight > 0 ? contentPosition.maxHeight : undefined,
                }}>
                {children}
              </div>,
              portalContainer,
            )}

          {helperText && <span className='text-caption-small content-default'>{helperText}</span>}
        </div>
      </DropdownContext.Provider>
    );
  },
) as TForwardRefComponent<TMultiSelectProps>;

FoundationLikeMultiSelect.displayName = 'FoundationLikeMultiSelect';

export default FoundationLikeMultiSelect;
