import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import ExperienceUpdatesContainer from '@modules/creations/updates/components/ExperienceUpdatesContainer/ExperienceUpdatesContainer';

const Updates: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ExperienceUpdatesContainer />
    </Authenticated>
  );
};

Updates.getPageLayout = (page) =>
  getCreationsPageLayout(page, {
    title: <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Updates' />,
  });
Updates.loggerConfig = { rosId: RosTeams.Localization };

export default Updates;
