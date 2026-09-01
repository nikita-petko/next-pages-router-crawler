import type { FC } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, Grid } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { Link } from '@modules/miscellaneous/components';
import { initiateCreateNotificationContentEventModel } from '../../constants/notificationEventConstants';
import useNotificationContentFormStyles from '../styles/notificationContentForm';

type CreateNotificationContentButtonProps = {
  universeId: number;
  buttonPosition?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
};
const CreateNotificationContentButton: FC<
  React.PropsWithChildren<CreateNotificationContentButtonProps>
> = ({ universeId, buttonPosition = 'flex-start' }) => {
  const { trackerClient } = useEventTrackerProvider();
  const createUrl = `/dashboard/creations/experiences/${universeId}/notifications/content/create`;
  const { translate } = useTranslation();
  const { user } = useAuthentication();
  const {
    classes: { containerPadding },
  } = useNotificationContentFormStyles();

  const handleClick = () => {
    trackerClient.sendEvent(initiateCreateNotificationContentEventModel(user?.id, universeId));
  };

  return (
    <Grid container classes={{ root: containerPadding }} justifyContent={buttonPosition}>
      <Link href={createUrl} underline='none'>
        <Button
          data-testid='initiate-notification-content-create-button'
          variant='contained'
          size='large'
          onClick={handleClick}>
          {translate('Title.CreateNotification')}
        </Button>
      </Link>
    </Grid>
  );
};

export default CreateNotificationContentButton;
