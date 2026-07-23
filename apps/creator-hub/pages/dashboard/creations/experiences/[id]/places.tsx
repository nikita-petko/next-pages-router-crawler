import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import PlacesPageContainer from '@modules/creations/places/containers/PlacesPageContainer';

const Places: NextLayoutPage = () => {
  return (
    <Authenticated>
      <PlacesPageContainer />
    </Authenticated>
  );
};

Places.getPageLayout = (page) =>
  getCreationsPageLayout(page, {
    title: <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Places' />,
  });
Places.loggerConfig = { rosId: RosTeams.CollaborativeTools };

export default Places;
