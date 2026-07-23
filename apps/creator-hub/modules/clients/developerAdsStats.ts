import { DefaultApi as DeveloperAdsStatsApi } from '@rbx/client-developer-ads-stats-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

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
} from '@rbx/client-developer-ads-stats-api/v1';
export type {
  AdStatSeries,
  AdStatValue,
  GetDailyAdStatValuesRequest,
  GetDailyAdStatValuesResponse,
  GetEstimatedAdsEarningsResponse,
  DailyEstimatedEarning,
  DailyEstimatedEarningsWithAdFormat,
  TriageSubmissionModerationRequest,
} from '@rbx/client-developer-ads-stats-api/v1';

const configuration = createClientConfiguration('developer-ads-stats-api', 'bedev2');

const developerAdsStatsClient = new DeveloperAdsStatsApi(configuration);

export default developerAdsStatsClient;
