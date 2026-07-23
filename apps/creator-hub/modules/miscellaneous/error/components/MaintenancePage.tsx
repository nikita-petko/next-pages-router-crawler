import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography, UIThemeProvider } from '@rbx/ui';
import { Link } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '../../localization';
import useMaintenancePageStyles from './MaintenancePage.styles';

const PageNotFound = () => {
  const {
    classes: { background, text },
  } = useMaintenancePageStyles();
  const { translateHTML } = useTranslation();

  return (
    <UIThemeProvider theme='dark'>
      <Grid container classes={{ root: background }} direction='column' alignItems='center'>
        <Grid classes={{ root: text }} container item direction='column' justifyContent='center'>
          <Typography variant='h6' align='center'>
            {translateHTML('Heading.MaintenancePage')}
          </Typography>
          <Typography color='secondary' align='center'>
            {translateHTML('Description.MaintenancePage', [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content(chunks) {
                  return (
                    <Link href={`https://status.${process.env.robloxSiteDomain}`}>{chunks}</Link>
                  );
                },
              },
            ])}
          </Typography>
        </Grid>
      </Grid>
    </UIThemeProvider>
  );
};

export default withTranslation(PageNotFound, [TranslationNamespace.Error]);
