import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { getCreationsPageLayout } from '@modules/creations';
import { PlacesManagementContainer } from '@modules/creations/places';

const Manage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <PlacesManagementContainer />
    </Authenticated>
  );
};

Manage.getPageLayout = (page) => getCreationsPageLayout(page, { title: 'Heading.Places' });

export default Manage;
