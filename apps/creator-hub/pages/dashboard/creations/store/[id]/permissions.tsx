import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import {
  PermissionDeveloperItemContainer,
  getDeveloperItemPageLayout,
} from '@modules/creations/developerItem';

const Permissions: NextLayoutPage = () => {
  return (
    <Authenticated>
      <PermissionDeveloperItemContainer />
    </Authenticated>
  );
};

Permissions.getPageLayout = (page) =>
  getDeveloperItemPageLayout(page, { title: 'Heading.Permissions' });

export default Permissions;
