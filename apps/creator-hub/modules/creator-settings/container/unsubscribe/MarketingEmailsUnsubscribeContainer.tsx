import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import { UnsubscribeChoice } from '@rbx/client-creator-settings/v1';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, Grid, Typography } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { creatorSettingsClient } from '@modules/clients/creatorSettings';
import { PageLoading } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import UnsubscribeScope from '../../components/unsubscribe/UnsubscribeScope';
import useUnsubscribeQuery from '../../components/unsubscribe/useUnsubscribeQuery';
import useSnackbarNotificationMessage from '../../components/useSnackbarNotificationMessage';
import useUnsubscribeContainerStyles from './UnsubscribeContainer.styles';

const MarketingEmailsUnsubscribeContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();
  const { user } = useAuthentication();
  const [unsubscribeScope] = useState(UnsubscribeScope.Event);
  const [unsubscribeInProgress, setUnsubscribeInProgress] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const { unsubscribeParams, isValid, isLoading } = useUnsubscribeQuery();
  const { classes: styles } = useUnsubscribeContainerStyles();
  const showSnackbarMessage = useSnackbarNotificationMessage();

  const handleConfirm = useCallback(async () => {
    if (unsubscribeParams?.hash && unsubscribeParams.userId) {
      try {
        setUnsubscribeInProgress(true);
        let unsubscribeChoice: UnsubscribeChoice = UnsubscribeChoice.All;
        if (unsubscribeScope === UnsubscribeScope.Event) {
          unsubscribeChoice = UnsubscribeChoice.One;
        }

        await creatorSettingsClient.unsubscribeFromNotification(
          unsubscribeParams.hash,
          unsubscribeParams.userId,
          unsubscribeChoice,
          unsubscribeParams?.notificationType,
        );
        setIsConfirmed(true);
      } catch {
        showSnackbarMessage('error', translate('Error.ValidatingUnsubscribe'));
      } finally {
        setUnsubscribeInProgress(false);
      }
    }
  }, [showSnackbarMessage, translate, unsubscribeParams, unsubscribeScope]);

  if (isLoading) {
    return <PageLoading />;
  }

  if (!isValid) {
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }

  return (
    <Grid
      className={`${styles.container} ${user === null ? styles.unauthenticated : ''}`}
      container
      direction='column'>
      <Grid className={styles.titleGap} item container direction='column'>
        <Grid item>
          <Typography variant='h1'>{translate('Title.Unsubscribe')}</Typography>
        </Grid>
        <Grid item>
          <Typography variant='body1'>{translate('Label.StopReceivingMarketingEmails')}</Typography>
        </Grid>
      </Grid>
      <Grid className={styles.buttonGap} item container>
        <Grid item>
          <Button variant='contained' onClick={handleConfirm} loading={unsubscribeInProgress}>
            {translate('Title.Unsubscribe')}
          </Button>
        </Grid>
        <Grid item container>
          <Grid item>
            {isConfirmed && translate('Label.StopReceivingMarketingEmailsConfirmation')}
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default withTranslation(MarketingEmailsUnsubscribeContainer, [
  TranslationNamespace.Notifications,
  TranslationNamespace.Settings,
  TranslationNamespace.SendrNotificationPreferences,
]);
