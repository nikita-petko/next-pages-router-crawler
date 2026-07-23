import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { CreateEventContainer, getCreationsPageLayout } from '@modules/creations';

const Create: NextLayoutPage = () => {
  return (
    <Authenticated>
      <CreateEventContainer />
    </Authenticated>
  );
};

Create.getPageLayout = (page) => getCreationsPageLayout(page, { title: 'Heading.Events' });

export default Create;
