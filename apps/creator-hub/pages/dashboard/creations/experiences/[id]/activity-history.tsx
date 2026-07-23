import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import ActivityFeedMetadataContainer from '@modules/creations/activityFeed/containers/ActivityFeedMetadataContainer';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';

const ActivityHistory: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ActivityFeedMetadataContainer />
    </Authenticated>
  );
};

ActivityHistory.getPageLayout = (page) =>
  getCreationsPageLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Label.ActivityHistory' />
    ),
  });
ActivityHistory.loggerConfig = { rosId: RosTeams.CollaborativeTools };

export default ActivityHistory;
