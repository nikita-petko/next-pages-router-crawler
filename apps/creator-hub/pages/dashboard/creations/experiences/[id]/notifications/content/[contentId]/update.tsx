import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import { NotificationContentFormTypes } from '@modules/creations/notifications/constants/notificationContentForm';
import NotificationContentFormMetadataContainer from '@modules/creations/notifications/notificationContent/containers/NotificationContentFormMetadataContainer';

const UpdateNotificationAsset: NextLayoutPage = () => {
  return (
    <Authenticated>
      <NotificationContentFormMetadataContainer type={NotificationContentFormTypes.update} />
    </Authenticated>
  );
};

UpdateNotificationAsset.getPageLayout = (page) =>
  getCreationsPageLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Notifications' />
    ),
  });
UpdateNotificationAsset.loggerConfig = { rosId: RosTeams.Notifications };

export default UpdateNotificationAsset;
