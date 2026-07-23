import React, {
  forwardRef,
  ForwardRefRenderFunction,
  useCallback,
  useState,
  useEffect,
} from 'react';
import {
  Select,
  MenuItem,
  TextField,
  DateTimePicker,
  PickersUtilsProvider,
  makeStyles,
  TDateTimePickerProps,
  Typography,
} from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/common/components';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation } from '@rbx/intl';
import { useLocale } from '@modules/charts-generic';
import { dateTimeFormatter } from '@rbx/core';

const calendarPickerViews = ['year', 'month', 'day', 'hours', 'minutes'] as const;

type SchedulingTimeSelectorProps = {
  value: Date | null;
  onChange: (value: Date | null) => void;
  onBlur?: () => void;
  error: boolean;
  helperText?: string;
  name?: string;
  minDate?: Date;
};

enum MenuItemValue {
  StartNow = 'start-now',
  ScheduleLater = 'schedule-later',
}

const useStyles = makeStyles()(() => ({
  scheduleForLaterMenuItem: {
    width: '100%',
  },
  dateTimePickerInput: {
    '& .MuiInputAdornment-root': {
      width: '48px',
    },
  },
}));

const SchedulingTimeSelector: ForwardRefRenderFunction<
  HTMLInputElement,
  SchedulingTimeSelectorProps
> = ({ value, onChange, onBlur, error = false, helperText, name, minDate }, ref) => {
  const {
    classes: { scheduleForLaterMenuItem, dateTimePickerInput },
  } = useStyles();
  const { translate } = useTranslationWrapper(useTranslation());
  const locale = useLocale();

  // Local state to remember the last selected date/time
  const [storedDateTime, setStoredDateTime] = useState<Date>(() => {
    if (value) {
      return value;
    }
    // Default to 1 hour from now
    const defaultDate = new Date();
    defaultDate.setHours(defaultDate.getHours() + 1);
    return defaultDate;
  });

  // Sync stored date with external value changes
  useEffect(() => {
    if (value) {
      setStoredDateTime(value);
    }
  }, [value]);

  const handleDateTimeChange = useCallback(
    (newDate: Date | null) => {
      if (newDate) {
        setStoredDateTime(newDate);
        onChange(newDate);
      }
    },
    [onChange],
  );

  const renderValue = useCallback(
    (v: unknown) => {
      if (v === MenuItemValue.StartNow) {
        return translate(
          translationKey(
            'Label.SchedulingOptions.StartNow',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      }

      if (v === MenuItemValue.ScheduleLater) {
        // Show the currently selected date if available, otherwise the stored date
        const displayDate = value || storedDateTime;
        return dateTimeFormatter(locale).getCustomDateTime(displayDate, {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
      }

      return translate(
        translationKey(
          'Label.SchedulingOptions.StartNow',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      );
    },
    [translate, value, storedDateTime, locale],
  );

  const handleStartNowClick = useCallback(() => {
    onChange(null);
  }, [onChange]);

  const handleScheduleLaterClick = useCallback(() => {
    // If no date is currently selected, use the stored date
    if (!value) {
      onChange(storedDateTime);
    }
  }, [value, storedDateTime, onChange]);

  const handleDatePickerContainerClick = useCallback(
    (event: React.MouseEvent | React.KeyboardEvent) => {
      event.stopPropagation();
      event.preventDefault();
    },
    [],
  );

  const renderInput: TDateTimePickerProps['renderInput'] = useCallback(
    (params: Parameters<NonNullable<TDateTimePickerProps['renderInput']>>[0]) => {
      const { inputProps, ...rest } = params;
      return (
        <TextField
          {...rest}
          fullWidth
          onBlur={onBlur}
          size='small'
          variant='outlined'
          label=''
          id='datetime-picker-input'
          data-testid='datetime-picker-input'
          classes={{ root: dateTimePickerInput }}
          inputProps={{
            ...inputProps,
            readOnly: true,
          }}
        />
      );
    },
    [dateTimePickerInput, onBlur],
  );

  return (
    <PickersUtilsProvider>
      <Select
        name={name}
        error={error}
        helperText={helperText}
        fullWidth
        variant='outlined'
        value={value ? MenuItemValue.ScheduleLater : MenuItemValue.StartNow}
        label={translate(
          translationKey('Label.StartTime', TranslationNamespace.UniverseConfigAndExperimentation),
        )}
        renderValue={renderValue}>
        <MenuItem onClick={handleStartNowClick} value={MenuItemValue.StartNow}>
          {translate(
            translationKey(
              'Label.SchedulingOptions.StartNow',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </MenuItem>
        <MenuItem onClick={handleScheduleLaterClick} value={MenuItemValue.ScheduleLater}>
          <Flex flexDirection='column' classes={{ root: scheduleForLaterMenuItem }}>
            <Typography marginBottom={1}>Later</Typography>
            {/** use a div container to stop click event from propagating so time picker can stay open */}
            <div
              onClick={handleDatePickerContainerClick}
              onMouseDown={handleDatePickerContainerClick}
              onKeyDown={handleDatePickerContainerClick}
              role='button'
              tabIndex={0}>
              <DateTimePicker
                value={storedDateTime}
                onChange={handleDateTimeChange}
                minDate={minDate}
                inputRef={ref}
                renderInput={renderInput}
                disablePast
                views={calendarPickerViews}
              />
            </div>
          </Flex>
        </MenuItem>
      </Select>
    </PickersUtilsProvider>
  );
};

export default forwardRef(SchedulingTimeSelector);
