import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { ReorderBadgesContainer } from '@modules/creations';
import { getBadgeCreationLayout } from '@modules/creations/badge';

const Reorder: NextLayoutPage = () => (
  <Authenticated>
    <ReorderBadgesContainer />
  </Authenticated>
);

Reorder.getPageLayout = (page) => getBadgeCreationLayout(page, { title: 'Heading.Reorder' });

export default Reorder;
