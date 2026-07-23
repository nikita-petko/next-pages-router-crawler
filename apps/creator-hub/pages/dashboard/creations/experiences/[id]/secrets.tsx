import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { getCreationsPageLayout } from '@modules/creations';
import { ExperienceSecretsContainer } from '@modules/creations/secrets';

const Secrets: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ExperienceSecretsContainer />
    </Authenticated>
  );
};

Secrets.getPageLayout = (page) => getCreationsPageLayout(page, { title: 'Heading.Secrets' });

export default Secrets;
