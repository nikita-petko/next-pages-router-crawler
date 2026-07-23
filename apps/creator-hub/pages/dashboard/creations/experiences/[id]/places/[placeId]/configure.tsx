import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { ConfigurePlaceContainer, getPlacePageLayout } from '@modules/creations/places';

const Configure: NextLayoutPage = () => (
  <Authenticated>
    <ConfigurePlaceContainer />
  </Authenticated>
);

Configure.getPageLayout = (page) => getPlacePageLayout(page, { title: 'Heading.BasicSettings' });

export default Configure;
