import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import GroupProfileContainer from '@modules/group/containers/GroupProfileContainer';
import getOrganizationLayout from '@modules/group/layout/getOrganizationLayout';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';

const GroupProfile: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ToolboxServiceApiProvider>
        <GroupProfileContainer />
      </ToolboxServiceApiProvider>
    </Authenticated>
  );
};

GroupProfile.getPageLayout = (page) =>
  getOrganizationLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.PageTitles' translationKey='Heading.GroupProfile' />
    ),
  });
GroupProfile.loggerConfig = { rosId: RosTeams.Organizations };

export default GroupProfile;
