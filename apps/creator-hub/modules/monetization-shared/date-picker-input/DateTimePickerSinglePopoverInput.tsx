/**
 * NOTE(@jeminpark): This is only a temporary input component due to a missing DateTimePicker input component
 * in foundation web. We will be replacing this with an official DateTimePicker input component in the future.
 */
import { useCallback, useState } from 'react';
import {
  clsx,
  DateTimePicker,
  Popover,
  PopoverTrigger,
  PopoverContent,
  type TDateTimePickerSingleProps,
  type TDateTimePickerLabelsNav,
  TSupportedLocale,
} from '@rbx/foundation-ui';
import {
  interactable,
  StateLayer,
  disabledOpacity,
  useId,
  dropdownSizes,
  inputVariants,
  ICON_SIZE_CLASS_BY_SIZE,
  PADDING_X_CLASS_BY_SIZE,
  LABEL_CLASS_BY_SIZE,
  TEXT_CLASS_BY_SIZE,
  GAP_CLASS_BY_SIZE,
  DROPDOWN_RADIUS_CLASS_BY_SIZE,
  HEIGHT_CLASS_BY_SIZE,
  BACKGROUND_CLASS_BY_INPUT_VARIANT,
  STROKE_CLASS_BY_INPUT_VARIANT,
} from '../lib/foundation-base-shared';
import type { TDropdownSize, TInputVariant } from '../lib/foundation-base-shared';
import { useSupportedLocale } from './useSupportedLocale';

export const datePickerInputSizes = dropdownSizes;
export type TDatePickerInputSize = TDropdownSize;
export const datePickerInputVariants = inputVariants;
export type TDatePickerInputVariant = TInputVariant;

/** Props that control the trigger input's appearance and accessibility. */
export type TDatePickerInputTriggerProps = {
  /**
   * Visible label rendered above the input. Also used as the accessible name
   * via `aria-labelledby` when no explicit `aria-label` / `aria-labelledby`
   * is provided.
   *
   * At least one of `label`, `aria-label`, or `aria-labelledby` is required.
   */
  label?: string;
  /**
   * Accessible label for screen readers. Takes precedence over `label` when
   * both are provided.
   */
  'aria-label'?: string;
  /**
   * ID of an external element that labels this input. Takes precedence over
   * `label` when both are provided.
   */
  'aria-labelledby'?: string;
  /** Placeholder text shown when no date is selected. */
  placeholder: string;
  /** Input size. Affects height, padding, font size and icon size. @default 'Medium' */
  size?: TDatePickerInputSize;
  /** Input visual variant. @default 'Standard' */
  variant?: TDatePickerInputVariant;
  /** Whether the input is disabled. */
  disabled?: boolean;
  /** Display error styling on the input stroke. */
  hasError?: boolean;
  /** Helper / hint text rendered below the input. */
  hint?: string;
  /** Additional CSS class applied to the outermost wrapper. */
  className?: string;
  /**
   * Custom formatter for displaying the selected date in the trigger.
   * Receives the currently selected `Date` and should return a display string.
   * Falls back to `Date.prototype.toLocaleDateString()` when omitted.
   */
  formatDate?: (date: Date) => string;
};

/** Props forwarded to the Foundation DateTimePicker (single variant). */
export type TDatePickerDateTimePickerProps = {
  /** The currently selected date (controlled). `null` means no selection. */
  value: Date | null;
  /** Called when the user selects or clears a date. */
  onChange: (value: Date | null) => void;
  /**
   * Constrains which dates are selectable. Dates outside this range are
   * visually disabled in the picker.
   */
  selectableDateRange?: TDateTimePickerSingleProps['selectableDateRange'];
  /**
   * Locale forwarded to the Foundation DateTimePicker for month / weekday
   * names and first-day-of-week. Falls back to the @rbx/intl locale or browser locale.
   */
  locale?: TSupportedLocale;
  /**
   * Localized labels for the DateTimePicker's internal UI (navigation
   * buttons, actions). Required so the picker contains no hardcoded strings.
   */
  dateTimePickerLabels: TDateTimePickerLabelsNav;
  /**
   * Accessible label applied to the popover container for screen readers.
   * Should describe the purpose of the picker (e.g. "Select a date").
   */
  popoverAriaLabel: string;
};

export type TDateTimePickerSinglePopoverInputProps = TDatePickerInputTriggerProps &
  TDatePickerDateTimePickerProps & {
    ref?: React.Ref<HTMLButtonElement>;
  };

export function DateTimePickerSinglePopoverInput({
  ref,
  // Input trigger props
  label,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  placeholder,
  size = 'Medium',
  variant = 'Standard',
  disabled: isDisabled,
  hasError,
  hint,
  className,
  formatDate,

  // DateTimePicker props
  value,
  onChange,
  selectableDateRange,
  locale: localeOverride,
  dateTimePickerLabels,
  popoverAriaLabel,
}: TDateTimePickerSinglePopoverInputProps) {
  // NOTE: we're overriding this for now as the foundation DateTimePicker doesn't support all @rbx/intl locales
  const locale: TSupportedLocale | undefined = useSupportedLocale(localeOverride);

  const labelId = useId(':datepicker-label');
  const [open, setOpen] = useState(false);

  const hasSelection = value !== null;
  const displayValue = hasSelection
    ? (formatDate?.(value) ??
      value.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }))
    : undefined;

  const handleTriggerKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setOpen(true);
    }
  }, []);

  const handleChange = useCallback(
    (date: Date | null) => {
      onChange(date);
      setOpen(false);
    },
    [onChange],
  );

  return (
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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={isDisabled}>
          <button
            type='button'
            ref={ref}
            disabled={isDisabled}
            aria-labelledby={label && !ariaLabelledBy && !ariaLabel ? labelId : ariaLabelledBy}
            aria-label={ariaLabel}
            aria-haspopup='dialog'
            aria-expanded={open}
            onKeyDown={handleTriggerKeyDown}
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
              <span>{displayValue ?? placeholder}</span>
            </div>
            <span
              aria-hidden='true'
              className={clsx(
                ICON_SIZE_CLASS_BY_SIZE[size],
                'icon content-default',
                size === 'XSmall' ? 'icon-filled-calendar' : 'icon-regular-calendar',
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side='bottom'
          align='center'
          ariaLabel={popoverAriaLabel}
          className='width-full'>
          <DateTimePicker
            variant='Single'
            hasActions={false}
            labels={dateTimePickerLabels}
            locale={locale}
            defaultDates={value}
            selectableDateRange={selectableDateRange}
            onChanged={handleChange}
          />
        </PopoverContent>
      </Popover>
      {hint && <span className='text-caption-small content-default'>{hint}</span>}
    </div>
  );
}

DateTimePickerSinglePopoverInput.displayName = 'DateTimePickerSinglePopoverInput';

export default DateTimePickerSinglePopoverInput;
