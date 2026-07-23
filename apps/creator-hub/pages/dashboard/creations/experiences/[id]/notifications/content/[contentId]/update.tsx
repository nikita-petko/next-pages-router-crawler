import Authenticated from '@modules/authentication/Authenticated';
import {
  getCreationsPageLayout,
  NotificationContentFormMetadataContainer,
  NotificationContentFormTypes,
} from '@modules/creations';
import { NextLayoutPage } from 'next';

const UpdateNotificationAsset: NextLayoutPage = () => {
  return (
    <Authenticated>
      <NotificationContentFormMetadataContainer type={NotificationContentFormTypes.update} />
    </Authenticated>
  );
};

UpdateNotificationAsset.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: 'Heading.Notifications' });

export default UpdateNotificationAsset;
