import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import {
  DeveloperItemVersionHistoryContainer,
  VersionHistoryProvider,
  getDeveloperItemPageLayout,
} from '@modules/creations/developerItem';

const Configure: NextLayoutPage = () => (
  <Authenticated>
    <VersionHistoryProvider>
      <DeveloperItemVersionHistoryContainer />
    </VersionHistoryProvider>
  </Authenticated>
);

Configure.getPageLayout = (page) =>
  getDeveloperItemPageLayout(page, { title: 'Heading.VersionHistory' });

export default Configure;
