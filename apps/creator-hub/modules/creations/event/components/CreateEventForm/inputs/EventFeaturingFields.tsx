import { useQuery } from '@tanstack/react-query';
import type { FunctionComponent } from 'react';
import React, { useEffect, useMemo, useState } from 'react';
import type {
  Control,
  FormState,
  UseFormGetValues,
  UseFormSetValue,
  UseFormTrigger,
} from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import { Grid, Link, Switch, TextField, Tooltip, Typography } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import usersClient from '@modules/clients/users';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import {
  experienceEventsLearnMoreLink,
  featuringDelayGracePeriodHours,
  FieldErrorType,
  maxTaglineLength,
  minTimeOffsetForFeaturingDays,
} from '../../common/constants';
import type { CreateEventFormType } from '../types';
import { CreateEventRegisterOptions } from '../types';

const AGE_13_OR_OVER_AGE_BRACKET = 0;
const REQUIRED_START_TIME_OFFSET_MS = minTimeOffsetForFeaturingDays * 24 * 60 * 60 * 1000;
const DELAY_GRACE_PERIOD_MS = featuringDelayGracePeriodHours * 60 * 60 * 1000;

export interface EventExternalMarketingFieldsProps {
  formState: FormState<CreateEventFormType>;
  initialStartTime: Date | undefined;
  control: Control<CreateEventFormType>;
  getValues: UseFormGetValues<CreateEventFormType>;
  setValue: UseFormSetValue<CreateEventFormType>;
  trigger: UseFormTrigger<CreateEventFormType>;
}

const EventFeaturingFields: FunctionComponent<
  React.PropsWithChildren<EventExternalMarketingFieldsProps>
> = ({ formState, initialStartTime, control, getValues, setValue, trigger }) => {
  const { translate, translateHTML } = useTranslation();
  const { errors } = formState;
  // This is used to remember the state of the toggle before start time validation overrides
  const [lastUserToggledStatus, setLastUserToggledStatus] = useState(
    getValues('featuringOptInStatus'),
  );
  const { user } = useAuthentication();
  const { params: ixpParams, isFetched: isIxpFetched } = useIXPParameters(
    IXPLayers.CreatorDashboard,
  );

  const { data: getAgeBracketResponse, isLoading } = useQuery({
    queryFn: async () => usersClient.getAgeBracket(),
    queryKey: ['getAgeBracket', user?.id],
    refetchOnMount: true,
  });

  const getTaglineHelperText = (): string | undefined => {
    if (formState.errors.tagline && formState.errors.tagline.type === FieldErrorType.Required) {
      return translate('Tooltip.MissingFields');
    }
    if (formState.errors.tagline && !(formState.errors.tagline.type === FieldErrorType.MaxLength)) {
      return translate('Tooltip.InvalidTagline');
    }
    return `${getValues('tagline')?.length ?? 0}/${maxTaglineLength}`;
  };

  const startTimeValidationMessage = useMemo(() => {
    const startTimeCutoff = new Date(Date.now() + REQUIRED_START_TIME_OFFSET_MS);
    // Any changes are allowed if start time is beyond the required buffer
    if (getValues('startTime') > startTimeCutoff) {
      return '';
    }
    // If featuring hasn't already been requested and it's within the cutoff, disable the toggle
    if (
      !initialStartTime ||
      (!formState.dirtyFields.featuringOptInStatus && !getValues('featuringOptInStatus'))
    ) {
      return translate('Label.EEFeaturingEventStartsTooSoon', {
        number: minTimeOffsetForFeaturingDays.toString(),
      });
    }
    // If no changes have been made to the start time and featuring was already requested, other updates are fine
    if (!formState.dirtyFields.startTime) {
      return '';
    }
    // Delays > 24h are not allowed for events within 14 days
    if (
      initialStartTime &&
      getValues('startTime').getTime() - initialStartTime.getTime() > DELAY_GRACE_PERIOD_MS
    ) {
      return translate('Label.EEFeaturingDelayTooLong');
    }
    // Moving the start time earlier for events within 14 days is not allowed
    if (
      initialStartTime &&
      initialStartTime < startTimeCutoff &&
      getValues('startTime') < initialStartTime
    ) {
      return translate('Label.EEFeaturingEventMovedEarlier');
    }
    return '';
  }, [getValues, formState, initialStartTime, translate]);

  useEffect(() => {
    if (startTimeValidationMessage) {
      setValue('featuringOptInStatus', false, { shouldDirty: true });
    } else {
      setValue('featuringOptInStatus', lastUserToggledStatus, { shouldDirty: true });
    }
  }, [lastUserToggledStatus, setValue, startTimeValidationMessage]);

  const startTimeValidationFailed = useMemo(() => {
    return startTimeValidationMessage !== '';
  }, [startTimeValidationMessage]);

  if (
    isLoading ||
    !isIxpFetched ||
    !ixpParams?.enableEventRequestFeaturing ||
    getAgeBracketResponse?.ageBracket !== AGE_13_OR_OVER_AGE_BRACKET
  ) {
    return;
  }

  return (
    <Tooltip title={startTimeValidationMessage} arrow>
      <Grid gap='14px' display='flex' flexDirection='column'>
        <Grid>
          <Grid display='flex' alignItems='center'>
            <Controller
              name='featuringOptInStatus'
              control={control}
              disabled={startTimeValidationFailed}
              render={({ field }) => (
                <Switch
                  {...field}
                  disabled={startTimeValidationFailed}
                  checked={field.value}
                  aria-label={translate('Label.EERequestFeaturing')}
                  onChange={(event, checked) => {
                    setLastUserToggledStatus(checked);
                    field.onChange(event, checked);
                    trigger('tagline');
                  }}
                />
              )}
            />
            <Typography
              marginRight='4px'
              color={startTimeValidationFailed ? 'disabled' : 'inherit'}>
              {translate('Label.EERequestFeaturing')}
            </Typography>
          </Grid>
          <Typography variant='caption' color={startTimeValidationFailed ? 'disabled' : 'inherit'}>
            {translateHTML('Description.EERequestFeaturing', [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content(chunks) {
                  return (
                    <Link href={`${experienceEventsLearnMoreLink}#off-platform-featuring-program`}>
                      {chunks}
                    </Link>
                  );
                },
              },
            ])}
          </Typography>
        </Grid>
        {getValues('featuringOptInStatus') && (
          <Grid gap='12px' display='flex' direction='column'>
            <Typography
              variant='caption'
              color={startTimeValidationFailed ? 'disabled' : 'inherit'}>
              {translate('Description.EETagline')}
            </Typography>
            <Controller
              name='tagline'
              control={control}
              disabled={startTimeValidationFailed}
              rules={CreateEventRegisterOptions.tagline(getValues('featuringOptInStatus'))}
              render={({ field }) => (
                <TextField
                  {...field}
                  disabled={startTimeValidationFailed}
                  error={!!errors.tagline}
                  fullWidth
                  multiline
                  required
                  minRows={3}
                  id='tagline'
                  label={translate('Label.EETagline')}
                  FormHelperTextProps={{ 'aria-live': 'polite' }}
                  helperText={getTaglineHelperText()}
                />
              )}
            />
          </Grid>
        )}
      </Grid>
    </Tooltip>
  );
};

export default EventFeaturingFields;
