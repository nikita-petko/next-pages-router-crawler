import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { ConfigureEnvironmentContainer, getEnvironmentPageLayout } from '@modules/creations';

const ConfigureEnvironmentPage: NextLayoutPage = () => (
  <Authenticated>
    <ConfigureEnvironmentContainer />
  </Authenticated>
);

ConfigureEnvironmentPage.getPageLayout = (page) => getEnvironmentPageLayout(page);

export default ConfigureEnvironmentPage;
