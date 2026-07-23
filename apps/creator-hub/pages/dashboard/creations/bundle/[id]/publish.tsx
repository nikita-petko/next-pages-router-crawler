import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { ItemConfigureContainer, getBundlePageLayout } from '@modules/creations';

const Configure: NextLayoutPage = () => (
  <Authenticated>
    <ItemConfigureContainer />
  </Authenticated>
);

Configure.getPageLayout = getBundlePageLayout;

export default Configure;
