import React from 'react';

import AvatarAnalyticsClientProvider from '@modules/avatar-analytics/context/AvatarAnalyticsClientProvider';
import AvatarAnalyticsDataProviders from '@modules/avatar-analytics/context/AvatarAnalyticsDataProviders';
import {
  AnalyticsHomeClientProvider,
  AnalyticsOwnerOverrideProvider,
  AnalyticsWatchlistsClientProvider,
} from '@modules/experience-analytics-shared';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';
import AffiliateProgramProvider from '@modules/affiliate-program/providers/AffiliateProgramProvider';
import AnalyticsHomePageContent from './AnalyticsHomePageContent';

const AnalyticsHomePageContentContainer = () => {
  return (
    <AnalyticsOwnerOverrideProvider>
      <ToolboxServiceApiProvider>
        <AnalyticsHomeClientProvider>
          <AvatarAnalyticsClientProvider>
            <AnalyticsWatchlistsClientProvider>
              <AvatarAnalyticsDataProviders>
                <AffiliateProgramProvider>
                  <AnalyticsHomePageContent />
                </AffiliateProgramProvider>
              </AvatarAnalyticsDataProviders>
            </AnalyticsWatchlistsClientProvider>
          </AvatarAnalyticsClientProvider>
        </AnalyticsHomeClientProvider>
      </ToolboxServiceApiProvider>
    </AnalyticsOwnerOverrideProvider>
  );
};

export default AnalyticsHomePageContentContainer;
