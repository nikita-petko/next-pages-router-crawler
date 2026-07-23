import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import AudioDistribution from '@modules/audio-distribution/components/AudioDistribution';
import Authenticated from '@modules/authentication/Authenticated';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';
import MarketplacePublishingRequirementsContextProvider from '@modules/marketplacePublishingRequirements/MarketplacePublishingRequirementsProvider';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';

const getPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, {
    title: (
      <Translate
        namespace='CreatorDashboard.Navigation'
        translationKey='Heading.AudioDistribution'
      />
    ),
  });

const AudioDistributionPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <MarketplacePublishingRequirementsContextProvider>
        <ToolboxServiceApiProvider>
          <AudioDistribution />
        </ToolboxServiceApiProvider>
      </MarketplacePublishingRequirementsContextProvider>
    </Authenticated>
  );
};

AudioDistributionPage.getPageLayout = getPageLayout;
AudioDistributionPage.loggerConfig = { rosId: RosTeams.Publishing };

export default AudioDistributionPage;
