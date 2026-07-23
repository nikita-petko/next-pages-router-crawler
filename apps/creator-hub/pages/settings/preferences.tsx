import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import PreferencesContainer from '@modules/creator-settings/container/preferences/PreferencesContainer';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';

const getSettingsPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Preferences' />
    ),
    noBreadCrumbs: true,
  });

const PreferencesPage: NextLayoutPage = () => {
  return <PreferencesContainer />;
};

PreferencesPage.getPageLayout = getSettingsPageLayout;
PreferencesPage.loggerConfig = { rosId: RosTeams.CreatorHubPlatform };

export default PreferencesPage;
