import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Control, Controller, FormState, UseFormGetValues, UseFormTrigger } from 'react-hook-form';
import { DateTimePicker, Grid, PickersUtilsProvider, TextField, useMediaQuery } from '@rbx/ui';
import useCurrentEvent from '../../../hooks/useCurrentEvent';
import { CreateEventFormType, CreateEventRegisterOptions } from '../types';
import {
  FieldErrorType,
  maximumEventDurationMs,
  minimumEventDurationMs,
  maximumEventDurationDays,
  minimumEventDurationMinutes,
} from '../../common/constants';

export interface EventTimeSelectorGroupProps {
  formState: FormState<CreateEventFormType>;
  control: Control<CreateEventFormType>;
  isRunning: boolean | undefined;
  getValues: UseFormGetValues<CreateEventFormType>;
  trigger: UseFormTrigger<CreateEventFormType>;
}

const EventTimeSelectorGroup: FunctionComponent<
  React.PropsWithChildren<EventTimeSelectorGroupProps>
> = ({ formState, control, getValues, trigger }) => {
  const { errors } = formState;
  const { translate } = useTranslation();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const event = useCurrentEvent();

  const getStartTimeHelperText = useCallback((): string | undefined => {
    const error = formState.errors.startTime;
    if (error) {
      if (error.type === FieldErrorType.Required) {
        return translate('Tooltip.MissingFields');
      }
      if (error.type === FieldErrorType.Min) {
        return translate('Error.StartTimeInPast');
      }
      return translate('Tooltip.InvalidEventStartTime');
    }
    return undefined;
  }, [formState, translate]);

  const getEndTimeHelperText = useCallback((): string | undefined => {
    const error = formState.errors.endTime;
    if (error) {
      if (error.type === FieldErrorType.Min) {
        return translate('Error.EEDurationTooShort', {
          duration: `${minimumEventDurationMinutes}`,
        });
      }
      if (error.type === FieldErrorType.Max) {
        return translate('Error.EEDurationTooLong', { duration: `${maximumEventDurationDays}` });
      }
      if (error.type === FieldErrorType.Required) {
        return translate('Tooltip.MissingFields');
      }
      return translate('Tooltip.InvalidEventEndTime');
    }
    return undefined;
  }, [formState, translate]);

  const getMinEndTime = useCallback(() => {
    const startTime = getValues('startTime');
    const invalidStartTime = !(startTime instanceof Date) || Number.isNaN(startTime.getTime());
    if (invalidStartTime || new Date().getTime() > startTime.getTime() + minimumEventDurationMs) {
      // We default to the current time as the minimum if the start time is in the past or invalid
      return new Date();
    }
    return invalidStartTime ? undefined : new Date(startTime.getTime() + minimumEventDurationMs);
  }, [getValues]);

  const getMaxEndTime = useCallback(() => {
    const startTime = getValues('startTime');
    const invalidStartTime = !(startTime instanceof Date) || Number.isNaN(startTime.getTime());
    return invalidStartTime ? undefined : new Date(startTime.getTime() + maximumEventDurationMs);
  }, [getValues]);

  const startValidationRules = useMemo(() => {
    const isActive =
      event.eventDetails?.eventTime &&
      event.eventDetails.eventTime.startUtc &&
      event.eventDetails.eventTime.endUtc &&
      event.eventDetails.eventTime.startUtc < new Date() &&
      event.eventDetails.eventTime.endUtc > new Date();
    return CreateEventRegisterOptions.startTime(
      isActive,
      formState.dirtyFields.startTime,
      formState.dirtyFields.endTime,
    );
  }, [event, formState]);

  return (
    <Grid container direction={isCompactView ? 'column' : 'row'} spacing={isCompactView ? 3 : 2}>
      <Grid item XSmall={6}>
        <Controller
          name='startTime'
          control={control}
          rules={startValidationRules}
          render={({ field: { ref, onBlur, name, ...field } }) => (
            <PickersUtilsProvider>
              <DateTimePicker
                {...field}
                inputRef={ref}
                minDate={new Date()}
                onAccept={() => {
                  // Start time affects the validation for end time
                  trigger('startTime');
                  trigger('endTime');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    name={name}
                    onBlur={() => {
                      onBlur();
                      trigger('endTime');
                    }}
                    variant='outlined'
                    fullWidth
                    required
                    id='startTime'
                    label={translate('Label.StartTime')}
                    aria-label={translate('Label.StartTime')}
                    error={!!errors.startTime}
                    helperText={getStartTimeHelperText()}
                  />
                )}
              />
            </PickersUtilsProvider>
          )}
        />
      </Grid>
      <Grid item XSmall={6}>
        <Controller
          name='endTime'
          control={control}
          rules={CreateEventRegisterOptions.endTime(getValues('startTime'))}
          render={({ field: { ref, onBlur, name, ...field } }) => (
            <PickersUtilsProvider>
              <DateTimePicker
                {...field}
                inputRef={ref}
                minDate={getMinEndTime()}
                maxDate={getMaxEndTime()}
                onAccept={() => {
                  trigger('endTime');
                  trigger('startTime');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    name={name}
                    onBlur={() => {
                      onBlur();
                      trigger('startTime');
                    }}
                    fullWidth
                    required
                    variant='outlined'
                    label={translate('Label.EndTime')}
                    id='endTime'
                    aria-label={translate('Label.EndTime')}
                    error={!!errors.endTime}
                    helperText={getEndTimeHelperText()}
                  />
                )}
              />
            </PickersUtilsProvider>
          )}
        />
      </Grid>
    </Grid>
  );
};

export default EventTimeSelectorGroup;
