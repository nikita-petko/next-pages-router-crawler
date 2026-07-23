import Authenticated from '@modules/authentication/Authenticated';
import { NextLayoutPage } from 'next';
import ServerManagementPage from '@modules/server-management/pages/ServerManagementPageContainer';
import { getCreationsPageLayout } from '@modules/creations';

const ServerManagement: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ServerManagementPage />
    </Authenticated>
  );
};

ServerManagement.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: 'Heading.ServerManagement' });

export default ServerManagement;
