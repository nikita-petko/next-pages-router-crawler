import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DateRangeType,
  dateRangeStrings,
  dateRangeOffsetDays,
  useAnalyticsCurrentDateRangeBundle,
  formatDateRange,
  useLocale,
} from '@modules/charts-generic';
import { DateTimePicker } from '@rbx/foundation-ui';
import type { TDateRangePresetOption, TDateTimePickerLabelsDualActions } from '@rbx/foundation-ui';
import { subDays } from '@rbx/core';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

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

type ExploreModeDateRangeControlProps = {
  dateRangeOptions: DateRangeType[];
  className?: string;
};

const ExploreModeDateRangeControl: FC<ExploreModeDateRangeControlProps> = ({
  dateRangeOptions,
  className,
}) => {
  const locale = useLocale();
  const { translate } = useRAQIV2TranslationDependencies();
  const {
    rangeType,
    onChangeRangeType,
    startDate,
    endDate,
    minStartDate,
    maxEndDate,
    onChangeDateRangeParams,
  } = useAnalyticsCurrentDateRangeBundle();

  const [open, setOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const labelId = useRef(`date-range-label-${Math.random().toString(36).slice(2)}`).current;
  const [contentPosition, setContentPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 0,
  });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
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
      if (isOpen) updatePosition();
      setOpen(isOpen);
      if (!isOpen) setShowPicker(false);
    },
    [updatePosition],
  );

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (contentRef.current?.contains(target)) return;
      handleOpenChange(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open, handleOpenChange]);

  useEffect(() => {
    if (!open) return undefined;
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return undefined;
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

  const presetOptions = useMemo(
    () => dateRangeOptions.filter((t) => t !== DateRangeType.Custom),
    [dateRangeOptions],
  );

  const pickerPresets = useMemo<TDateRangePresetOption[]>(
    () =>
      presetOptions.map((type) => ({
        key: type,
        label: translate(dateRangeStrings[type]),
        getPresetRange: (): [Date, Date] => {
          const offset = dateRangeOffsetDays[type];
          if (offset <= 0) return [maxEndDate, maxEndDate];
          return [subDays(maxEndDate, offset - 1), maxEndDate];
        },
      })),
    [presetOptions, translate, maxEndDate],
  );

  const triggerLabel = useMemo(() => {
    if (rangeType === DateRangeType.Custom) {
      return formatDateRange(locale, startDate, endDate);
    }
    return translate(dateRangeStrings[rangeType]);
  }, [rangeType, locale, startDate, endDate, translate]);

  const handlePresetSelect = useCallback(
    (type: DateRangeType) => {
      onChangeRangeType(type);
      handleOpenChange(false);
    },
    [onChangeRangeType, handleOpenChange],
  );

  const handlePickerApply = useCallback(
    (start: Date | null, end: Date | null) => {
      if (!start || !end) {
        handleOpenChange(false);
        return;
      }
      const matchingPreset = presetOptions.find((type) => {
        const offset = dateRangeOffsetDays[type];
        if (offset <= 0) return false;
        const presetStart = subDays(maxEndDate, offset - 1);
        return (
          start.getFullYear() === presetStart.getFullYear() &&
          start.getMonth() === presetStart.getMonth() &&
          start.getDate() === presetStart.getDate() &&
          end.getFullYear() === maxEndDate.getFullYear() &&
          end.getMonth() === maxEndDate.getMonth() &&
          end.getDate() === maxEndDate.getDate()
        );
      });
      if (matchingPreset) {
        onChangeRangeType(matchingPreset);
      } else {
        onChangeDateRangeParams(start, end, DateRangeType.Custom);
      }
      handleOpenChange(false);
    },
    [presetOptions, maxEndDate, onChangeRangeType, onChangeDateRangeParams, handleOpenChange],
  );

  const dateRangeLabel =
    translate(translationKey('Label.DateRange', TranslationNamespace.Analytics)) || 'Date Range';

  const customLabel =
    translate(translationKey('Label.DateCustom', TranslationNamespace.Analytics)) ||
    'Custom date range';

  const pickerLabels = useMemo<TDateTimePickerLabelsDualActions>(
    () => ({
      previousMonth:
        translate(translationKey('Label.PreviousMonth', TranslationNamespace.Analytics)) ||
        'Previous month',
      nextMonth:
        translate(translationKey('Label.NextMonth', TranslationNamespace.Analytics)) ||
        'Next month',
      apply: translate(translationKey('Action.Apply', TranslationNamespace.Analytics)) || 'Apply',
      cancel:
        translate(translationKey('Action.Cancel', TranslationNamespace.Analytics)) || 'Cancel',
      resetAll:
        translate(translationKey('Action.ResetAll', TranslationNamespace.Analytics)) || 'Reset all',
    }),
    [translate],
  );

  return (
    <div className={`flex flex-col gap-small ${className ?? ''}`}>
      <span id={labelId} className='text-title-medium content-emphasis'>
        {dateRangeLabel}
      </span>
      <button
        type='button'
        ref={triggerRef}
        aria-labelledby={labelId}
        aria-haspopup='listbox'
        aria-expanded={open}
        onClick={() => handleOpenChange(!open)}
        className={`${INTERACTABLE} flex items-center justify-between width-full bg-none stroke-standard cursor-pointer radius-medium height-1000 padding-x-medium text-body-medium stroke-contrast-alpha content-default`}>
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
                <DateTimePicker
                  variant='Dual'
                  labels={pickerLabels}
                  locale={locale as Parameters<typeof DateTimePicker>[0]['locale']}
                  defaultDates={[startDate, endDate]}
                  selectableDateRange={{ startDate: minStartDate, endDate: maxEndDate }}
                  presets={pickerPresets}
                  onChanged={handlePickerApply}
                  onCancel={() => setShowPicker(false)}
                />
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
                  {presetOptions.map((type) => (
                    <button
                      key={type}
                      type='button'
                      onClick={() => handlePresetSelect(type)}
                      className={`${INTERACTABLE} flex items-center width-full padding-x-medium padding-y-small radius-medium text-body-medium cursor-pointer stroke-none bg-none text-align-x-left gap-x-medium`}>
                      <FoundationStateLayer />
                      <span className='grow-1 text-no-wrap text-truncate-split content-emphasis'>
                        {translate(dateRangeStrings[type])}
                      </span>
                      {rangeType === type && (
                        <span
                          role='presentation'
                          className='grow-0 shrink-0 basis-auto icon icon-filled-check size-[var(--icon-size-medium)]'
                        />
                      )}
                    </button>
                  ))}
                  <div
                    role='separator'
                    className='margin-y-xsmall'
                    style={{ borderTop: '1px solid var(--color-stroke-default)' }}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPicker(true)}
                    className={`${INTERACTABLE} flex items-center width-full padding-x-medium padding-y-small radius-medium text-body-medium cursor-pointer stroke-none bg-none text-align-x-left gap-x-medium`}>
                    <FoundationStateLayer />
                    <span className='grow-1 text-no-wrap text-truncate-split content-emphasis'>
                      {customLabel}
                    </span>
                    {rangeType === DateRangeType.Custom && (
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
                </div>
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ExploreModeDateRangeControl;
