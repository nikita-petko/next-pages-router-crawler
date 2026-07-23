import React, { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';
import PreferencesContainer from '@modules/creator-settings/container/preferences/PreferencesContainer';

const getSettingsPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, {
    title: 'Heading.Preferences',
    noBreadCrumbs: true,
  });

const PreferencesPage: NextLayoutPage = () => {
  return <PreferencesContainer />;
};

PreferencesPage.getPageLayout = getSettingsPageLayout;

export default PreferencesPage;
