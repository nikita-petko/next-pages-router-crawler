import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import CreateGroupContainer from '@modules/group/containers/CreateGroupContainer';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';

const GroupProfile: NextLayoutPage = () => {
  return (
    <Authenticated>
      <CreateGroupContainer />
    </Authenticated>
  );
};

GroupProfile.getPageLayout = (page) => {
  return (
    <IALayoutExperiment title='Action.CreateGroup' noBreadCrumbs>
      {page}
    </IALayoutExperiment>
  );
};

export default GroupProfile;
