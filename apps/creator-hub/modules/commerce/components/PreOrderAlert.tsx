import React, { FunctionComponent } from 'react';
import { Alert, AlertTitle, Button, Grid } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const PreOrderAlert: FunctionComponent = () => {
  const { translate } = useTranslation();

  return (
    <Alert severity='info'>
      <Grid container alignItems='center'>
        <Grid item XSmall={10}>
          <AlertTitle>{translate('Heading.PreOrderAlertTitle')}</AlertTitle>
          <div style={{ paddingTop: '8px' }}>{translate('Description.PreOrderAlertContent')}</div>
        </Grid>
        <Grid item XSmall={2}>
          <Button
            color='inherit'
            onClick={() => {
              window.open(
                'https://en.help.roblox.com/hc/en-us/articles/36495190721172-Commerce-Standards',
                '_blank',
              );
            }}>
            {translate('Action.LearnMore')}
          </Button>
        </Grid>
      </Grid>
    </Alert>
  );
};

export default withTranslation(PreOrderAlert, [TranslationNamespace.Commerce]);
