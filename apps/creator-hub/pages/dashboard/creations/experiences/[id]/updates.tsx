import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { getCreationsPageLayout, ExperienceUpdatesContainer } from '@modules/creations';

const Updates: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ExperienceUpdatesContainer />
    </Authenticated>
  );
};

Updates.getPageLayout = (page) => getCreationsPageLayout(page, { title: 'Heading.Updates' });

export default Updates;
