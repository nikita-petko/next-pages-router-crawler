import React, { FunctionComponent } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormHelperText, Grid, Link, makeStyles, Switch, TextField, Typography } from '@rbx/ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import type { TAffiliateLinkForm } from './CreateShareLinkDialog';

const useStyles = makeStyles()(() => ({
  container: {
    display: 'grid',
    gridTemplateAreas: `
      "switch label"
      ". helperText"
    `,
  },

  switchClass: {
    gridArea: 'switch',
  },
  label: {
    gridArea: 'label',
    alignContent: 'center',
  },
  helperText: {
    gridArea: 'helperText',
  },
}));

type LaunchDataSwitchProps = {
  disabled?: boolean;
};

const LaunchDataSwitch: FunctionComponent<LaunchDataSwitchProps> = ({ disabled = false }) => {
  const { translate, translateHTML } = useTranslation();
  const {
    classes: { container, switchClass, label, helperText },
  } = useStyles();
  const {
    watch,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<TAffiliateLinkForm>();

  const launchDataEnabled = watch('launchDataEnabled');

  return (
    <React.Fragment>
      <Grid classes={{ root: container }} paddingTop='16px'>
        <Switch
          classes={{ root: switchClass }}
          aria-label='switch'
          checked={launchDataEnabled}
          disabled={disabled}
          inputProps={
            {
              'data-testid': 'launch-data-switch',
            } as React.InputHTMLAttributes<HTMLInputElement>
          }
          onChange={(event) => {
            setValue('launchDataEnabled', event.target.checked);
          }}
        />
        <Typography classes={{ root: label }}>{translate('Label.CustomLaunchData')}</Typography>
        <FormHelperText classes={{ root: helperText }}>
          {translateHTML('Label.ConfigureLaunchData', [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content(chunks: React.ReactNode) {
                return (
                  <Link
                    href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/reference/engine/classes/Player#LaunchData`}>
                    {chunks}
                  </Link>
                );
              },
            },
          ])}
        </FormHelperText>
      </Grid>
      {launchDataEnabled && (
        <Grid>
          <TextField
            {...register('launchData', {
              validate: (launchData) => {
                if (launchData && encodeURI(launchData).length > 200) {
                  return translate('Label.LaunchDataToLong');
                }
                return true;
              },
            })}
            id='launchData'
            label={translate('Label.LaunchDataParameter')}
            fullWidth
            margin='normal'
            type='text'
            error={Boolean(errors.launchData?.message)}
            multiline
          />
          <FormHelperText classes={{ root: helperText }} error>
            {errors.launchData?.message}
          </FormHelperText>
        </Grid>
      )}
    </React.Fragment>
  );
};

export default withTranslation(LaunchDataSwitch, [TranslationNamespace.ShareLinksManagement]);
