import React from 'react';
import { getCreationsPageLayout, PermissionsPageContainer } from '@modules/creations';
import { NextLayoutPage } from 'next';

const Permissions: NextLayoutPage = () => {
  return <PermissionsPageContainer />;
};

Permissions.getPageLayout = getCreationsPageLayout;

export default Permissions;
