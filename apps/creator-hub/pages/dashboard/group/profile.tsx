import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import getOrganizationLayout from '@modules/group/layout/getOrganizationLayout';
import GroupProfileContainer from '@modules/group/containers/GroupProfileContainer';
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
  getOrganizationLayout(page, { title: 'Heading.GroupProfile' });

export default GroupProfile;
