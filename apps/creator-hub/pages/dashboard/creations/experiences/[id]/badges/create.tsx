import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { CreateBadgeContainer } from '@modules/creations';
import { getBadgeCreationLayout } from '@modules/creations/badge';

const Create: NextLayoutPage = () => (
  <Authenticated>
    <CreateBadgeContainer />
  </Authenticated>
);

Create.getPageLayout = (page) => getBadgeCreationLayout(page, { title: 'Heading.Badge' });

export default Create;
