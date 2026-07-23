import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import getOrganizationLayout from '@modules/group/layout/getOrganizationLayout';
import GroupMembersContainer from '@modules/group/containers/GroupMembersContainer';

const GroupMembers: NextLayoutPage = () => {
  return (
    <Authenticated>
      <GroupMembersContainer />
    </Authenticated>
  );
};

GroupMembers.getPageLayout = (page) => getOrganizationLayout(page, { title: 'Heading.Members' });

export default GroupMembers;
