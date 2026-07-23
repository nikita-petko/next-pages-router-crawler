import type { FC } from 'react';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TextInput, Icon } from '@rbx/foundation-ui';
import type { TLabelTooltipConfig, TTextInputSize } from '@rbx/foundation-ui';

const VIEWPORT_BOTTOM_PADDING = 16;
/**
 * Matches Foundation's `.foundation-web-portal-zindex` (Dialog / Dropdown /
 * Autocomplete portals). Inline `zIndex: 1000` sits under that layer, so a
 * portaled listbox opened inside a Dialog would render underneath the modal.
 */
const FOUNDATION_PORTAL_Z_INDEX = 1050;

/** Marker for portaled listboxes so host Dialogs can ignore outside dismiss. */
export const COMBOBOX_TYPEAHEAD_LISTBOX_ATTR = 'data-combobox-typeahead-listbox';

export function isComboboxTypeaheadListboxTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element && target.closest(`[${COMBOBOX_TYPEAHEAD_LISTBOX_ATTR}]`) !== null
  );
}

const dropdownPanelStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  zIndex: 1000,
  overflowY: 'auto',
  overflowX: 'hidden',
  scrollbarWidth: 'none',
  border: '1px solid var(--color-stroke-default)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
  marginTop: '4px',
  backgroundColor: 'var(--color-surface-100)',
};

type ComboboxTypeaheadRenderProps = {
  searchText: string;
  close: () => void;
};

export type ComboboxTypeaheadProps = {
  label?: string;
  /** Optional info-icon tooltip rendered beside the label by the underlying `TextInput`. */
  labelTooltip?: TLabelTooltipConfig;
  className?: string;
  placeholder: string;
  selectedLabel: string;
  hasResults: boolean;
  hasError?: boolean;
  error?: string;
  disabled?: boolean;
  isRequired?: boolean;
  size?: TTextInputSize;
  /**
   * When true, focus the underlying combobox `<input>` once after first
   * mount. Useful for surfaces (e.g. Explore mode) that auto-default
   * upstream state and want the user's caret to land on the next
   * required control.
   */
  autoFocus?: boolean;
  renderListboxInPortal?: boolean;
  onBlur?: () => void;
  children: (props: ComboboxTypeaheadRenderProps) => React.ReactNode;
};

const getOptions = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>('[role="option"]'));

const ACTIVE_OPTION_CLASS = 'bg-shift-200';

const ComboboxTypeahead: FC<ComboboxTypeaheadProps> = ({
  label,
  labelTooltip,
  className,
  placeholder,
  selectedLabel,
  hasResults,
  hasError,
  error,
  disabled,
  isRequired,
  size = 'Medium',
  autoFocus,
  renderListboxInPortal = false,
  onBlur,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
  const [portalPanelStyle, setPortalPanelStyle] = useState<React.CSSProperties | undefined>(
    undefined,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  // Stable id used to associate the combobox input with its listbox via
  // `aria-controls` (required by the WAI-ARIA combobox pattern).
  const listboxId = useId();
  // One-shot auto-focus. We snapshot the initial `autoFocus` value so a
  // later prop flip cannot re-grab focus from the user, and we run the
  // effect on every `disabled` transition so we can wait until the
  // underlying field is actually focusable (the typical caller renders
  // a disabled input while the dimension request is loading).
  const initialAutoFocusRef = useRef(autoFocus);
  const didAutoFocusRef = useRef(false);
  useEffect(() => {
    if (!initialAutoFocusRef.current || didAutoFocusRef.current) {
      return;
    }
    if (disabled || !containerRef.current) {
      return;
    }
    // Don't steal focus if the user already moved focus somewhere else
    // while the field was loading. `document.body` (the implicit
    // "nothing focused" state) and focus already inside this combobox
    // are both fine to override.
    const active = typeof document !== 'undefined' ? document.activeElement : null;
    if (active && active !== document.body && !containerRef.current.contains(active)) {
      didAutoFocusRef.current = true;
      return;
    }
    const input = containerRef.current.querySelector<HTMLInputElement>('input[role="combobox"]');
    if (!input || input.disabled) {
      return;
    }
    input.focus();
    didAutoFocusRef.current = true;
  }, [disabled]);

  const updatePanelGeometry = useCallback(() => {
    if (!containerRef.current) {
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const nextMaxHeight = window.innerHeight - rect.bottom - VIEWPORT_BOTTOM_PADDING;
    setMaxHeight(nextMaxHeight);
    if (renderListboxInPortal) {
      setPortalPanelStyle({
        position: 'fixed',
        top: rect.bottom,
        left: rect.left,
        right: 'auto',
        width: rect.width,
        maxHeight: nextMaxHeight,
        zIndex: FOUNDATION_PORTAL_Z_INDEX,
        // Modal Dialogs set `pointer-events: none` on `body`. Portaled listboxes
        // are body children, so they must opt back in or clicks fall through.
        pointerEvents: 'auto',
      });
    }
  }, [renderListboxInPortal]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    // Listen on `pointerdown` (not `mousedown`) so this dropdown closes when the
    // user activates a sibling combobox. A sibling's frame `onPointerDown` calls
    // `preventDefault()`, which suppresses the compatibility `mousedown` event —
    // a `mousedown` listener here would never fire and both dropdowns would stay
    // open and overlap. `pointerdown` still dispatches to this listener.
    const handler = (e: PointerEvent) => {
      if (
        e.target instanceof Node &&
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        !listboxRef.current?.contains(e.target)
      ) {
        setIsOpen(false);
        setSearchText('');
        onBlur?.();
      }
    };
    document.addEventListener('pointerdown', handler);
    updatePanelGeometry();
    if (renderListboxInPortal) {
      window.addEventListener('resize', updatePanelGeometry);
      window.addEventListener('scroll', updatePanelGeometry, true);
    }
    return () => {
      document.removeEventListener('pointerdown', handler);
      if (renderListboxInPortal) {
        window.removeEventListener('resize', updatePanelGeometry);
        window.removeEventListener('scroll', updatePanelGeometry, true);
      }
    };
  }, [isOpen, onBlur, renderListboxInPortal, updatePanelGeometry]);

  useEffect(() => {
    if (!isOpen || !containerRef.current) {
      return;
    }
    updatePanelGeometry();
  }, [isOpen, updatePanelGeometry]);

  useEffect(() => {
    if (!listboxRef.current) {
      return;
    }
    const options = getOptions(listboxRef.current);
    options.forEach((el, i) => {
      el.classList.toggle(ACTIVE_OPTION_CLASS, i === activeIndex);
    });
    if (activeIndex >= 0 && options[activeIndex]) {
      options[activeIndex].scrollIntoView?.({ block: 'nearest' });
    }
  }, [activeIndex, isOpen, hasResults, searchText]);

  const close = useCallback(() => {
    setIsOpen(false);
    setSearchText('');
    setActiveIndex(-1);
    onBlur?.();
  }, [onBlur]);

  const renderedOptions = children({ searchText, close });
  const hasVisibleOptions = React.Children.count(renderedOptions) > 0;

  // Reset the keyboard-highlighted option when the query changes or when the
  // visible option set empties out. We derive this during render by comparing
  // against the previous values rather than mirroring it in an effect: the
  // store-previous-value pattern is React's recommended way to adjust state
  // from changing inputs and avoids the extra render pass (and stale highlight
  // frame) that a setState-in-effect would introduce.
  const [prevSearchText, setPrevSearchText] = useState(searchText);
  const [prevHasVisibleOptions, setPrevHasVisibleOptions] = useState(hasVisibleOptions);
  if (prevSearchText !== searchText || prevHasVisibleOptions !== hasVisibleOptions) {
    setPrevSearchText(searchText);
    setPrevHasVisibleOptions(hasVisibleOptions);
    if (prevSearchText !== searchText || !hasVisibleOptions) {
      setActiveIndex(-1);
    }
  }

  const listbox =
    isOpen && hasResults && hasVisibleOptions ? (
      <div
        ref={listboxRef}
        id={listboxId}
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a custom popup listbox with arbitrary rendered children cannot use <select>; this is the standard WAI-ARIA listbox pattern.
        role='listbox'
        {...(renderListboxInPortal ? { [COMBOBOX_TYPEAHEAD_LISTBOX_ATTR]: '' } : {})}
        className={renderListboxInPortal ? 'radius-medium pointer-events-auto' : 'radius-medium'}
        style={{
          ...dropdownPanelStyle,
          ...(renderListboxInPortal ? portalPanelStyle : { maxHeight }),
        }}>
        {renderedOptions}
      </div>
    ) : null;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        close();
        e.currentTarget.blur();
        return;
      }

      if (e.key === 'Tab') {
        close();
        return;
      }

      if (!listboxRef.current) {
        return;
      }
      const count = getOptions(listboxRef.current).length;
      if (count === 0) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev < count - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : count - 1));
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        const options = getOptions(listboxRef.current);
        options[activeIndex]?.click();
      }
    },
    [close, activeIndex],
  );

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative' }}
      onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => {
        if (disabled || !containerRef.current) {
          return;
        }
        if (e.target instanceof Node && listboxRef.current?.contains(e.target)) {
          return;
        }

        const comboboxInput =
          containerRef.current.querySelector<HTMLInputElement>('input[role="combobox"]');
        if (!comboboxInput || e.target === comboboxInput) {
          return;
        }

        e.preventDefault();
        if (isOpen) {
          close();
          comboboxInput.blur();
          return;
        }

        setIsOpen(true);
        setSearchText('');
        setActiveIndex(-1);
        comboboxInput.focus();
      }}>
      <TextInput
        label={label}
        labelTooltip={labelTooltip}
        size={size}
        placeholder={placeholder}
        value={isOpen ? searchText : selectedLabel}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setSearchText(e.target.value);
          if (!isOpen) {
            setIsOpen(true);
          }
        }}
        onFocus={() => {
          if (disabled) {
            return;
          }
          setIsOpen(true);
          setSearchText('');
        }}
        onKeyDown={handleKeyDown}
        trailingIconName='icon-regular-chevron-large-down'
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role, jsx-a11y/interactive-supports-focus -- TextInput renders a focusable <input>; role/aria-expanded establish the WAI-ARIA combobox pattern.
        role='combobox'
        aria-expanded={isOpen && hasResults && hasVisibleOptions}
        aria-controls={isOpen && hasResults && hasVisibleOptions ? listboxId : undefined}
        tabIndex={0}
        autoComplete='off'
        hasError={hasError}
        error={error}
        isDisabled={disabled}
        isRequired={isRequired}
      />
      {listbox &&
        (renderListboxInPortal && typeof document !== 'undefined'
          ? createPortal(listbox, document.body)
          : listbox)}
    </div>
  );
};

export default ComboboxTypeahead;

const OPTION_CLASS_NAME =
  'flex items-center justify-between padding-x-medium height-1000 cursor-pointer text-body-medium content-default radius-small hover:bg-shift-200 transition-colors';

export type ComboboxTypeaheadOptionProps = {
  label: string;
  isSelected: boolean;
  onClick: () => void;
};

export const ComboboxTypeaheadOption: FC<ComboboxTypeaheadOptionProps> = ({
  label: optionLabel,
  isSelected,
  onClick,
}) => (
  <div
    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a listbox option with rich content (label + check icon) cannot use a native <option>; this is the standard WAI-ARIA listbox option pattern paired with the role="listbox" container above.
    role='option'
    aria-selected={isSelected}
    tabIndex={-1}
    className={OPTION_CLASS_NAME}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}>
    <span className='text-truncate-split'>{optionLabel}</span>
    {isSelected && <Icon name='icon-filled-check' size='Medium' />}
  </div>
);
