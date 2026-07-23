import React, { FunctionComponent } from 'react';
import { Control, Controller, FormState } from 'react-hook-form';
import { makeStyles, MenuItem, Select } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { CreateEventFormType, CreateEventRegisterOptions } from '../types';
import { FieldErrorType, eventCategoriesM3 } from '../../common/constants';

export type EventCategorySelectorProps = {
  formState: FormState<CreateEventFormType>;
  control: Control<CreateEventFormType>;
};

const useEventCategorySelectorStyles = makeStyles()(() => ({
  categorySelectDropdown: {
    display: 'flex',
    maxHeight: '300px',
  },
  categoryMenuItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingRight: '16px',
    width: '100%',
  },
}));

const EventCategorySelector: FunctionComponent<EventCategorySelectorProps> = ({
  formState,
  control,
}) => {
  const { errors } = formState;
  const { translate } = useTranslation();
  const {
    classes: { categorySelectDropdown, categoryMenuItem },
  } = useEventCategorySelectorStyles();

  const getCategoryHelperText = (): string | undefined => {
    if (errors.primaryEventType) {
      if (errors.primaryEventType.type === FieldErrorType.Required) {
        return translate('Tooltip.MissingFields');
      }
    }
    return undefined;
  };

  return (
    <Controller
      name='primaryEventType'
      control={control}
      rules={CreateEventRegisterOptions.primaryEventType}
      render={({ field }) => (
        <Select
          {...field}
          required
          SelectProps={{
            MenuProps: { classes: { list: categoryMenuItem, paper: categorySelectDropdown } },
          }}
          style={{ width: '100%' }}
          label={translate('Label.EECategory')}
          error={!!errors.primaryEventType}
          helperText={getCategoryHelperText()}>
          {eventCategoriesM3.map((eventType) => (
            <MenuItem key={eventType.label} value={eventType.value} className={categoryMenuItem}>
              {translate(eventType.label)}
            </MenuItem>
          ))}
        </Select>
      )}
    />
  );
};

export default EventCategorySelector;
