import React from 'react';
import { getCreationsPageLayout, CollaboratorPermissionsContainer } from '@modules/creations';
import { NextLayoutPage } from 'next';

const Permissions: NextLayoutPage = () => {
  return <CollaboratorPermissionsContainer />;
};

Permissions.getPageLayout = (page) => getCreationsPageLayout(page, { title: 'Tab.Collaborators' });

export default Permissions;
