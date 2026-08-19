import { useState, useCallback } from 'react';
import { getFormattedDate, getFormattedNumber } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import {
  Select,
  MenuItem,
  Typography,
  Grid,
  DatePicker,
  PickersUtilsProvider,
  TextField,
} from '@rbx/ui';
import ExpirationTypes from '../../enums/ExpirationTypes';
import useExpirationDatePickerStyles from './ExpirationDatePicker.styles';

interface ExpirationDatePickerProps {
  onChange?: (date: Date | null) => void; // a null date is passed when user selects 'No expiration'
  initialDate?: Date | null;
}

const ExpirationDatePicker = ({ onChange, initialDate }: ExpirationDatePickerProps) => {
  const [date, setDate] = useState<Date | null>(initialDate ?? null);
  const [val, setVal] = useState<number>(
    initialDate ? ExpirationTypes.Custom : ExpirationTypes.NoExpiration,
  );
  const [open, setOpen] = useState<boolean>(false);

  const { translate } = useTranslation();

  const {
    classes: { inlineDatePicker },
  } = useExpirationDatePickerStyles();

  const onClose = useCallback(() => {
    setOpen(false);
  }, []);

  const onOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const addDays = (expirationType: ExpirationTypes) => {
    if (
      expirationType === ExpirationTypes.Custom ||
      expirationType === ExpirationTypes.NoExpiration
    ) {
      return null;
    }
    const today = new Date();
    return new Date(today.setDate(today.getDate() + expirationType));
  };

  const updateDate = useCallback(
    (newDate: Date | null) => {
      if (onChange) {
        onChange(newDate);
      }
      setDate(newDate);
    },
    [onChange],
  );

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newVal = event.target.value as ExpirationTypes;
    // call back every time a select item is clicked
    const newDate = addDays(newVal);
    updateDate(newDate); // set the date and call the onChange handler
    setVal(newVal as number);
  };

  const renderValue = (value: unknown) => {
    // render the selected value on change (UI facing)
    const expirationOption = value as ExpirationTypes;
    if (date) {
      return getFormattedDate(date);
    }

    if (expirationOption === ExpirationTypes.NoExpiration) {
      return translate('Label.NoExpiration');
    }
    if (expirationOption === ExpirationTypes.Custom) {
      return translate('Label.CustomExpiration');
    }
    return '';
  };

  // our inline date picker that will appear as a select item
  // wrap our date picker with a click listener to stop any click events from within the date picker from bubbling up
  // we don't want to trigger the parent SelectItem onClick listener and inadvertently re-force the state open once a date gets selected
  // (we want to auto-close our select dropdown after a date is picked, and not leave the dropdown open once a custom date is picked)
  // the event won't propagate = we should not get set to "custom" if the user clicks anywhere but the date picker
  // https://github.com/mui-org/material-ui-pickers/issues/1477
  const datePicker = (
    <Grid
      className={inlineDatePicker}
      onClick={(e: React.MouseEvent<Element>) => {
        e.stopPropagation();
      }}>
      <PickersUtilsProvider>
        <DatePicker
          disablePast
          format='MM/dd/yyyy'
          value={date ?? new Date(Date.now())}
          onChange={(newDate: Date | null) => {
            if (newDate) {
              setOpen(false); // close the select dropdown
              updateDate(newDate);
              setVal(ExpirationTypes.Custom); // set the value to custom when the user selects a date
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              id='expiration-date-picker'
              label={params.inputProps?.value}
              variant='outlined'
              inputProps={{
                'aria-label': 'expiration-date-picker',
              }}
            />
          )}
        />
      </PickersUtilsProvider>
    </Grid>
  );

  return (
    <Select
      SelectProps={{
        renderValue,
        onClose,
        onOpen,
        open,
      }}
      value={val}
      onChange={handleChange}
      fullWidth>
      <MenuItem value={ExpirationTypes.NoExpiration}>{translate('Label.NoExpiration')}</MenuItem>
      <MenuItem value={ExpirationTypes.Expire30Days}>
        {translate('Label.NDaysExpiration', { daysLastUsed: getFormattedNumber(30) })}
      </MenuItem>
      <MenuItem value={ExpirationTypes.Expire60Days}>
        {translate('Label.NDaysExpiration', { daysLastUsed: getFormattedNumber(60) })}
      </MenuItem>
      <MenuItem value={ExpirationTypes.Expire90Days}>
        {translate('Label.NDaysExpiration', { daysLastUsed: getFormattedNumber(90) })}
      </MenuItem>
      <MenuItem value={ExpirationTypes.Custom}>
        <Grid
          container
          direction='column'
          wrap='nowrap'
          onClick={(e: React.MouseEvent<Element>) => {
            e.stopPropagation();
          }}>
          <Typography> {translate('Label.CustomExpiration')} </Typography>
          {datePicker}
        </Grid>
      </MenuItem>
    </Select>
  );
};

// component will need to be rendered under the CreatorDashboard.OpenCloud namespace
export default ExpirationDatePicker;
