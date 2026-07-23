import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { BadgeOverviewContainer } from '@modules/creations';
import { getBadgeLayout } from '@modules/creations/badge';

const Overview: NextLayoutPage = () => (
  <Authenticated>
    <BadgeOverviewContainer />
  </Authenticated>
);

Overview.getPageLayout = (page) => getBadgeLayout(page, { title: 'Heading.Overview' });

export default Overview;
