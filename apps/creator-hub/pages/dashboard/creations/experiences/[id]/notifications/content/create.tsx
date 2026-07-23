import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import { NotificationContentFormTypes } from '@modules/creations/notifications/constants/notificationContentForm';
import NotificationContentFormMetadataContainer from '@modules/creations/notifications/notificationContent/containers/NotificationContentFormMetadataContainer';

const CreateNotificationAsset: NextLayoutPage = () => {
  return (
    <Authenticated>
      <NotificationContentFormMetadataContainer type={NotificationContentFormTypes.create} />
    </Authenticated>
  );
};

CreateNotificationAsset.getPageLayout = (page) =>
  getCreationsPageLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Notifications' />
    ),
  });
CreateNotificationAsset.loggerConfig = { rosId: RosTeams.Notifications };

export default CreateNotificationAsset;
