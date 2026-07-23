/* istanbul ignore file */
/**
 * NOTE(jeminpark@20260317): This is a temporaray implementation copied from the indefinitely pending
 * [foundation-web MultiSelect component](github.rbx.com/Roblox/foundation-web/pull/940).
 * This is forked from charts-generic/components/FoundationLikeMultiSelect/FoundationLikeMultiSelect.tsx
 * to allow differentiation in design flows (notably the leading prop is not supported).
 */
import {
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { clsx } from '@rbx/foundation-ui';
import {
  interactable,
  StateLayer,
  disabledOpacity,
  useId,
  useTypeahead,
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
  /** Optional leading element rendered before the trigger text. */
  leading?: ReactNode;
  placeholderClassName?: string;
  trailingClassName?: string;
  /** See {@link TMultiSelectMenuAlign}. Default `start`. */
  menuAlign?: TMultiSelectMenuAlign;
  children: ReactNode;
  ref?: React.Ref<HTMLButtonElement>;
};

const defaultFormatValue = (selectedValues: string[]): string => {
  if (selectedValues.length === 0) return '';
  return `${selectedValues.length} selected`;
};

function assignForwardedRef<T>(instanceRef: React.Ref<T> | undefined, node: T | null): void {
  if (typeof instanceRef === 'function') {
    instanceRef(node);
  } else if (instanceRef) {
    // Ref forwarding: update object ref `.current` (React 19 ref-as-prop pattern).
    // eslint-disable-next-line no-param-reassign -- intentional ref handle sync
    instanceRef.current = node;
  }
}

const VIEWPORT_EDGE_INSET_PX = 8;
const MENU_EDGE_GAP_PX = 4;
const FLIP_OPEN_MIN_SPACE_BELOW_PX = 120;
const MIN_MENU_MAX_HEIGHT_PX = 80;

type TFloatingMenuPosition = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
};

function readViewportSize(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  const doc = document.documentElement;
  const clientW = doc.clientWidth || window.innerWidth;
  const clientH = doc.clientHeight || window.innerHeight;
  const vv = window.visualViewport;
  const width = vv ? Math.min(clientW, vv.width) : clientW;
  const height = vv ? Math.min(clientH, vv.height) : clientH;
  return { width, height };
}

function computeFloatingMenuPosition(
  triggerRect: DOMRectReadOnly,
  menuContentWidth: number,
  align: TMultiSelectMenuAlign,
  viewportWidth: number,
  viewportHeight: number,
): TFloatingMenuPosition {
  const pad = VIEWPORT_EDGE_INSET_PX;
  const gap = MENU_EDGE_GAP_PX;
  const {
    left: tLeft,
    right: tRight,
    top: tTop,
    bottom: tBottom,
    width: triggerWidth,
  } = triggerRect;

  const maxWidthInView = Math.max(0, viewportWidth - 2 * pad);
  let width = Math.min(Math.max(menuContentWidth, triggerWidth), maxWidthInView);
  let left: number;

  if (align === 'end') {
    const menuRight = Math.min(tRight, viewportWidth - pad);
    left = menuRight - width;
    if (left < pad) {
      left = pad;
      width = Math.max(0, menuRight - left);
    }
  } else {
    left = Math.max(tLeft, pad);
    const menuRight = Math.min(left + width, viewportWidth - pad);
    width = Math.max(0, menuRight - left);
  }

  const spaceBelow = viewportHeight - tBottom - pad;
  const spaceAbove = tTop - pad;
  const openAbove = spaceBelow < FLIP_OPEN_MIN_SPACE_BELOW_PX && spaceAbove > spaceBelow;

  if (openAbove) {
    return {
      bottom: viewportHeight - tTop + gap,
      left,
      width,
      maxHeight: Math.max(MIN_MENU_MAX_HEIGHT_PX, spaceAbove - gap),
    };
  }

  return {
    top: tBottom + gap,
    left,
    width,
    maxHeight: Math.max(MIN_MENU_MAX_HEIGHT_PX, spaceBelow - gap),
  };
}

export function FoundationBasedMultiSelect({
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
}: TMultiSelectProps) {
  const labelId = useId();
  const contentId = useId(':multiselect-content');
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue ?? []);
  const isControlled = valueProp !== undefined;
  const selectedValues = isControlled ? valueProp : internalValue;

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentWrapperRef = useRef<HTMLDivElement | null>(null);
  const [contentPosition, setContentPosition] = useState<TFloatingMenuPosition>({
    left: 0,
    width: 0,
    maxHeight: 0,
  });

  const setTriggerRef = useCallback(
    (node: HTMLButtonElement | null) => {
      triggerRef.current = node;
      assignForwardedRef(ref, node);
    },
    [ref],
  );

  const applyMenuPosition = useCallback(() => {
    const triggerEl = triggerRef.current;
    if (!triggerEl) return;
    const rect = triggerEl.getBoundingClientRect();
    const { width: vw, height: vh } = readViewportSize();
    const wrapperEl = contentWrapperRef.current;
    // scrollWidth returns the full content width even when overflow is hidden and an explicit width is set.
    const measuredW = wrapperEl?.scrollWidth ?? rect.width;
    const menuTargetWidth = Math.max(measuredW, rect.width);
    setContentPosition(computeFloatingMenuPosition(rect, menuTargetWidth, menuAlign, vw, vh));
  }, [menuAlign]);

  const updatePosition = applyMenuPosition;

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
      if (isOpen) {
        applyMenuPosition();
      }
      setOpen(isOpen);
      onOpenChange?.(isOpen);
      if (!isOpen) {
        resetTypeahead();
      }
    },
    [applyMenuPosition, onOpenChange, resetTypeahead],
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

  // Reposition after the portal mounts (runs before paint so the user never sees a wrong position).
  useLayoutEffect(() => {
    if (!open) return;
    applyMenuPosition();
  }, [open, applyMenuPosition]);

  useEffect(() => {
    if (!open) return undefined;
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const onVvChange = () => applyMenuPosition();
    vv.addEventListener('resize', onVvChange);
    vv.addEventListener('scroll', onVvChange);
    return () => {
      vv.removeEventListener('resize', onVvChange);
      vv.removeEventListener('scroll', onVvChange);
    };
  }, [open, applyMenuPosition]);

  useEffect(() => {
    if (!open) return undefined;
    const el = contentWrapperRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => applyMenuPosition());
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, applyMenuPosition]);

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
          const firstEnabled = items.find((item) => item.getAttribute('aria-disabled') !== 'true');
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
            className={clsx('grow-1 text-truncate-split text-align-x-left', placeholderClassName)}>
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

        {open &&
          createPortal(
            <div
              ref={contentWrapperRef}
              className='padding-y-small'
              style={{
                position: 'fixed',
                zIndex: 1050,
                left: contentPosition.left,
                boxSizing: 'border-box',
                overflowX: 'hidden',
                overflowY: 'auto',
                ...(contentPosition.width > 0 ? { width: contentPosition.width } : {}),
                ...(contentPosition.top !== undefined ? { top: contentPosition.top } : {}),
                ...(contentPosition.bottom !== undefined ? { bottom: contentPosition.bottom } : {}),
                maxHeight: contentPosition.maxHeight > 0 ? contentPosition.maxHeight : undefined,
              }}>
              {children}
            </div>,
            document.body,
          )}

        {helperText && <span className='text-caption-small content-default'>{helperText}</span>}
      </div>
    </DropdownContext.Provider>
  );
}

FoundationBasedMultiSelect.displayName = 'FoundationBasedMultiSelect';
