import type { FunctionComponent } from 'react';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { withTranslation, useTranslation } from '@rbx/intl';
import { FormHelperText, Grid, Link, makeStyles, Switch, Typography } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getUserUrl } from '@modules/miscellaneous/urls/www';
import type { TAffiliateLinkForm } from './types';

const useLinkFallbackToggleStyles = makeStyles()(() => ({
  container: {
    paddingTop: 16,
    display: 'grid',
    gridTemplateAreas: `
      "switch label"
      ". helperText"
    `,
    gridTemplateColumns: 'max-content',
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

const LinkFallbackToggle: FunctionComponent<LaunchDataSwitchProps> = ({ disabled = false }) => {
  const { translate, translateHTML } = useTranslation();
  const {
    classes: { container, switchClass, label, helperText },
  } = useLinkFallbackToggleStyles();
  const { watch, setValue } = useFormContext<TAffiliateLinkForm>();

  const fallbackToHome = watch('fallbackToHome');

  const { user } = useAuthentication();

  return (
    <Grid classes={{ root: container }}>
      <Switch
        classes={{ root: switchClass }}
        aria-label='switch'
        inputProps={
          {
            'data-testid': 'fallback-to-home-data-switch',
          } as React.InputHTMLAttributes<HTMLInputElement>
        }
        checked={fallbackToHome && !disabled}
        disabled={disabled}
        onChange={(event) => {
          setValue('fallbackToHome', event.target.checked);
        }}
      />
      <Typography classes={{ root: label }}>{translate('Label.FallbackToHome')}</Typography>
      <FormHelperText classes={{ root: helperText }}>
        {translateHTML('Description.FallbackToHome', [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content(chunks: React.ReactNode) {
              return (
                <Link href={getUserUrl(user!.id)} target='_blank'>
                  {chunks}
                </Link>
              );
            },
          },
        ])}
      </FormHelperText>
    </Grid>
  );
};

export default withTranslation(LinkFallbackToggle, [TranslationNamespace.ShareLinksManagement]);
