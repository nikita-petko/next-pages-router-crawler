import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import ReorderBadgesContainer from '@modules/creations/badge/components/ReorderBadgesView/ReorderBadgesContainer';
import getBadgeCreationLayout from '@modules/creations/badge/utils/getBadgeCreationLayout';

const Reorder: NextLayoutPage = () => (
  <Authenticated>
    <ReorderBadgesContainer />
  </Authenticated>
);

Reorder.getPageLayout = (page) =>
  getBadgeCreationLayout(page, {
    title: <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Reorder' />,
  });
Reorder.loggerConfig = { rosId: RosTeams.CreatorEconomy };

export default Reorder;
