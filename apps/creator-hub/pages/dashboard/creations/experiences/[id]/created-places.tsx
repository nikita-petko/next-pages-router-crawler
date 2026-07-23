import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { getCreationsPageLayout } from '@modules/creations';
// eslint-disable-next-line no-restricted-imports -- Created places should be migrated out of creations
import { CreatedPlacesContainer } from '@modules/creations/createdPlaces';

const CreatedPlaces: NextLayoutPage = () => {
  return (
    <Authenticated>
      <CreatedPlacesContainer />
    </Authenticated>
  );
};

CreatedPlaces.getPageLayout = (page) => getCreationsPageLayout(page, { title: 'Heading.Places' });

export default CreatedPlaces;
