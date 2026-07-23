import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import ServerManagementPage from '@modules/server-management/pages/ServerManagementPageContainer';

const ServerManagement: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ServerManagementPage />
    </Authenticated>
  );
};

ServerManagement.getPageLayout = (page) =>
  getCreationsPageLayout(page, {
    title: (
      <Translate
        namespace='CreatorDashboard.Navigation'
        translationKey='Heading.ServerManagement'
      />
    ),
  });
ServerManagement.loggerConfig = { rosId: RosTeams.ServerManagement };

export default ServerManagement;
