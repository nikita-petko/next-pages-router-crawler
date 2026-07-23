import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import ServerListHeader from '@modules/server-management/components/ServerListPage/ServerListHeader';
import ServerListPageContainer from '@modules/server-management/pages/ServerListPageContainer';
import UniversePlacesProvider from '@modules/server-management/providers/UniversePlacesProvider';

const Servers: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ServerListPageContainer />
    </Authenticated>
  );
};

Servers.getPageLayout = (page) =>
  getCreationsPageLayout(page, {
    title: (
      <UniversePlacesProvider>
        <ServerListHeader />
      </UniversePlacesProvider>
    ),
  });
Servers.loggerConfig = { rosId: RosTeams.ServerManagement };

export default Servers;
