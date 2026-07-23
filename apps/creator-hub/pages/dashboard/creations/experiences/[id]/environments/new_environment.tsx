import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { CreateEnvironmentContainer, getEnvironmentPageLayout } from '@modules/creations';

const CreateEnvironmentPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <CreateEnvironmentContainer />
    </Authenticated>
  );
};

CreateEnvironmentPage.getPageLayout = getEnvironmentPageLayout;

export default CreateEnvironmentPage;
