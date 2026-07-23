import AffiliateProgramProvider from '@modules/affiliate-program/providers/AffiliateProgramProvider';
import AnalyticsHomeClientProvider from '@modules/experience-analytics-shared/context/AnalyticsHomeClientProvider';
import AnalyticsOwnerOverrideProvider from '@modules/experience-analytics-shared/context/AnalyticsOwnerOverrideProvider';
import { AnalyticsWatchlistsClientProvider } from '@modules/experience-analytics-shared/context/AnalyticsWatchlistsClientProvider';
import ToolboxServiceApiProviderComponent from '@modules/toolboxService/ToolboxServiceApiProvider';
import AnalyticsHomePageContent from './AnalyticsHomePageContent';

const AnalyticsHomePageContentContainer = () => {
  return (
    <AnalyticsOwnerOverrideProvider>
      <ToolboxServiceApiProviderComponent>
        <AnalyticsHomeClientProvider>
          <AnalyticsWatchlistsClientProvider>
            <AffiliateProgramProvider>
              <AnalyticsHomePageContent />
            </AffiliateProgramProvider>
          </AnalyticsWatchlistsClientProvider>
        </AnalyticsHomeClientProvider>
      </ToolboxServiceApiProviderComponent>
    </AnalyticsOwnerOverrideProvider>
  );
};

export default AnalyticsHomePageContentContainer;
