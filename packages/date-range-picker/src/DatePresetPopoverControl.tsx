import type { FC, ReactNode } from 'react';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const INTERACTABLE =
  'relative clip group/interactable focus-visible:outline-focus disabled:outline-none';

const FoundationStateLayer = () => (
  <div
    role='presentation'
    className='absolute inset-[0] transition-colors group-hover/interactable:bg-[var(--color-state-hover)] group-active/interactable:bg-[var(--color-state-press)] group-disabled/interactable:bg-none'
  />
);

const MENU_SHADOW = [
  'var(--size-0) var(--size-50) var(--size-100) -0.5px var(--alpha-color-shadow-subtle)',
  'var(--size-0) var(--size-250) var(--size-500) -0.75px var(--alpha-color-shadow-subtle)',
  'var(--size-0) var(--size-400) var(--size-800) -1px var(--alpha-color-shadow-subtle)',
  'var(--size-0) var(--size-1200) var(--size-1400) -1.5px var(--alpha-color-shadow-subtle)',
].join(', ');

/** A selectable preset row rendered in the popover menu. */
export type TDatePresetOption = {
  /** Stable identity for the React key. */
  key: string;
  /** Localized, user-facing label. */
  label: string;
  /** Whether this preset is the active selection (renders a check). */
  selected: boolean;
  /** Invoked when the row is chosen; the popover closes afterwards. */
  onSelect: () => void;
};

/** Helpers handed to `renderPicker` so the custom date view can control the popover. */
export type TDatePresetPopoverPickerHelpers = {
  /** Apply finished — close the whole popover. */
  closePopover: () => void;
  /** Cancel the picker — return to the preset list. */
  backToPresets: () => void;
};

export type DatePresetPopoverControlProps = {
  /** Label rendered above the trigger and used as its accessible name. */
  label: string;
  /** Current value text shown inside the trigger button. */
  triggerLabel: string;
  /** Preset rows shown at the top of the menu. */
  presets: readonly TDatePresetOption[];
  /**
   * When provided, a "custom" row is appended below the presets that opens the
   * date picker view returned by {@link renderPicker}. Omit to hide the row
   * (e.g. when custom dates are not supported).
   */
  customLabel?: string;
  /** Whether the custom row is the active selection (renders a check). */
  customSelected?: boolean;
  /** Extra classes applied to the outer wrapper (width, gutter margins, etc.). */
  className?: string;
  /** Renders the Foundation `DateTimePicker` for the custom date view. */
  renderPicker: (helpers: TDatePresetPopoverPickerHelpers) => ReactNode;
  /**
   * Base `data-testid` for the trigger button. When set, the custom row's
   * `data-testid` is derived as `` `${testId}CustomRow` ``. Defaults to
   * `'dateRangeSelector'` / `'dateRangeCustomRow'`. Override when rendering
   * multiple popover controls on the same page.
   */
  testId?: string;
};

/**
 * Shared popover shell for preset-driven date controls. Owns the trigger
 * button, the portalled menu of presets + optional custom row, and the swap
 * to a picker view for custom selection. Date-model wiring (range vs single)
 * lives in the thin wrappers that consume this component.
 */
const DatePresetPopoverControl: FC<DatePresetPopoverControlProps> = ({
  label,
  triggerLabel,
  presets,
  customLabel,
  customSelected = false,
  className,
  renderPicker,
  testId,
}) => {
  const triggerTestId = testId ?? 'dateRangeSelector';
  const customRowTestId = testId === undefined ? 'dateRangeCustomRow' : `${testId}CustomRow`;
  const [open, setOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const [contentPosition, setContentPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 0,
  });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) {
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    setContentPosition({
      top: rect.bottom,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(0, window.innerHeight - rect.bottom - 8),
    });
  }, []);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        updatePosition();
      }
      setOpen(isOpen);
      if (!isOpen) {
        setShowPicker(false);
      }
    },
    [updatePosition],
  );

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
      if (contentRef.current?.contains(target)) {
        return;
      }
      handleOpenChange(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open, handleOpenChange]);

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

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (showPicker) {
          setShowPicker(false);
        } else {
          handleOpenChange(false);
          triggerRef.current?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [open, showPicker, handleOpenChange]);

  const handlePresetSelect = useCallback(
    (onSelect: () => void) => {
      onSelect();
      handleOpenChange(false);
    },
    [handleOpenChange],
  );

  const closePopover = useCallback(() => {
    setOpen(false);
    setShowPicker(false);
  }, []);
  const backToPresets = useCallback(() => setShowPicker(false), []);

  return (
    <div className={`flex flex-col gap-small ${className ?? ''}`}>
      <span id={labelId} className='text-title-medium content-emphasis'>
        {label}
      </span>
      <button
        type='button'
        ref={triggerRef}
        aria-labelledby={labelId}
        aria-haspopup='listbox'
        aria-expanded={open ? 'true' : 'false'}
        data-testid={triggerTestId}
        onClick={() => handleOpenChange(!open)}
        className={`${INTERACTABLE} flex items-center justify-between gap-x-small width-full bg-none stroke-standard cursor-pointer radius-medium height-1000 padding-x-medium text-body-medium stroke-contrast-alpha content-default`}>
        <FoundationStateLayer />
        <div className='grow-1 text-truncate-split text-align-x-left'>
          <span>{triggerLabel}</span>
        </div>
        <span
          aria-hidden='true'
          className='size-500 icon content-default icon-regular-chevron-large-down'
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={contentRef}
            className='padding-y-small'
            style={{
              position: 'fixed',
              zIndex: 1050,
              top: contentPosition.top,
              left: contentPosition.left,
              maxHeight: contentPosition.maxHeight > 0 ? contentPosition.maxHeight : undefined,
            }}>
            {showPicker ? (
              <div
                className='bg-surface-200 radius-large overflow-clip'
                style={{ boxShadow: MENU_SHADOW }}>
                {renderPicker({ closePopover, backToPresets })}
              </div>
            ) : (
              <div
                className='bg-surface-100 stroke-standard stroke-default radius-large overflow-auto'
                style={{
                  boxShadow: MENU_SHADOW,
                  minWidth: contentPosition.width ? `${contentPosition.width}px` : undefined,
                  width: 'max-content',
                  maxHeight:
                    contentPosition.maxHeight > 0 ? contentPosition.maxHeight - 8 : undefined,
                }}>
                <div className='padding-small'>
                  {presets.map((preset) => (
                    <button
                      key={preset.key}
                      type='button'
                      onClick={() => handlePresetSelect(preset.onSelect)}
                      className={`${INTERACTABLE} flex items-center width-full padding-x-medium padding-y-small radius-medium text-body-medium cursor-pointer stroke-none bg-none text-align-x-left gap-x-medium`}>
                      <FoundationStateLayer />
                      <span className='grow-1 text-no-wrap text-truncate-split content-emphasis'>
                        {preset.label}
                      </span>
                      {preset.selected && (
                        <span
                          role='presentation'
                          className='grow-0 shrink-0 basis-auto icon icon-filled-check size-[var(--icon-size-medium)]'
                        />
                      )}
                    </button>
                  ))}
                  {customLabel !== undefined && (
                    <>
                      <hr className='margin-y-xsmall border-0 border-t border-stroke-default' />
                      <button
                        type='button'
                        onClick={() => setShowPicker(true)}
                        data-testid={customRowTestId}
                        className={`${INTERACTABLE} flex items-center width-full padding-x-medium padding-y-small radius-medium text-body-medium cursor-pointer stroke-none bg-none text-align-x-left gap-x-medium`}>
                        <FoundationStateLayer />
                        <span className='grow-1 text-no-wrap text-truncate-split content-emphasis'>
                          {customLabel}
                        </span>
                        {customSelected && (
                          <span
                            role='presentation'
                            className='grow-0 shrink-0 basis-auto icon icon-filled-check size-[var(--icon-size-medium)]'
                          />
                        )}
                        <span
                          aria-hidden='true'
                          className='size-400 icon content-muted icon-regular-chevron-large-right'
                        />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
};

export default DatePresetPopoverControl;
