import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import CreateShowcaseContainer from '@modules/creations/showcase/containers/CreateShowcaseContainer';
import getShowcasePageLayout from '@modules/creations/showcase/layout/getShowcasePageLayout';

const CreateShowcase: NextLayoutPage = () => (
  <Authenticated>
    <CreateShowcaseContainer />
  </Authenticated>
);

CreateShowcase.getPageLayout = getShowcasePageLayout;
CreateShowcase.loggerConfig = { rosId: RosTeams.AvatarMarketplace };

export default CreateShowcase;
