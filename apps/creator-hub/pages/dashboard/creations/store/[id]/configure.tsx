import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import {
  ConfigureDeveloperItemContainer,
  getDeveloperItemPageLayout,
} from '@modules/creations/developerItem';

const Configure: NextLayoutPage = () => (
  <Authenticated>
    <ConfigureDeveloperItemContainer />
  </Authenticated>
);

Configure.getPageLayout = (page) =>
  getDeveloperItemPageLayout(page, { title: 'Heading.Configure' });

export default Configure;
