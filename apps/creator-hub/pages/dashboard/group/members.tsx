import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import GroupMembersContainer from '@modules/group/containers/GroupMembersContainer';
import getOrganizationLayout from '@modules/group/layout/getOrganizationLayout';

const GroupMembers: NextLayoutPage = () => {
  return (
    <Authenticated>
      <GroupMembersContainer />
    </Authenticated>
  );
};

GroupMembers.getPageLayout = (page) =>
  getOrganizationLayout(page, {
    title: <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Members' />,
  });
GroupMembers.loggerConfig = { rosId: RosTeams.Organizations };

export default GroupMembers;
