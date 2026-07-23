import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import BadgeConfigureContainer from '@modules/creations/badge/components/BadgeConfigureContainer';
import getBadgeLayout from '@modules/creations/badge/utils/getBadgeLayout';

const Configure: NextLayoutPage = () => (
  <Authenticated>
    <BadgeConfigureContainer />
  </Authenticated>
);

Configure.getPageLayout = (page) =>
  getBadgeLayout(page, {
    title: <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Settings' />,
  });
Configure.loggerConfig = { rosId: RosTeams.CreatorEconomy };

export default Configure;
