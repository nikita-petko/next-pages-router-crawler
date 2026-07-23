import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { DefaultApi as DeveloperAdsStatsApi } from '@rbx/clients/developerAdsStatsApi/v1';

import { getBEDEV2ServiceBasePath } from './utils';

export enum ModerationStatus {
  Unspecified = 0,
  Approved = 1,
  Rejected = 2,
  NotReviewed = 3,
  Unreviewable = 4,
  ProhibitedContent = 5,
}

export {
  AdStatType,
  BreakdownType as AdStatBreakdownType,
  ValidationStatus as AdStatValidationStatus,
} from '@rbx/clients/developerAdsStatsApi/v1';
export type {
  AdStatSeries,
  AdStatValue,
  GetDailyAdStatValuesRequest,
  GetDailyAdStatValuesResponse,
  GetEstimatedAdsEarningsResponse,
  DailyEstimatedEarning,
  DailyEstimatedEarningsWithAdFormat,
  TriageSubmissionModerationRequest,
} from '@rbx/clients/developerAdsStatsApi/v1';

const basePath = getBEDEV2ServiceBasePath('developer-ads-stats-api');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const developerAdsStatsClient = new DeveloperAdsStatsApi(configuration);

export default developerAdsStatsClient;
