import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
// eslint-disable-next-line no-restricted-imports -- Avoiding circular dependency issues that would break unit tests if exported through index
import ItemAnalyticsContainer from '@modules/creations/itemAnalytics/components/ItemAnalyticsContainer';
import { getAssetPageLayout } from '@modules/creations';
import { AnalyticsOwnerOverrideProvider } from '@modules/experience-analytics-shared';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { FeatureFlagsProvider } from '@modules/feature-flags/context/FeatureFlagsProvider';

const Analytics: NextLayoutPage = () => (
  <Authenticated>
    <FeatureFlagsProvider namespaces={[FeatureFlagNamespace.Analytics]}>
      <AnalyticsOwnerOverrideProvider>
        <ItemAnalyticsContainer />
      </AnalyticsOwnerOverrideProvider>
    </FeatureFlagsProvider>
  </Authenticated>
);

Analytics.getPageLayout = getAssetPageLayout;

export default Analytics;
