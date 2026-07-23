import Authenticated from '@modules/authentication/Authenticated';
import {
  getCreationsPageLayout,
  NotificationContentFormMetadataContainer,
  NotificationContentFormTypes,
} from '@modules/creations';
import { NextLayoutPage } from 'next';

const CreateNotificationAsset: NextLayoutPage = () => {
  return (
    <Authenticated>
      <NotificationContentFormMetadataContainer type={NotificationContentFormTypes.create} />
    </Authenticated>
  );
};

CreateNotificationAsset.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: 'Heading.Notifications' });

export default CreateNotificationAsset;
