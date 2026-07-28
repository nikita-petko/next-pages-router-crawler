import type { FunctionComponent } from 'react';
import React from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography, Button, Divider } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import UnsubscribeScope from '../../components/unsubscribe/UnsubscribeScope';
import useUnsubscribeContainerStyles from './UnsubscribeContainer.styles';

type UnsubscribeConfirmationProps = {
  unsubscribeScope: UnsubscribeScope;
  notificationType?: string;
};

const UnsubscribeConfirmation: FunctionComponent<
  React.PropsWithChildren<UnsubscribeConfirmationProps>
> = ({ unsubscribeScope, notificationType }) => {
  const { classes: styles } = useUnsubscribeContainerStyles();
  const { translate } = useTranslation();
  const router = useRouter();
  const { user } = useAuthentication();

  const handleReturn = async () => {
    await router.push('/dashboard/creations');
  };

  const successfulUnsubscribeBody = {
    [UnsubscribeScope.All]: translate('Label.SuccessfullyUnsubscribed'),
    [UnsubscribeScope.Event]: translate('Label.SuccessfullyUnsubscribedToEvent', {
      eventType: translate(`Label.NotificationType${notificationType}`),
    }),
  };

  return (
    <Grid
      className={`${styles.container} ${user === null ? styles.unauthenticated : ''}`}
      container
      direction='column'>
      <Grid className={styles.titleGap} item container direction='column'>
        <Grid item>
          <Typography variant='body1'>{successfulUnsubscribeBody[unsubscribeScope]}</Typography>
        </Grid>
      </Grid>
      <Grid item>
        <Divider className={styles.divider} />
      </Grid>
      <Grid item>
        <Button variant='contained' onClick={handleReturn}>
          {translate('Action.ReturnToCreations')}
        </Button>
      </Grid>
    </Grid>
  );
};

export default UnsubscribeConfirmation;
