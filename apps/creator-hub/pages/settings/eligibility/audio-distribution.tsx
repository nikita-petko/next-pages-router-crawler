import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';
import Authenticated from '@modules/authentication/Authenticated';
import AudioDistribution from '@modules/audio-distribution/components/AudioDistribution';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';

const getPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, { title: 'Heading.AudioDistribution' });

const AudioDistributionPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ToolboxServiceApiProvider>
        <AudioDistribution />
      </ToolboxServiceApiProvider>
    </Authenticated>
  );
};

AudioDistributionPage.getPageLayout = getPageLayout;

export default AudioDistributionPage;
