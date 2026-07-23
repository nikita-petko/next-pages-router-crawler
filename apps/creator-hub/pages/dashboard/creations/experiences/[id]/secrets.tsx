import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import ExperienceSecretsContainer from '@modules/creations/secrets/containers/ExperienceSecretsContainer';

const Secrets: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ExperienceSecretsContainer />
    </Authenticated>
  );
};

Secrets.getPageLayout = (page) =>
  getCreationsPageLayout(page, {
    title: <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Secrets' />,
  });
Secrets.loggerConfig = { rosId: RosTeams.ServerManagement };

export default Secrets;
