import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import { SnackbarProvider } from '@rbx/ui';
import Authenticated from '@modules/authentication/Authenticated';
import ConfigureContainer from '@modules/creations/basicSettings/components/ConfigureExperienceContainer/ConfigureExperienceContainer';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';

const Configure: NextLayoutPage = () => {
  return (
    <Authenticated>
      <SnackbarProvider>
        <ConfigureContainer />
      </SnackbarProvider>
    </Authenticated>
  );
};

Configure.getPageLayout = (page) =>
  getCreationsPageLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.ContentSettings' />
    ),
  });
Configure.loggerConfig = { rosId: RosTeams.CollaborativeTools };

export default Configure;
