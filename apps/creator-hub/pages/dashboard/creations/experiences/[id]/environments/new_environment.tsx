import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import CreateEnvironmentContainer from '@modules/creations/environment/components/CreateEnvironmentContainer';
import getEnvironmentPageLayout from '@modules/creations/environment/layout/getEnvironmentPageLayout';

const CreateEnvironmentPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <CreateEnvironmentContainer />
    </Authenticated>
  );
};

CreateEnvironmentPage.getPageLayout = getEnvironmentPageLayout;
CreateEnvironmentPage.loggerConfig = { rosId: RosTeams.CollaborativeTools };

export default CreateEnvironmentPage;
