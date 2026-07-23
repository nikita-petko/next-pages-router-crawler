import React, { FunctionComponent, useCallback, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, Divider, Grid, Link, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { StatusCodes } from '@rbx/core';
import { ErrorPage } from '@modules/miscellaneous/error';
import { PageLoading } from '@modules/miscellaneous/common';
import { creatorSettingsClient } from '@modules/clients';
import { useRouter } from 'next/router';
import { UnsubscribeChoice } from '@rbx/clients/creatorSettings';
import { useAuthentication } from '@modules/authentication/providers';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import UnsubscribeScope from '../../components/unsubscribe/UnsubscribeScope';
import UnsubscribeForm from '../../components/unsubscribe/UnsubscribeForm';
import useUnsubscribeQuery from '../../components/unsubscribe/useUnsubscribeQuery';
import useUnsubscribeContainerStyles from './UnsubscribeContainer.styles';
import UnsubscribeConfirmation from './UnsubscribeConfirmation';
import useSnackbarNotificationMessage from '../../components/useSnackbarNotificationMessage';

const UnsubscribeContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { translate, translateHTML } = useTranslation();
  const router = useRouter();
  const { user } = useAuthentication();
  const [unsubscribeScope, setUnsubscribeScope] = useState(UnsubscribeScope.Event);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [unsubscribeInProgress, setUnsubscribeInProgress] = useState(false);
  const handleUnsubscribeScopeChange = useCallback((preference: UnsubscribeScope) => {
    setUnsubscribeScope(preference);
  }, []);
  const { unsubscribeParams, isValid, isLoading } = useUnsubscribeQuery();
  const { classes: styles } = useUnsubscribeContainerStyles();
  const showSnackbarMessage = useSnackbarNotificationMessage();

  const handleCancel = async () => {
    await router.push('/dashboard/creations');
  };

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

  if (isConfirmed) {
    return (
      <UnsubscribeConfirmation
        unsubscribeScope={unsubscribeScope}
        notificationType={unsubscribeParams?.notificationType}
      />
    );
  }

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
          <Typography variant='body1'>
            {translateHTML('Label.StopReceivingEmailNotificationsV2', [
              {
                opening: 'creatorHubSettingsLinkStart',
                closing: 'creatorHubSettingsLinkEnd',
                // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
                // responsible for triaging issue.
                // eslint-disable-next-line react/no-unstable-nested-components -- see comment above
                content(chunks) {
                  return (
                    <Link
                      href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/settings/notifications`}
                      target='_blank'>
                      {chunks}
                    </Link>
                  );
                },
              },
              {
                opening: 'robloxAccountSettingsLinkStart',
                closing: 'robloxAccountSettingsLinkEnd',
                // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
                // responsible for triaging issue.
                // eslint-disable-next-line react/no-unstable-nested-components -- see comment above
                content(chunks) {
                  return (
                    <Link
                      href={`https://www.${process.env.robloxSiteDomain}/my/account#!/info`}
                      target='_blank'>
                      {chunks}
                    </Link>
                  );
                },
              },
            ])}
          </Typography>
        </Grid>
      </Grid>
      {unsubscribeParams?.notificationType && (
        <Grid item>
          <UnsubscribeForm
            onChange={handleUnsubscribeScopeChange}
            unsubscribeScope={unsubscribeScope}
            notificationType={unsubscribeParams.notificationType}
          />
        </Grid>
      )}
      <Grid item>
        <Divider className={styles.divider} />
      </Grid>
      <Grid className={styles.buttonGap} item container>
        <Grid item>
          <Button variant='outlined' color='primary' onClick={handleCancel}>
            {translate('Action.Cancel')}
          </Button>
        </Grid>
        <Grid item>
          <Button variant='contained' onClick={handleConfirm} loading={unsubscribeInProgress}>
            {translate('Common.Confirm')}
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default withTranslation(UnsubscribeContainer, [
  TranslationNamespace.Notifications,
  TranslationNamespace.Settings,
  TranslationNamespace.SendrNotificationPreferences,
]);
