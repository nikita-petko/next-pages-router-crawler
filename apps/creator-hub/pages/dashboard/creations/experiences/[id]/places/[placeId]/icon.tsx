import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { PlaceIconContainer } from '@modules/creations';
import { getPlacePageLayout } from '@modules/creations/places';

const Icon: NextLayoutPage = () => (
  <Authenticated>
    <PlaceIconContainer />
  </Authenticated>
);

Icon.getPageLayout = (page) => getPlacePageLayout(page, { title: 'Heading.Icon' });
export default Icon;
