import { client as creatorConfigsApi } from '@modules/clients/analytics/universeConfigs';
import { AnalyticsContextLayerInnerProvider } from '@modules/experience-analytics-shared/context/AnalyticsContextLayerProvider';
import AnalyticsPermissionControlledContext from '@modules/experience-analytics-shared/context/AnalyticsPermissionControlledContext';
import { defaultAnalyticsPageSurfaceConfig } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import makeValidatedApi from './api/makeValidatedAPI';
import CreatorConfigsClientProvider from './CreatorConfigsClientProvider';
import HistoryPageContent from './HistoryPageContent';

const client = makeValidatedApi(creatorConfigsApi);
const HistoryPage = () => {
  return (
    <AnalyticsPermissionControlledContext permissionType='userCanViewAnalyticsForUniverse'>
      <AnalyticsContextLayerInnerProvider config={defaultAnalyticsPageSurfaceConfig}>
        <CreatorConfigsClientProvider client={client}>
          <HistoryPageContent />
        </CreatorConfigsClientProvider>
      </AnalyticsContextLayerInnerProvider>
    </AnalyticsPermissionControlledContext>
  );
};
export default HistoryPage;
