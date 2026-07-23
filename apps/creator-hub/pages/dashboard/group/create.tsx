import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import CreateGroupContainer from '@modules/group/containers/CreateGroupContainer';

const GroupProfile: NextLayoutPage = () => {
  return (
    <Authenticated>
      <CreateGroupContainer />
    </Authenticated>
  );
};

GroupProfile.getPageLayout = (page) => {
  return (
    <CreatorHubLayout
      title={
        <Translate namespace='CreatorDashboard.Navigation' translationKey='Action.CreateGroup' />
      }
      noBreadCrumbs>
      {page}
    </CreatorHubLayout>
  );
};
GroupProfile.loggerConfig = { rosId: RosTeams.Organizations };

export default GroupProfile;
