import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import CreatedPlacesContainer from '@modules/creations/createdPlaces/containers/CreatedPlacesContainer';

const CreatedPlaces: NextLayoutPage = () => {
  return (
    <Authenticated>
      <CreatedPlacesContainer />
    </Authenticated>
  );
};

CreatedPlaces.getPageLayout = (page) =>
  getCreationsPageLayout(page, {
    title: <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Places' />,
  });
CreatedPlaces.loggerConfig = { rosId: RosTeams.CollaborativeTools };

export default CreatedPlaces;
