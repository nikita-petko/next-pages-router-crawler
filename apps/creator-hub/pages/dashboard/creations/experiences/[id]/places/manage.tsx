import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import PlacesManagementContainer from '@modules/creations/places/containers/PlacesManagementContainer';

const Manage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <PlacesManagementContainer />
    </Authenticated>
  );
};

Manage.getPageLayout = (page) =>
  getCreationsPageLayout(page, {
    title: <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Places' />,
  });
Manage.loggerConfig = { rosId: RosTeams.CollaborativeTools };

export default Manage;
