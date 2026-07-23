import React from 'react';
import {
  AnalyticsFlagGatedContext,
  AnalyticsPermissionControlledContext,
  AnalyticsContextLayerInnerProvider,
  defaultAnalyticsPageSurfaceConfig,
} from '@modules/experience-analytics-shared';
import { client as creatorConfigsApi } from '@modules/clients/analytics/universeConfigs';
import CreatorConfigsClientProvider from './CreatorConfigsClientProvider';
import HistoryPageContent from './HistoryPageContent';
import makeValidatedApi from './api/makeValidatedAPI';

const client = makeValidatedApi(creatorConfigsApi);
const HistoryPage = () => {
  return (
    <AnalyticsFlagGatedContext flag='remoteConfigsEnabled'>
      <AnalyticsPermissionControlledContext permissionType='userCanViewAnalyticsForUniverse'>
        <AnalyticsContextLayerInnerProvider config={defaultAnalyticsPageSurfaceConfig}>
          <CreatorConfigsClientProvider client={client}>
            <HistoryPageContent />
          </CreatorConfigsClientProvider>
        </AnalyticsContextLayerInnerProvider>
      </AnalyticsPermissionControlledContext>
    </AnalyticsFlagGatedContext>
  );
};
export default HistoryPage;
