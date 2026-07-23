import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import BadgeOverviewContainer from '@modules/creations/badge/components/BadgeOverviewContainer';
import getBadgeLayout from '@modules/creations/badge/utils/getBadgeLayout';

const Overview: NextLayoutPage = () => (
  <Authenticated>
    <BadgeOverviewContainer />
  </Authenticated>
);

Overview.getPageLayout = (page) =>
  getBadgeLayout(page, {
    title: <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Overview' />,
  });
Overview.loggerConfig = { rosId: RosTeams.CreatorEconomy };

export default Overview;
