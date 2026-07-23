import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { getCreationsPageLayout } from '@modules/creations';
// eslint-disable-next-line no-restricted-imports -- PlacesPageContainer should be migrated out of creations
import PlacesPageContainer from '@modules/creations/places/containers/PlacesPageContainer';

const Places: NextLayoutPage = () => {
  return (
    <Authenticated>
      <PlacesPageContainer />
    </Authenticated>
  );
};

Places.getPageLayout = (page) => getCreationsPageLayout(page, { title: 'Heading.Places' });

export default Places;
