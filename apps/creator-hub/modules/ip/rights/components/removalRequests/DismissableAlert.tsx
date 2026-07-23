import { useLocalStorage } from '@rbx/react-utilities';
import { Alert, AlertTitle, CloseIcon, Grid, IconButton } from '@rbx/ui';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

function DismissableAlert() {
  const { ready, translate } = useTranslation();
  const [dismissedAlert, setDismissedAlert] = useLocalStorage(
    `dismissedAccountContainerAlert`,
    false,
  );

  if (dismissedAlert || !ready) {
    return null;
  }

  return (
    <Grid item>
      <Alert
        severity='success'
        action={
          <IconButton
            aria-label={translate('Label.Close')}
            color='inherit'
            size='medium'
            onClick={() => {
              setDismissedAlert(true);
            }}>
            <CloseIcon />
          </IconButton>
        }>
        <AlertTitle>{translate('Heading.RegistrationWasAccepted')}</AlertTitle>
        <span>{translate('Description.RegistrationWasAccepted')}</span>
      </Alert>
    </Grid>
  );
}

export default withTranslation(DismissableAlert, [TranslationNamespace.RightsPortal]);
