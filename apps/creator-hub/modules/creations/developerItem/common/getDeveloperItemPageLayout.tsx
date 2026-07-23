import type { ReactNode } from 'react';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import OrganizationProvider from '@modules/group/providers/OrganizationProvider';
import MarketplaceFiatServiceProvider from '@modules/marketplaceFiatService/MarketplaceFiatServiceProvider';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';
import DeveloperItemLeftNavigation from './DeveloperItemLeftNavigation/DeveloperItemLeftNavigation';
import { DeveloperItemProvider } from './DeveloperItemProvider';
import { DeveloperItemPublishAttributionProvider } from './DeveloperItemPublishAttributionProvider';

export default function getDeveloperItemPageLayout(
  page: ReactNode,
  { title }: { title: string | ReactNode },
) {
  return (
    <ToolboxServiceApiProvider>
      <MarketplaceFiatServiceProvider>
        <DeveloperItemProvider>
          <DeveloperItemPublishAttributionProvider>
            <OrganizationProvider>
              <CreatorHubLayout
                title={title}
                leftNavigationContents={<DeveloperItemLeftNavigation />}>
                {page}
              </CreatorHubLayout>
            </OrganizationProvider>
          </DeveloperItemPublishAttributionProvider>
        </DeveloperItemProvider>
      </MarketplaceFiatServiceProvider>
    </ToolboxServiceApiProvider>
  );
}
