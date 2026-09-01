import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import ConfigureEnvironmentContainer from '@modules/creations/environment/components/ConfigureEnvironmentContainer';
import getEnvironmentPageLayout from '@modules/creations/environment/layout/getEnvironmentPageLayout';

const ConfigureEnvironmentPage: NextLayoutPage = () => (
  <Authenticated>
    <ConfigureEnvironmentContainer />
  </Authenticated>
);

ConfigureEnvironmentPage.getPageLayout = (page) => getEnvironmentPageLayout(page);
ConfigureEnvironmentPage.loggerConfig = { rosId: RosTeams.CollaborativeTools };

export default ConfigureEnvironmentPage;
