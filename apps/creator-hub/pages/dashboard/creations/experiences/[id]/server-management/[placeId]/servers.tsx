import Authenticated from '@modules/authentication/Authenticated';
import { NextLayoutPage } from 'next';
import { getCreationsPageLayout } from '@modules/creations';
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

export default Servers;
