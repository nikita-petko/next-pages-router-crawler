import { useLocalStorage } from '@rbx/react-utilities';
import { Alert, AlertTitle, Button, CloseIcon, Grid, IconButton } from '@rbx/ui';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { IP_FAMILY_CREATE_HREF } from '../../../ipFamilies/urls';

function AdvancedToolingAlert() {
  const { ready, translate } = useTranslation();
  const [dismissedAdvancedToolingAlert, setDismissedAdvancedToolingAlert] = useLocalStorage(
    `dismissedAdvancedToolingAlert`,
    false,
  );

  if (dismissedAdvancedToolingAlert || !ready) {
    return null;
  }

  return (
    <Grid item>
      <Alert
        severity='info'
        action={
          <div>
            <Button color='inherit' href={IP_FAMILY_CREATE_HREF}>
              {translate('Action.SetUp')}
            </Button>
            <IconButton
              aria-label={translate('Label.Close')}
              color='inherit'
              size='medium'
              onClick={() => {
                setDismissedAdvancedToolingAlert(true);
              }}>
              <CloseIcon />
            </IconButton>
          </div>
        }>
        <AlertTitle sx={{ paddingBottom: 0.5 }}>{translate('Title.AdvancedTooling')}</AlertTitle>
        <span>{translate('Description.AccessToAdvancedTooling')}</span>
      </Alert>
    </Grid>
  );
}

export default withTranslation(AdvancedToolingAlert, [TranslationNamespace.RightsPortal]);
