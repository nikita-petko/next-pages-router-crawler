import Authenticated from '@modules/authentication/Authenticated';
import { getCreationsPageLayout, ActivityFeedMetadataContainer } from '@modules/creations';
import { NextLayoutPage } from 'next';

const ActivityHistory: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ActivityFeedMetadataContainer />
    </Authenticated>
  );
};

ActivityHistory.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: 'Label.ActivityHistory' });

export default ActivityHistory;
