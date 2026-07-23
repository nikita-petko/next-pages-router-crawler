import React, { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { TextField, InputAdornment, FormHelperText, CalendarMonthOutlinedIcon } from '@rbx/ui';
import { DateTimePicker, Popover, PopoverAnchor, PopoverContent } from '@rbx/foundation-ui';
import type { TDateTimePickerLabelsDualActions } from '@rbx/foundation-ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { getDateRangeLabel } from '@modules/ip/license-manager/utils/timeLimitedLicense';
import { MS_PER_DAY } from '../utils/constants';

function toMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export interface DateRangeSelectorProps {
  /** Controlled value: { startDate: Date | null, endDate: Date | null } */
  value?: { startDate: Date | null; endDate: Date | null };
  /** Called when user applies a new range */
  onChange?: (range: { startDate: Date | null; endDate: Date | null }) => void;
  /** Disable dates before today */
  disablePast?: boolean;
  /** Disable dates after today */
  disableFuture?: boolean;
  /** Max months in the past from today (only when disablePast is false) */
  maxLookbackMonths?: number;
  /** Max months in the future from today (only when disableFuture is false) */
  maxLookaheadMonths?: number;
  /** Label above the field (e.g. "Duration") */
  label?: string;
  /** Error text below the field; is shown over helper text */
  errorText?: string;
  /** Helper text below the field */
  helperText?: string;
  /** When true, helper text is shown as error */
  error?: boolean;
  /** When true, field is disabled */
  disabled?: boolean;
  /** When true, field is read-only */
  readOnly?: boolean;
  /** Custom render for the input (advanced) */
  renderInput?: (props: {
    onClick: () => void;
    value: string;
    placeholder: string;
    disabled?: boolean;
    readOnly?: boolean;
    error?: boolean;
  }) => React.ReactNode;
  /** Id for the input (for forms) */
  id?: string;
  /** When true, the input field spans the full width of its container (like TextField fullWidth) */
  fullWidth?: boolean;
  /** When true, show the number of days (inclusive) in the applied range in the field. Only shown after Apply. */
  showNumDaysInRange?: boolean;
  /** Passed through to the native input (e.g. react-hook-form `Controller`) */
  name?: string;
  onBlur?: () => void;
}

const DEFAULT_MAX_LOOKBACK_MONTHS = 3;
const DEFAULT_MAX_LOOKAHEAD_MONTHS = 3;

const DateRangeSelector = forwardRef<HTMLInputElement, DateRangeSelectorProps>(
  (
    {
      value,
      onChange,
      disablePast = false,
      disableFuture = false,
      maxLookbackMonths = DEFAULT_MAX_LOOKBACK_MONTHS,
      maxLookaheadMonths = DEFAULT_MAX_LOOKAHEAD_MONTHS,
      label,
      errorText,
      helperText,
      error = false,
      disabled = false,
      readOnly = false,
      renderInput,
      id,
      fullWidth = false,
      showNumDaysInRange = false,
      name,
      onBlur,
    },
    ref,
  ) => {
    const locale: Locale = useLocalization().locale ?? Locale.English;
    const { translate } = useTranslation();
    const [open, setOpen] = useState(false);
    const [committedValue, setCommittedValue] = useState<{
      startDate: Date | null;
      endDate: Date | null;
    }>(() => value ?? { startDate: null, endDate: null });

    useEffect(() => {
      if (value === undefined) {
        return;
      }
      if (value?.startDate && value?.endDate) {
        setCommittedValue({ startDate: value.startDate, endDate: value.endDate });
      } else if (value?.startDate == null && value?.endDate == null) {
        setCommittedValue({ startDate: null, endDate: null });
      }
    }, [value]);

    const minDate = useMemo(() => {
      if (disablePast) {
        return toMidnight(new Date());
      }
      const d = new Date();
      d.setMonth(d.getMonth() - maxLookbackMonths);
      return toMidnight(d);
    }, [disablePast, maxLookbackMonths]);

    const maxDate = useMemo(() => {
      if (disableFuture) {
        return toMidnight(new Date());
      }
      const d = new Date();
      d.setMonth(d.getMonth() + maxLookaheadMonths);
      return toMidnight(d);
    }, [disableFuture, maxLookaheadMonths]);

    const selectableDateRange = useMemo(
      () => ({ startDate: minDate, endDate: maxDate }),
      [minDate, maxDate],
    );

    const pickerLabels = useMemo<TDateTimePickerLabelsDualActions>(
      () => ({
        previousMonth: translate('Label.CalendarPreviousMonth'),
        nextMonth: translate('Label.CalendarNextMonth'),
        apply: translate('Action.Apply'),
        cancel: translate('Action.Cancel'),
        resetAll: translate('Action.ResetAll'),
      }),
      [translate],
    );

    const placeholder = translate('Label.DateRangePlaceholder');
    const resolvedLabel = label ?? translate('Label.LicenseDateRangeDefaultLabel');
    const popoverAriaLabel = translate('Label.DateRangePickerAriaLabel');

    const displayValue = useMemo(() => {
      const source =
        value !== undefined && value?.startDate != null && value?.endDate != null
          ? value
          : committedValue;
      const start = source?.startDate ?? null;
      const end = source?.endDate ?? null;
      if (!start || !end) {
        return '';
      }
      const dateRangeText = getDateRangeLabel(start, end, locale);
      if (!showNumDaysInRange) {
        return dateRangeText;
      }
      const startMidnight = toMidnight(start).getTime();
      const endMidnight = toMidnight(end).getTime();
      const numDays =
        Math.floor(
          (Math.max(endMidnight, startMidnight) - Math.min(endMidnight, startMidnight)) /
            MS_PER_DAY,
        ) + 1;
      const dayCountText =
        numDays === 1
          ? translate('Label.LicenseDateRangeNumDaysOne')
          : translate('Label.LicenseDateRangeNumDaysOther', { count: String(numDays) });
      return `${dateRangeText} (${dayCountText})`;
    }, [value, committedValue, showNumDaysInRange, locale, translate]);

    const handleOpen = useCallback(() => {
      if (disabled || readOnly) {
        return;
      }
      setOpen(true);
    }, [disabled, readOnly]);

    const handleOpenChange = useCallback((openValue: boolean) => {
      setOpen(openValue);
    }, []);

    const handlePickerChanged = useCallback(
      (start: Date | null, end: Date | null) => {
        if (!start || !end) {
          return;
        }
        const next = { startDate: start, endDate: end };
        setCommittedValue(next);
        onChange?.(next);
        setOpen(false);
      },
      [onChange],
    );

    const handlePickerCancel = useCallback(() => {
      setOpen(false);
    }, []);

    const defaultDatesForPicker = useMemo((): [Date] | [Date, Date] | null => {
      const source = value !== undefined && value?.startDate != null ? value : committedValue;
      const s = source?.startDate ?? null;
      const e = source?.endDate ?? null;
      if (s && e) {
        return [s, e];
      }
      if (s) {
        return [s];
      }
      return null;
    }, [value, committedValue]);

    const inputElement = renderInput ? (
      renderInput({
        onClick: handleOpen,
        value: displayValue,
        placeholder,
        disabled,
        readOnly,
        error,
      })
    ) : (
      <TextField
        id={id ?? 'date-range-selector'}
        name={name}
        inputRef={ref}
        fullWidth={fullWidth}
        variant='outlined'
        label={resolvedLabel}
        placeholder={placeholder}
        value={displayValue}
        onClick={handleOpen}
        onBlur={onBlur}
        onFocus={(e) => e.target.blur()}
        disabled={disabled}
        error={error}
        inputProps={{
          'aria-label': resolvedLabel || placeholder,
          readOnly: true,
        }}
        // eslint-disable-next-line react/jsx-no-duplicate-props -- InputProps (wrapper) and inputProps (native input) are distinct MUI TextField props
        InputProps={{
          endAdornment: (
            <InputAdornment position='end'>
              <CalendarMonthOutlinedIcon />
            </InputAdornment>
          ),
        }}
      />
    );

    const foundationLocale = locale as Parameters<typeof DateTimePicker>[0]['locale'];

    return (
      <div style={fullWidth ? { width: '100%' } : undefined}>
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverAnchor asChild>
            <div style={fullWidth ? { width: '100%' } : undefined}>{inputElement}</div>
          </PopoverAnchor>
          <PopoverContent side='bottom' align='end' sideOffset={4} ariaLabel={popoverAriaLabel}>
            {open ? (
              <DateTimePicker
                key={`${defaultDatesForPicker?.[0]?.getTime() ?? 's'}-${
                  defaultDatesForPicker?.[1]?.getTime() ?? 'e'
                }`}
                variant='Dual'
                labels={pickerLabels}
                locale={foundationLocale}
                defaultDates={defaultDatesForPicker}
                selectableDateRange={selectableDateRange}
                isDisabled={disabled}
                onChanged={handlePickerChanged}
                onCancel={handlePickerCancel}
              />
            ) : null}
          </PopoverContent>
        </Popover>
        {errorText && <FormHelperText error={error}>{errorText}</FormHelperText>}
        {!errorText && helperText && <FormHelperText>{helperText}</FormHelperText>}
      </div>
    );
  },
);

DateRangeSelector.displayName = 'DateRangeSelector';

export default DateRangeSelector;
