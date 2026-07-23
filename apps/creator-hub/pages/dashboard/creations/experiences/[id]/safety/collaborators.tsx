import React from 'react';
import type { NextLayoutPage } from 'next';
import { getCreationsPageLayout } from '@modules/creations';
import SafetyCollaboratorsPage from '@modules/creations-overview/components/SafetyCollaboratorsPage';

const SafetyCollaborators: NextLayoutPage = () => {
  return <SafetyCollaboratorsPage />;
};

SafetyCollaborators.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: 'Tab.Collaborators' });

export default SafetyCollaborators;
