import type { NextLayoutPage } from 'next';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import PermissionsPageContainer from '@modules/creations/permissions/containers/PermissionsPageContainer';

const Permissions: NextLayoutPage = () => {
  return <PermissionsPageContainer />;
};

Permissions.getPageLayout = getCreationsPageLayout;
Permissions.loggerConfig = { rosId: RosTeams.Organizations };

export default Permissions;
