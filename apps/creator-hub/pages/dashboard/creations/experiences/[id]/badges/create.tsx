import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import CreateBadgeContainer from '@modules/creations/badge/components/CreateBadgeForm/CreateBadgeContainer';
import getBadgeCreationLayout from '@modules/creations/badge/utils/getBadgeCreationLayout';

const Create: NextLayoutPage = () => (
  <Authenticated>
    <CreateBadgeContainer />
  </Authenticated>
);

Create.getPageLayout = (page) =>
  getBadgeCreationLayout(page, {
    title: <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Badge' />,
  });
Create.loggerConfig = { rosId: RosTeams.CreatorEconomy };

export default Create;
