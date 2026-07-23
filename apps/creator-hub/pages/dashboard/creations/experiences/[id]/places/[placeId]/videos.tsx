import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import getPlaceAnalyticsPageLayout from '@modules/creations/places/layout/getPlaceAnalyticsPageLayout';
import PlaceVideosContainer from '@modules/creations/placeThumbnails/containers/PlaceVideosContainer';

const Videos: NextLayoutPage = () => {
  return (
    <Authenticated>
      <PlaceVideosContainer />
    </Authenticated>
  );
};

Videos.getPageLayout = (page) =>
  getPlaceAnalyticsPageLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.PlaceVideos' />
    ),
  });
Videos.loggerConfig = { rosId: RosTeams.CollaborativeTools };

export default Videos;
