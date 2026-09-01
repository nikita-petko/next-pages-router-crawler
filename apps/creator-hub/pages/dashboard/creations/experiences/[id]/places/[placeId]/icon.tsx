import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import PlaceIconContainer from '@modules/creations/placeIcon/PlaceIconContainer/PlaceIconContainer';
import getPlacePageLayout from '@modules/creations/places/layout/getPlacePageLayout';

const Icon: NextLayoutPage = () => (
  <Authenticated>
    <PlaceIconContainer />
  </Authenticated>
);

Icon.getPageLayout = (page) =>
  getPlacePageLayout(page, {
    title: <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Icon' />,
  });
Icon.loggerConfig = { rosId: RosTeams.CollaborativeTools };
export default Icon;
