import { ChartColor } from '@rbx/analytics-ui';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import PayoutType from '../interface/PayoutType';

export const SupportedPayoutTypes: PayoutType[] = [PayoutType.Group, PayoutType.Experiences];

export const SearchDebounceMilliseconds = 500;

export const EconomyEligibilityMaxPageSize = 5; // Economy api only supports 5 users at a time

export const LatestOneTimePayoutMaxPageSize = 20;

export const MaxPayoutCount = 20;

// Corresponds to MaxGroupPayoutPartners in Roblox.Platform.GroupManagement (marketplace-service)
export const MaxRecurringPayoutCount = 25;

export const SuggestedPayoutsLimit = 10;

export const MaxPayoutCsvFileSizeInKilobytes = 2;

export const PayoutReviewTablePageSize = 4;

export const MaxDialogueHeightPx = 800;

export const SupportedPayoutChartColors: ChartColor[] = [
  // ChartColor.Blue is reserved for the group payout.
  ChartColor.Blue2,
  ChartColor.Green,
  ChartColor.Green2,
  ChartColor.Purple,
  ChartColor.Purple2,
  ChartColor.Yellow,
  ChartColor.Yellow2,
  ChartColor.Orange,
  ChartColor.Red,
  ChartColor.Purple3,
  ChartColor.Purple4,
  ChartColor.Cyan,
  ChartColor.Cyan2,
  ChartColor.Yellow3,
  ChartColor.Green3,
];

export const groupPayoutColor = ChartColor.Blue;

export const chartLabelMaxLength = 10;

export const licensedExperienceHelpUrl = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/ip-licensing/creators`;

export const devexHelpUrl = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/monetization/18-plus-devex-rate`;

export const violationLabels: Record<string, string> = {
  FraudPaymentAuthorizationAttempt: 'Label.Sublabel.FraudPaymentAbuse',
  FraudVirtualEconomyAbuse: 'Label.Sublabel.FraudVirtualEconomyAbuse',
  FraudAbuseOfAffiliateSystem: 'Label.Sublabel.FraudAbuseOfTheAffiliateSystem',
  FraudAttemptedUnauthorizedPaymentMethodUse:
    'Label.Sublabel.FraudAttemptedUnauthorizedPaymentMethodUse',
  FraudRepeatedRefundRequests: 'Label.Sublabel.FraudRepeatedRefundRequests',
  FraudSuspiciousRefundRequests: 'Label.Sublabel.FraudSuspiciousRefundRequests',
  FraudUnauthorizedPurchase: 'Label.Sublabel.FraudUnauthorizedPurchase',
  FraudUseOfUnauthorizedOffPlatformTransactions:
    'Label.Sublabel.FraudUseOfUnauthorizedOffPlatformTransactions',
  FraudUseOfUnauthorizedPaymentMethod: 'Label.Sublabel.FraudUseOfUnauthorizedPaymentMethod',
  FraudSuspiciousAccountPatterns: 'Label.Sublabel.FraudSuspiciousAccountPatterns',
  FraudChargeback: 'Label.AbuseType.Chargeback',
};

export const RATE_DIVISOR = 10_000;
export const MICRO_MULTIPLE = 1_000_000;

export default {
  SupportedPayoutTypes,
  SearchDebounceMilliseconds,
  EconomyEligibilityMaxPageSize,
  LatestOneTimePayoutMaxPageSize,
  MaxPayoutCount,
  MaxRecurringPayoutCount,
  SuggestedPayoutsLimit,
  MaxPayoutCsvFileSizeInKilobytes,
  PayoutReviewTablePageSize,
  MaxDialogueHeightPx,
  SupportedPayoutChartColors,
  groupPayoutColor,
  chartLabelMaxLength,
  licensedExperienceHelpUrl,
  violationLabels,
};
