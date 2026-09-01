import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import CollaboratorPermissionsContainer from '@modules/creations/permissions/containers/CollaboratorPermissionsContainer';

const Permissions: NextLayoutPage = () => {
  return <CollaboratorPermissionsContainer />;
};

Permissions.getPageLayout = (page) =>
  getCreationsPageLayout(page, {
    title: <Translate namespace='CreatorDashboard.Creations' translationKey='Tab.Collaborators' />,
  });
Permissions.loggerConfig = { rosId: RosTeams.CollaborativeTools };

export default Permissions;
