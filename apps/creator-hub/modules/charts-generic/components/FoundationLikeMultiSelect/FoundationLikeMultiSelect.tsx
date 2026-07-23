/**
 * NOTE(gperkins@20260305): This is a temporaray implementation copied from the indefinitely pending
 * [foundation-web MultiSelect component](github.rbx.com/Roblox/foundation-web/pull/940).
 * If changes are made to this component, they should be ported to the foundation-web PR as well,
 * or else they will be lost when we switch to the authoritative source!
 */
import type { ForwardedRef, ReactNode, RefObject } from 'react';
import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

// Gap between the trigger and the popped-open menu, in pixels.
const MENU_TRIGGER_GAP_PX = 4;
// Breathing room kept between the menu's bottom and the viewport bottom.
const MENU_VIEWPORT_PADDING_PX = 8;

// Some non-modal overlays (such as the analytics filter drawer) sit above an
// enclosing dialog. Let those surfaces provide a nearer portal host so the
// menu participates in their stacking context instead of rendering behind
// them in the enclosing dialog.
const DROPDOWN_PORTAL_CONTAINER_SELECTOR = '[data-foundation-dropdown-portal-container]';

const getDropdownPortalContainer = (trigger: HTMLElement | null): HTMLElement | null => {
  if (typeof document === 'undefined') {
    return null;
  }
  return (
    trigger?.closest<HTMLElement>(DROPDOWN_PORTAL_CONTAINER_SELECTOR) ??
    trigger?.closest<HTMLElement>('[role="dialog"]') ??
    document.body
  );
};

const computeContentPosition = (rect: DOMRect) => ({
  top: rect.bottom + MENU_TRIGGER_GAP_PX,
  left: rect.left,
  width: rect.width,
  maxHeight: Math.max(
    0,
    window.innerHeight - rect.bottom - MENU_TRIGGER_GAP_PX - MENU_VIEWPORT_PADDING_PX,
  ),
});

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
  /** Truncate overflowing trigger text with an ellipsis instead of allowing it to wrap. */
  truncateValue?: boolean;
  /**
   * Override the "has selection" check that decides whether the trigger
   * renders the `formatValue` result vs. the muted `placeholder`. When
   * omitted, falls back to `selectedValues.length > 0`. Use this when a
   * caller composes the trigger label from selection state held outside
   * `value` (e.g. the Explore Mode `Alerts` cascading sub-menu pinning
   * alert ids without adding the `ConfiguredAlertIncident` row to `value`).
   */
  hasValue?: boolean;
  /**
   * Refs to DOM nodes that should count as "inside" the dropdown for the
   * pointerdown-outside dismissal check. Use this when a cascading popover
   * (e.g. the Explore Mode `Alerts` sub-menu) is portalled outside the
   * multiselect's own portal subtree but should not close the parent menu
   * when the user clicks into it.
   */
  additionalInsidePointerRefs?: ReadonlyArray<RefObject<HTMLElement | null>>;
  children: ReactNode;
};

const defaultFormatValue = (selectedValues: string[]): string => {
  if (selectedValues.length === 0) {
    return '';
  }
  return `${selectedValues.length} selected`;
};

// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- forwardRef cast required to restore generic prop constraints via TForwardRefComponent
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
      truncateValue = false,
      hasValue,
      additionalInsidePointerRefs,
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
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
    const [contentPosition, setContentPosition] = useState({
      top: 0,
      left: 0,
      width: 0,
      maxHeight: 0,
    });

    const setTriggerRef = useCallback(
      (node: HTMLButtonElement | null) => {
        triggerRef.current = node;
        setPortalContainer(getDropdownPortalContainer(node));
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
      if (!triggerRef.current) {
        return;
      }
      setContentPosition(computeContentPosition(triggerRef.current.getBoundingClientRect()));
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
      if (!content) {
        return [];
      }
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
          setContentPosition(computeContentPosition(triggerRef.current.getBoundingClientRect()));
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
      if (!open) {
        return undefined;
      }
      const handlePointerDown = (e: PointerEvent) => {
        if (!(e.target instanceof Node)) {
          return;
        }
        const target = e.target;
        if (triggerRef.current?.contains(target)) {
          return;
        }
        const content = document.getElementById(contentId);
        if (content?.contains(target)) {
          return;
        }
        // Caller-supplied "extended boundary" refs (e.g. a cascading Foundation
        // Popover anchored to one of our `MenuItem`s but portalled into a
        // sibling subtree). Treat any pointerdown inside one of these nodes
        // as "inside" so child menus can stay open while the user picks rows.
        if (
          additionalInsidePointerRefs?.some((insideRef) =>
            insideRef.current ? insideRef.current.contains(target) : false,
          )
        ) {
          return;
        }
        handleOpenChange(false);
      };
      document.addEventListener('pointerdown', handlePointerDown);
      return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [open, contentId, handleOpenChange, additionalInsidePointerRefs]);

    // Reposition content on scroll or resize while open.
    useEffect(() => {
      if (!open) {
        return undefined;
      }
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
        const active =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;

        switch (e.key) {
          case 'ArrowDown': {
            e.preventDefault();
            const currentIdx = active ? items.indexOf(active) : -1;
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
            const currentIdx = active ? items.indexOf(active) : -1;
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
              .toReversed()
              .find((item) => item.getAttribute('aria-disabled') !== 'true');
            lastEnabled?.focus();
            break;
          }
          case 'Enter':
          case ' ': {
            e.preventDefault();
            const focused =
              document.activeElement instanceof HTMLElement ? document.activeElement : null;
            const value =
              focused?.dataset?.value ??
              focused?.closest<HTMLElement>('[data-value]')?.dataset?.value;
            if (value) {
              handleItemSelect(value);
            }
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
        labelId: label ? labelId : ariaLabelledBy,
        triggerWidth: contentPosition.width,
        menuMaxHeight: contentPosition.maxHeight > 0 ? contentPosition.maxHeight : undefined,
      }),
      [
        size,
        selectedValues,
        handleItemSelect,
        handleContentKeyDown,
        contentId,
        label,
        labelId,
        ariaLabelledBy,
        contentPosition.width,
        contentPosition.maxHeight,
      ],
    );

    const triggerLabel = formatValue(selectedValues);
    const hasSelection = hasValue ?? selectedValues.length > 0;

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
              // oxlint-disable-next-line better-tailwindcss/no-unknown-classes -- supplied by @rbx/foundation-ui internal/Common.css but not exported by Foundation Tailwind
              hasError ? 'stroke-system-alert' : 'stroke-contrast-alpha',
              hasSelection ? 'content-default' : 'content-muted',
            )}>
            <StateLayer />
            <div
              className={clsx(
                'grow-1 text-align-x-left',
                truncateValue ? 'min-width-0' : 'text-truncate-split',
              )}>
              <span className={truncateValue ? 'block text-no-wrap text-truncate-end' : undefined}>
                {hasSelection ? triggerLabel : placeholder}
              </span>
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
                style={{
                  position: 'fixed',
                  zIndex: 1050,
                  top: contentPosition.top,
                  left: contentPosition.left,
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
