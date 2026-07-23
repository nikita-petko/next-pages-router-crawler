import React, { FunctionComponent } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormHelperText, Grid, Link, makeStyles, Switch, Typography } from '@rbx/ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getUserUrl } from '@modules/miscellaneous/common/urls/www';
import { useAuthentication } from '@modules/authentication/providers';
import type { TAffiliateLinkForm } from './CreateShareLinkDialog';

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
