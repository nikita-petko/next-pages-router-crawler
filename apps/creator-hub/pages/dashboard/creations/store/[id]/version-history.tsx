import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import getDeveloperItemPageLayout from '@modules/creations/developerItem/common/getDeveloperItemPageLayout';
import DeveloperItemVersionHistoryContainer from '@modules/creations/developerItem/components/DeveloperItemVersionHistoryContainer';
import { VersionHistoryProvider } from '@modules/creations/developerItem/components/VersionHistoryProvider';

const Configure: NextLayoutPage = () => (
  <Authenticated>
    <VersionHistoryProvider>
      <DeveloperItemVersionHistoryContainer />
    </VersionHistoryProvider>
  </Authenticated>
);

Configure.getPageLayout = (page) =>
  getDeveloperItemPageLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.VersionHistory' />
    ),
  });
Configure.loggerConfig = { rosId: RosTeams.CreatorMarketplace };
export default Configure;
