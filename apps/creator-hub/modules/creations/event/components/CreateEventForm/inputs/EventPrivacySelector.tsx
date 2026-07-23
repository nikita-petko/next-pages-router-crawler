import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { EventVisibility } from '@rbx/client-virtual-events-api/v1';
import { useTranslation } from '@rbx/intl';
import {
  Typography,
  Grid,
  Radio,
  InfoOutlinedIcon,
  Tooltip,
  FormControlLabel,
  RadioGroup,
} from '@rbx/ui';
import type { CreateEventFormType } from '../types';

export interface EventPrivacySelectorProps {
  control: Control<CreateEventFormType>;
}

const EventPrivacySelector: FunctionComponent<
  React.PropsWithChildren<EventPrivacySelectorProps>
> = ({ control }) => {
  const { translate } = useTranslation();

  const radioOption = useCallback((label: string, tooltip: string, value: EventVisibility) => {
    return (
      <FormControlLabel
        value={value}
        control={<Radio aria-label={label} />}
        label={
          <Grid direction='row' display='flex' alignItems='center'>
            <Typography variant='body1'>{label}</Typography>
            <Grid alignItems='center' display='flex' marginLeft='2px'>
              <Tooltip title={tooltip} placement='right' arrow>
                <InfoOutlinedIcon />
              </Tooltip>
            </Grid>
          </Grid>
        }
      />
    );
  }, []);

  return (
    <Grid>
      <Typography align='left' color='secondary' variant='largeLabel1'>
        {translate('Label.Privacy')}
      </Typography>
      <Controller
        name='visibility'
        control={control}
        render={({ field }) => (
          <RadioGroup {...field} id='privacy'>
            {radioOption(
              translate('Label.Public'),
              translate('Tooltip.EEPublicEvent'),
              EventVisibility.Public,
            )}
            {radioOption(
              translate('Label.Private'),
              translate('Tooltip.EEPrivateEvent'),
              EventVisibility.Private,
            )}
          </RadioGroup>
        )}
      />
    </Grid>
  );
};

export default EventPrivacySelector;
