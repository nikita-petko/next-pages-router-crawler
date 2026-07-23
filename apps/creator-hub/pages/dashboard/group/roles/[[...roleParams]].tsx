import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import getOrganizationLayout from '@modules/group/layout/getOrganizationLayout';
import GroupRolesContainer from '@modules/group/containers/GroupRolesContainer';

const GroupRoles: NextLayoutPage = () => {
  return (
    <Authenticated>
      <GroupRolesContainer />
    </Authenticated>
  );
};

GroupRoles.getPageLayout = (page) => getOrganizationLayout(page, { title: 'Heading.Roles' });

export default GroupRoles;
