import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import NotificationsMetadataContainer from '@modules/creations/notifications/containers/NotificationsMetadataContainer';

const Notifications: NextLayoutPage = () => {
  return (
    <Authenticated>
      <NotificationsMetadataContainer />
    </Authenticated>
  );
};

Notifications.getPageLayout = (page) =>
  getCreationsPageLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Notifications' />
    ),
  });
Notifications.loggerConfig = { rosId: RosTeams.Notifications };

export default Notifications;
