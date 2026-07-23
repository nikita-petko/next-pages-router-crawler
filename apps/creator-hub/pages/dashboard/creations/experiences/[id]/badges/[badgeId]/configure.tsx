import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { BadgeConfigureContainer } from '@modules/creations';
import { getBadgeLayout } from '@modules/creations/badge';

const Configure: NextLayoutPage = () => (
  <Authenticated>
    <BadgeConfigureContainer />
  </Authenticated>
);

Configure.getPageLayout = (page) => getBadgeLayout(page, { title: 'Heading.Settings' });

export default Configure;
