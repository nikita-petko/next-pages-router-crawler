import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import CreateShowcaseContainer from '@modules/creations/showcase/containers/CreateShowcaseContainer';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';

const getShowcasePageLayout = (page: ReactNode) => (
  <CreatorHubLayout
    omitPageTitle
    title={
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Creations' />
    }>
    {page}
  </CreatorHubLayout>
);

const CreateShowcase: NextLayoutPage = () => (
  <Authenticated>
    <CreateShowcaseContainer />
  </Authenticated>
);

CreateShowcase.getPageLayout = getShowcasePageLayout;
CreateShowcase.loggerConfig = { rosId: RosTeams.AvatarMarketplace };

export default CreateShowcase;
