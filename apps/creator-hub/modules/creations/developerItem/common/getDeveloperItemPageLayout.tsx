import React, { ReactNode } from 'react';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';
import MarketplaceFiatServiceProvider from '@modules/marketplaceFiatService/MarketplaceFiatServiceProvider';
// eslint-disable-next-line no-restricted-imports -- needed for group permissions
import OrganizationProvider from '@modules/group/providers/OrganizationProvider';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';
import { DeveloperItemProvider } from './DeveloperItemProvider';
import DeveloperItemLeftNavigation from './DeveloperItemLeftNavigation/DeveloperItemLeftNavigation';
import { DeveloperItemPublishAttributionProvider } from './DeveloperItemPublishAttributionProvider';

export default function getDeveloperItemPageLayout(page: ReactNode, { title }: { title: string }) {
  return (
    <ToolboxServiceApiProvider>
      <MarketplaceFiatServiceProvider>
        <DeveloperItemProvider>
          <DeveloperItemPublishAttributionProvider>
            <OrganizationProvider>
              <IALayoutExperiment
                title={title}
                leftNavigationContents={<DeveloperItemLeftNavigation />}>
                {page}
              </IALayoutExperiment>
            </OrganizationProvider>
          </DeveloperItemPublishAttributionProvider>
        </DeveloperItemProvider>
      </MarketplaceFiatServiceProvider>
    </ToolboxServiceApiProvider>
  );
}
