import { DatePicker, makeStyles, PickersUtilsProvider, TextField, TimePicker } from '@rbx/ui';
import { useEffect, useRef, useState } from 'react';

import { TODOFIXANY } from 'app/shared/types';

const combineTimestamps = (dateTimestamp: number, timeString: string) => {
  const date = new Date(dateTimestamp);

  // Extract hours and minutes from the time string
  const [time, ampm] = timeString.split(' ');
  let hours = time.split(':').map(Number)[0];
  const minutes = time.split(':').map(Number)[1];

  if (ampm?.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (ampm?.toUpperCase() === 'AM' && hours === 12) hours = 0; // Midnight case

  // Get year, month, and day from the date timestamp
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Create a new Date object with the combined values
  const combinedDate = new Date(year, month, day, hours, minutes, 0);

  return combinedDate;
};

const HHMMRegex = /^(0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM)$/i;

const isValidDate = (d: Date) => {
  return d instanceof Date && !Number.isNaN(d);
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);

  if (!isValidDate(date)) {
    return '';
  }

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours %= 12;
  hours = hours || 12; // the hour '0' should be '12'
  const strTime = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')} ${ampm}`;

  if (strTime.includes('NaN')) {
    return '';
  }

  return strTime;
};

interface KeyboardDatePickerCampaignConfigurationProps {
  dateInputName: string;
  disableInputs: boolean;
  disablePast?: boolean;
  formikInfo: TODOFIXANY;
  helperText?: string;
  inputModel: TODOFIXANY;
  minDate?: Date;
  onDateBlurCustom: () => void;
  onDateChangeCustom: (date: Date | null, inputName: string) => void;
  onTimeBlurCustom: () => void;
  onTimeChangeCustom: (date: Date | null, value: string | undefined, inputName: string) => void;
  timeInputName: string;
}

export const KeyboardDatePickerCampaignConfiguration = ({
  dateInputName,
  disableInputs = false,
  disablePast = true,
  formikInfo,
  helperText,
  inputModel,
  minDate,
  onDateBlurCustom,
  onDateChangeCustom,
  onTimeChangeCustom,
  timeInputName,
}: KeyboardDatePickerCampaignConfigurationProps) => {
  const now = new Date();
  const [isOpen, setIsOpen] = useState(false);
  const [strTime, setStrTime] = useState(
    formatTime(formikInfo.values[inputModel.formField[timeInputName].name] || now.getTime()),
  );

  useEffect(() => {
    const formikTimeValue = formikInfo.values[inputModel.formField[timeInputName].name];
    if (formikTimeValue) {
      const formattedTime = formatTime(formikTimeValue);
      if (formattedTime !== strTime) {
        setStrTime(formattedTime);
      }
    }
  }, [formikInfo.values[inputModel.formField[timeInputName].name]]);

  const {
    classes: { dateInput, timeInput },
  } = makeStyles()(() => ({
    dateInput: {
      marginTop: 20,
      width: 'calc(30% - 8px)',
    },

    timeInput: {
      marginTop: 20,
      width: 'calc(20% - 8px)',
    },
  }))();

  const onTimeInputChange = (ev: TODOFIXANY) => {
    const value = ev?.currentTarget?.value;
    const validTime = HHMMRegex.test(value);
    const timeFormikFieldName = timeInputName;

    formikInfo.setFieldTouched(timeInputName, true, true);

    // Let the form be invalid until the user enters a valid time
    if (validTime) {
      const date = new Date(formikInfo.values[dateInputName]) || null;
      const newDate = date ? combineTimestamps(date.getTime(), value) : null;
      onTimeChangeCustom(newDate, value, timeFormikFieldName);
      setStrTime(value);
    } else {
      setStrTime(value);
      // set the form data field to empty so the user can't submit the old time
      formikInfo.setFieldValue(timeFormikFieldName, undefined, true);
      formikInfo.setFieldError(timeFormikFieldName, 'Invalid time');
    }
  };

  const onTimePickerChange = (date: Date | null) => {
    if (!date || !isValidDate(date)) {
      return;
    }
    const formatted = formatTime(date.getTime());
    if (formatted) {
      setStrTime(formatted);
      formikInfo.setFieldTouched(timeInputName, true, true);
      onTimeChangeCustom(date, formatted, timeInputName);
    }
  };

  // Ref to bypass stale closure in @rbx/ui's renderInput wrapper
  const stateRef = useRef({ disableInputs, formikInfo, helperText, onTimeInputChange, strTime });
  stateRef.current = { disableInputs, formikInfo, helperText, onTimeInputChange, strTime };

  const dateValue = formikInfo.values[inputModel.formField[dateInputName].name];

  return (
    <PickersUtilsProvider>
      <DatePicker
        disabled={disableInputs}
        disablePast={disablePast}
        format='MMM dd, yyyy'
        label={inputModel.formField[dateInputName].label}
        minDate={minDate}
        onChange={(date) => onDateChangeCustom(date, dateInputName)}
        onClose={() => setIsOpen(false)}
        open={isOpen}
        openTo='day'
        renderInput={(params) => (
          <TextField
            data-testid={`date-input-${dateInputName}`}
            {...params}
            classes={{ root: dateInput }}
            error={stateRef.current.formikInfo.errors[timeInputName]}
            helperText={
              (stateRef.current.formikInfo.touched[dateInputName] &&
                stateRef.current.formikInfo.errors[dateInputName]) ||
              stateRef.current.helperText
            }
            id={inputModel.formField[dateInputName].name}
            inputProps={{ ...params.inputProps, placeholder: 'MM/DD/YYYY' }}
            label={inputModel.formField[dateInputName].label}
            onBlur={onDateBlurCustom}
            onClick={() => {
              if (stateRef.current.disableInputs) {
                return;
              }
              onDateBlurCustom();
              setIsOpen(true);
            }}
            variant='outlined'
          />
        )}
        value={dateValue ? new Date(dateValue) : null}
      />
      <TimePicker
        ampm
        format='hh:mm a'
        label={inputModel.formField[timeInputName].label}
        onChange={onTimePickerChange}
        renderInput={(params) => (
          <TextField
            classes={{ root: timeInput }}
            className={params.className}
            data-testid={`time-input-${timeInputName}`}
            disabled={stateRef.current.disableInputs}
            error={stateRef.current.formikInfo.errors[timeInputName]}
            helperText={
              (stateRef.current.formikInfo.touched[timeInputName] &&
                stateRef.current.formikInfo.errors[timeInputName]) ||
              stateRef.current.helperText
            }
            id={inputModel.formField[timeInputName].name}
            inputProps={{
              disabled: params?.inputProps?.disabled,
              onChange: stateRef.current.onTimeInputChange,
              placeholder: params?.inputProps?.placeholder,
              readOnly: params?.inputProps?.readOnly,
              type: params?.inputProps?.type,
              value: stateRef.current.strTime,
            }}
            inputRef={params.inputRef}
            label={inputModel.formField[timeInputName].label}
            type='time'
          />
        )}
        value={formikInfo.values[inputModel.formField[timeInputName].name]}
      />
    </PickersUtilsProvider>
  );
};
