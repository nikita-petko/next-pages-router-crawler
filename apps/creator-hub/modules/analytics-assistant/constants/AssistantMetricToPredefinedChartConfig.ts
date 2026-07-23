import { ItemMonetizationProductTypes, MonetizationProductTypes } from '@modules/clients/analytics';
import {
  chartConfigAcquisitionNewUsersWithPlaysV2Migration,
  chartConfigAcquisitionNewUsersWithImpressionsV2Migration,
  chartConfigAcquisitionReturningUsersWithPlaysV2Migration,
  chartConfigAcquisitionReturningUsersWithImpressionsV2Migration,
  ChartConfigWithPredefinedKey,
} from '@modules/experience-analytics-shared';
import {
  RAQIV2Metric,
  RAQIV2RevenueSource,
  RAQIV2IsNewUser,
} from '@rbx/creator-hub-analytics-config';

export const RAQIV2RevenueSourceToMonetizationProductType: Record<
  RAQIV2RevenueSource,
  ItemMonetizationProductTypes | null
> = {
  [RAQIV2RevenueSource.GamePass]: MonetizationProductTypes.GamePass,
  [RAQIV2RevenueSource.PrivateServer]: null,
  [RAQIV2RevenueSource.DevProduct]: MonetizationProductTypes.GameshopItem,
  [RAQIV2RevenueSource.PayToPlay]: null,
  [RAQIV2RevenueSource.CommissionAvatar]: MonetizationProductTypes.AffiliateFeeAvatar,
  [RAQIV2RevenueSource.AffiliateFeeGamePass]: null, // Probably want to add this to monetization product types but not sure if it's needed
  [RAQIV2RevenueSource.Subscription]: null,
};

export const RAQIV2IsNewUserToAcquisitionChartConfigMap: Record<
  RAQIV2IsNewUser,
  Partial<Record<RAQIV2Metric, ChartConfigWithPredefinedKey>>
> = {
  [RAQIV2IsNewUser.New]: {
    [RAQIV2Metric.UniqueUsersWithPlaySessions]: chartConfigAcquisitionNewUsersWithPlaysV2Migration,
    [RAQIV2Metric.UniqueUsersWithImpressions]:
      chartConfigAcquisitionNewUsersWithImpressionsV2Migration,
  },
  [RAQIV2IsNewUser.Returning]: {
    [RAQIV2Metric.UniqueUsersWithPlaySessions]:
      chartConfigAcquisitionReturningUsersWithPlaysV2Migration,
    [RAQIV2Metric.UniqueUsersWithImpressions]:
      chartConfigAcquisitionReturningUsersWithImpressionsV2Migration,
  },
};
