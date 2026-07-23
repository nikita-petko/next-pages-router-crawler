import Authenticated from '@modules/authentication/Authenticated';
import { getCreationsPageLayout, NotificationsMetadataContainer } from '@modules/creations';
import { NextLayoutPage } from 'next';

const Notifications: NextLayoutPage = () => {
  return (
    <Authenticated>
      <NotificationsMetadataContainer />
    </Authenticated>
  );
};

Notifications.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: 'Heading.Notifications' });

export default Notifications;
