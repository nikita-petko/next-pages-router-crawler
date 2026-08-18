import {
  DateTimePicker,
  Popover,
  PopoverAnchor,
  PopoverContent,
  supportedLocales,
  TextInput,
  type TSelectableDateRange,
  type TSupportedLocale,
} from '@rbx/foundation-ui';
import { forwardRef, useMemo, useState } from 'react';

/**
 * Which half of the calendar is selectable, mirroring the `disablePast` /
 * `disableFuture` pair the MUI pickers used.
 */
type DateFieldDirection = 'Future' | 'Past';

/**
 * Foundation's DateTimePicker derives its upper bound from `selectableDateRange`
 * and falls back to *today* when the prop is omitted, so a future window needs an
 * explicit end date or every upcoming day renders disabled. Ten years clears
 * every scheduling horizon in the product.
 */
const FUTURE_WINDOW_YEARS = 10;

const startOfToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const isSupportedLocale = (locale?: string | null): locale is TSupportedLocale =>
  !!locale && (supportedLocales as readonly string[]).includes(locale);

interface DateFieldProps {
  dataTestId?: string;
  /** Selectable half of the calendar. Defaults to `'Future'`. */
  direction?: DateFieldDirection;
  /** Validation message. Rendered in place of `helperText` when present. */
  error?: string;
  helperText?: string;
  id?: string;
  isDisabled?: boolean;
  label: string;
  /**
   * Locale used to format the displayed date and the calendar's month and
   * weekday names. Falls back to the browser locale.
   */
  locale?: string | null;
  /** Latest selectable date. Only meaningful when `direction` is `'Future'`. */
  maxDate?: Date;
  /**
   * Earliest selectable date. Only meaningful when `direction` is `'Future'`,
   * where it composes with the implicit "not in the past" bound: the later of
   * the two wins, as it did under MUI's `disablePast` + `minDate` pair.
   */
  minDate?: Date;
  nextMonthLabel: string;
  onBlur?: () => void;
  onChange: (date: Date | null) => void;
  /** Text shown when no date is selected. */
  placeholder?: string;
  previousMonthLabel: string;
  value: Date | null;
}

/**
 * Date input backed by Foundation's DateTimePicker.
 *
 * Foundation ships the calendar as a bare panel with no trigger, input, label or
 * helper text, so this pairs it with a read-only TextInput inside a Popover to
 * reproduce what MUI's DatePicker rendered as one component.
 *
 * Deals only in local-midnight Dates, exactly like MUI's date adapter did.
 * Callers own any timezone conversion, so scheduling forms keep interpreting the
 * chosen day in the campaign's timezone rather than the browser's.
 */
const DateField = forwardRef<HTMLInputElement, DateFieldProps>(
  (
    {
      dataTestId,
      direction = 'Future',
      error,
      helperText,
      id,
      isDisabled = false,
      label,
      locale,
      maxDate,
      minDate,
      nextMonthLabel,
      onBlur,
      onChange,
      placeholder,
      previousMonthLabel,
      value,
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const resolvedLocale = useMemo<TSupportedLocale | undefined>(() => {
      if (isSupportedLocale(locale)) {
        return locale;
      }
      const browserLocale = typeof navigator === 'undefined' ? undefined : navigator.language;
      return isSupportedLocale(browserLocale) ? browserLocale : undefined;
    }, [locale]);

    const displayValue = useMemo<string>(() => {
      if (!value || Number.isNaN(value.getTime())) {
        return '';
      }
      return new Intl.DateTimeFormat(resolvedLocale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(value);
    }, [resolvedLocale, value]);

    // Omitting the range entirely is what gives us `disableFuture`: Foundation
    // then allows every date up to today with no lower bound.
    const selectableDateRange = useMemo<TSelectableDateRange | undefined>(() => {
      if (direction === 'Past') {
        return undefined;
      }
      const today = startOfToday();
      const start = minDate && minDate > today ? minDate : today;
      const end =
        maxDate ??
        new Date(start.getFullYear() + FUTURE_WINDOW_YEARS, start.getMonth(), start.getDate());
      return { endDate: end, startDate: start };
    }, [direction, maxDate, minDate]);

    // `defaultDates` is read once on mount and a value outside the selectable
    // window would be snapped, so only hand the panel a date it can actually
    // select and let the input keep displaying the stored one.
    const panelDate = useMemo<Date | null>(() => {
      if (!value || Number.isNaN(value.getTime())) {
        return null;
      }
      return value;
    }, [value]);

    return (
      <Popover onOpenChange={setIsOpen} open={isOpen}>
        <PopoverAnchor asChild>
          {/*
           * The click handler sits on the wrapper rather than on the input.
           * Foundation renders the trailing glyph as a sibling of the input, so a
           * handler bound to the input alone never sees a click on the calendar
           * icon. The input stays the only focusable control and owns the
           * keyboard path, which is why the wrapper is marked presentational.
           */}
          <div
            className='width-full'
            onClick={isDisabled ? undefined : () => setIsOpen(true)}
            role='presentation'>
            {/*
             * The input is the control rather than a PopoverTrigger: `asChild`
             * merges `type='button'` onto it, which drops it out of the textbox
             * role and renames the field to its own value. The trailing icon is
             * decorative so the field keeps exactly one accessible name.
             */}
            <TextInput
              aria-expanded={isOpen}
              aria-haspopup='dialog'
              // TextInput interpolates `className` into its wrapper without a
              // guard, so omitting it renders a literal "undefined" class.
              className=''
              data-testid={dataTestId}
              error={error}
              hasError={!!error}
              helperText={error ? undefined : helperText}
              id={id}
              isDisabled={isDisabled}
              label={label}
              onBlur={onBlur}
              onKeyDown={(event) => {
                if (isDisabled || (event.key !== 'Enter' && event.key !== ' ')) {
                  return;
                }
                event.preventDefault();
                setIsOpen(true);
              }}
              placeholder={placeholder}
              readOnly
              ref={ref}
              size='Medium'
              trailingIconName='icon-regular-calendar'
              value={displayValue}
            />
          </div>
        </PopoverAnchor>
        <PopoverContent align='start' ariaLabel={label}>
          <DateTimePicker
            // The panel reads `defaultDates` only on mount, so remounting is what
            // keeps it in sync when the form value changes underneath it.
            defaultDates={panelDate}
            hasActions={false}
            key={panelDate ? panelDate.toISOString() : 'empty'}
            labels={{ nextMonth: nextMonthLabel, previousMonth: previousMonthLabel }}
            locale={resolvedLocale}
            onChanged={(date) => {
              onChange(date);
              setIsOpen(false);
            }}
            selectableDateRange={selectableDateRange}
          />
        </PopoverContent>
      </Popover>
    );
  },
);

DateField.displayName = 'DateField';

export default DateField;
