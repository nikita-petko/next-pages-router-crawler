import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import getDeveloperItemPageLayout from '@modules/creations/developerItem/common/getDeveloperItemPageLayout';
import PermissionDeveloperItemContainer from '@modules/creations/developerItem/common/PermissionDeveloperItem/PermissionDeveloperItemContainer';

const Permissions: NextLayoutPage = () => {
  return (
    <Authenticated>
      <PermissionDeveloperItemContainer />
    </Authenticated>
  );
};

Permissions.getPageLayout = (page) =>
  getDeveloperItemPageLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Permissions' />
    ),
  });
Permissions.loggerConfig = { rosId: RosTeams.CreatorMarketplace };
export default Permissions;
