import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import ConfigurePlaceContainer from '@modules/creations/places/containers/ConfigurePlaceContainer';
import getPlacePageLayout from '@modules/creations/places/layout/getPlacePageLayout';

const Configure: NextLayoutPage = () => (
  <Authenticated>
    <ConfigurePlaceContainer />
  </Authenticated>
);

Configure.getPageLayout = (page) =>
  getPlacePageLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.BasicSettings' />
    ),
  });
Configure.loggerConfig = { rosId: RosTeams.CollaborativeTools };

export default Configure;
