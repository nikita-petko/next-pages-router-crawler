import type { FC, ForwardedRef, HTMLAttributes, JSXElementConstructor, ReactNode } from 'react';
import React, { forwardRef, useCallback, useMemo, useState } from 'react';
// TODO: Replace with `@rbx/ui` or `@rbx/foundation-ui` import — `ClickAwayListener` is not yet exported from either
import { ClickAwayListener } from '@mui/material';
import { DateRangePicker } from '@rbx/date-range-picker';
import type { Select } from '@rbx/ui';
import { Autocomplete, Button, Grid, TextField } from '@rbx/ui';
import type { TranslationKeyToFormattedText } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useLocale from '@modules/charts-generic/context/useLocale';
import { formatDateRangeForKey } from '@modules/charts-generic/utils/dateUtils';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { LabeledDateRange } from '../../types/LabeledDateRange';
import useLabeledDateRangeSelectorStyles from './LabeledDateRangeSelector.styles';

const DEFAULT_MAX_LOOKBACK_DAYS = 365;
const DEFAULT_INITIAL_LOOKBACK_DAYS = 7;

type DateRangeControlProps = {
  label: string;
  labeledDateRangeOptions: LabeledDateRange[];
  selectedOptions: LabeledDateRange[];
  onChange: (dateRange: LabeledDateRange | undefined) => void;
  translate: TranslationKeyToFormattedText;
  size?: React.ComponentProps<typeof Select>['size'];
  fullWidth?: React.ComponentProps<typeof Select>['fullWidth'];
  value: LabeledDateRange | undefined;
  allowEmpty?: boolean;
  minStartDateForCustomPicker?: Date;
};

/**
 * Custom listbox component for an Autocomplete that renders an additional component beneath the
 * Autocomplete options
 *
 * @param footer Component rendered under the listbox options
 * @param onClickAway Run when the user clicks out of the listbox popover
 * @returns A listbox component for the Webblox Autocomplete with the provided footer component
 */
const listboxComponent = (
  footer: React.JSX.Element,
  onClickAway: () => void,
  eventContainerClass?: string,
  customRangeContainerClass?: string,
  listboxClass?: string,
): JSXElementConstructor<HTMLAttributes<HTMLUListElement>> => {
  return forwardRef(function listboxComponentWithFooter(
    props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLUListElement>, HTMLUListElement> & {
      className?: string;
    },
    ref: ForwardedRef<HTMLDivElement>,
  ) {
    const { children, className, ...listProps } = props;
    // The ClickAwayListener is necessary to replace the close logic because the Blur event is
    // triggered when the user interacts with the footer, which closes the Popper by default
    return (
      <ClickAwayListener onClickAway={onClickAway}>
        <div ref={ref}>
          <div className={eventContainerClass}>
            <ul className={`${listboxClass} ${className}`} {...listProps}>
              {children}
            </ul>
          </div>
          <hr />
          <div className={customRangeContainerClass}>{footer}</div>
        </div>
      </ClickAwayListener>
    );
  });
};

/**
 * Autocomplete dropdown of labeled date ranges for use with time comparator charts. Includes a custom
 * date range picker that supports arbitrary date ranges.
 */
const LabeledDateRangeSelector: FC<DateRangeControlProps> = ({
  label,
  labeledDateRangeOptions,
  selectedOptions,
  onChange,
  translate,
  size,
  fullWidth,
  value,
  allowEmpty,
  minStartDateForCustomPicker,
}) => {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const effectiveMinStartDate = useMemo(
    () =>
      minStartDateForCustomPicker ??
      new Date(new Date().setDate(new Date().getDate() - DEFAULT_MAX_LOOKBACK_DAYS)),
    [minStartDateForCustomPicker],
  );
  const [customPickedStartTime, setCustomPickedStartTime] = useState(
    () =>
      value?.startTime ??
      new Date(new Date().setDate(new Date().getDate() - DEFAULT_INITIAL_LOOKBACK_DAYS)),
  );
  const [customPickedEndTime, setCustomPickedEndTime] = useState(
    () => value?.endTime ?? new Date(),
  );
  const {
    classes: {
      dateRangeSelect,
      dateRangeSelectPopperEventContainer,
      dateRangeSelectPopperCustomRangeContainer,
      dateRangeSelectorListbox,
    },
  } = useLabeledDateRangeSelectorStyles();

  const formatLabel = useCallback(
    (option: LabeledDateRange): string => {
      const dateRangeString = formatDateRangeForKey(locale, option.startTime, option.endTime);
      return option.label ? `${dateRangeString} (${option.label})` : dateRangeString;
    },
    [locale],
  );

  // Determine equality of two labeled date ranges
  const isOptionEqualToValue = useCallback(
    (range1: LabeledDateRange | undefined, range2: LabeledDateRange | undefined) => {
      return (
        range1?.label === range2?.label &&
        range1?.startTime?.valueOf() === range2?.startTime?.valueOf() &&
        range1?.endTime?.valueOf() === range2?.endTime?.valueOf()
      );
    },
    [],
  );

  // For disabling date ranges selected in one of the other pickers
  const isOptionAlreadySelected = useCallback(
    (option: LabeledDateRange) => {
      let selected = false;
      selectedOptions.forEach((range) => {
        if (isOptionEqualToValue(range, option) && !isOptionEqualToValue(range, value)) {
          selected = true;
        }
      });
      return selected;
    },
    [isOptionEqualToValue, selectedOptions, value],
  );

  const customDateSelector: ReactNode = useMemo(
    () => (
      <>
        <DateRangePicker
          endDate={customPickedEndTime}
          startDate={customPickedStartTime}
          onChangeStartDate={(date) => {
            if (date) {
              setCustomPickedStartTime(date);
            }
          }}
          onChangeEndDate={(date) => {
            if (date) {
              setCustomPickedEndTime(date);
            }
          }}
          minStartDate={effectiveMinStartDate}
          maxEndDate={new Date()}
          setDatePickerPopoverOpen={() => {}} // This doesn't actually control the popovers
          startDateLabel={translate(
            translationKey('Label.StartDate', TranslationNamespace.Analytics),
          )}
          endDateLabel={translate(translationKey('Label.EndDate', TranslationNamespace.Analytics))}
        />
        <Grid container justifyContent='end'>
          <Button
            size='small'
            color='secondary'
            onClick={() => {
              if (
                customPickedStartTime !== value?.startTime ||
                customPickedEndTime !== value?.endTime ||
                value?.label
              ) {
                onChange({ startTime: customPickedStartTime, endTime: customPickedEndTime });
              } else {
                setOpen(false);
              }
            }}>
            {translate(translationKey('Label.Ok', TranslationNamespace.Analytics))}
          </Button>
        </Grid>
      </>
    ),
    [
      customPickedEndTime,
      customPickedStartTime,
      effectiveMinStartDate,
      onChange,
      translate,
      value?.endTime,
      value?.label,
      value?.startTime,
    ],
  );

  const listboxWithFooter = useMemo(
    () =>
      listboxComponent(
        customDateSelector,
        () => setOpen(false),
        dateRangeSelectPopperEventContainer,
        dateRangeSelectPopperCustomRangeContainer,
        dateRangeSelectorListbox,
      ),
    [
      customDateSelector,
      dateRangeSelectPopperCustomRangeContainer,
      dateRangeSelectPopperEventContainer,
      dateRangeSelectorListbox,
    ],
  );

  return (
    <Autocomplete
      disableClearable={!allowEmpty}
      open={open}
      value={value}
      className={dateRangeSelect}
      data-testid='dateRangeSelector'
      disableCloseOnSelect
      onChange={(_, newValue) => {
        if ((!allowEmpty && !newValue) || isOptionEqualToValue(value, newValue ?? undefined)) {
          return;
        }
        onChange(newValue ?? undefined);
        setOpen(false);
      }}
      size={size}
      fullWidth={fullWidth}
      options={labeledDateRangeOptions}
      getOptionLabel={formatLabel}
      getOptionDisabled={(option) => isOptionAlreadySelected(option)}
      renderInput={(params) => {
        return <TextField {...params} label={label} onClick={() => setOpen(true)} />;
      }}
      isOptionEqualToValue={isOptionEqualToValue}
      ListboxComponent={listboxWithFooter}
    />
  );
};

export default LabeledDateRangeSelector;
