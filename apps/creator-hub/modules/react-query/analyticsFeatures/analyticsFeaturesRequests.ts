import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';
import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { AnalyticsFeaturesAPIApi } from '@rbx/clients/analyticsFeaturesApi';
import { AnalyticsFeatureName } from './Features';

const basePath = getBEDEV2ServiceBasePath('analytics-features');
const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const analyticsFeatures = new AnalyticsFeaturesAPIApi(configuration);

const getAnalyticsFeatures = async ({
  universeId,
  featureNames,
}: {
  universeId: number;
  featureNames: Array<AnalyticsFeatureName>;
}) => {
  return analyticsFeatures.v1UniversesUniverseIdFeaturesGet({
    universeId,
    featureNames,
  });
};

export default getAnalyticsFeatures;
