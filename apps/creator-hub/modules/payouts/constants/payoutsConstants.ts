import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import PayoutColorType from '../interface/PayoutColorType';
import PayoutType from '../interface/PayoutType';

export const SupportedPayoutTypes: PayoutType[] = [PayoutType.Group, PayoutType.Experiences];

export const SearchDebounceMilliseconds = 500;

export const EconomyEligibilityMaxPageSize = 5; // Economy api only supports 5 users at a time

export const LatestOneTimePayoutMaxPageSize = 20;

export const MaxPayoutCount = 20;

export const SuggestedPayoutsLimit = 10;

export const MaxPayoutCsvFileSizeInKilobytes = 2;

export const PayoutReviewTablePageSize = 4;

export const MaxDialogueHeightPx = 800;

export const PayoutColorTypeToHexMap: Map<PayoutColorType, string> = new Map([
  [PayoutColorType.Invalid, 'A1A2A5'],
  [PayoutColorType.Blue, '00A2FF'],
  [PayoutColorType.LightBlue, '55C1FF'],
  [PayoutColorType.Green, '00B864'],
  [PayoutColorType.LightGreen, '26FF9C'],
  [PayoutColorType.Purple, '9E78EC'],
  [PayoutColorType.LightPurple, 'B69AF1'],
  [PayoutColorType.Yellow, 'D8A009'],
  [PayoutColorType.LightYellow, 'F7C744'],
  [PayoutColorType.Orange, 'EF7A36'],
  [PayoutColorType.LightOrange, 'F29057'],
  [PayoutColorType.Red, 'F2453D'],
  [PayoutColorType.LightRed, 'F4645D'],
  [PayoutColorType.Pink, 'E245CD'],
  [PayoutColorType.LightPink, 'EC83DE'],
  [PayoutColorType.Teal, '00D0D0'],
  [PayoutColorType.LightTeal, '36FFFF'],
]);

export const SupportedPayoutColorTypes: PayoutColorType[] = [
  //   PayoutColorType.Blue, // Disabled for now since this is the groupPayoutColor
  PayoutColorType.LightBlue,
  PayoutColorType.Green,
  PayoutColorType.LightGreen,
  PayoutColorType.Purple,
  PayoutColorType.LightPurple,
  PayoutColorType.Yellow,
  PayoutColorType.LightYellow,
  PayoutColorType.Orange,
  PayoutColorType.LightOrange,
  PayoutColorType.Red,
  PayoutColorType.LightRed,
  PayoutColorType.Pink,
  PayoutColorType.LightPink,
  PayoutColorType.Teal,
  PayoutColorType.LightTeal,
];

export const groupPayoutColor = PayoutColorType.Blue;

export const chartLabelMaxLength = 10;

export const licensedExperienceHelpUrl = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/ip-licensing/creators`;

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

export default {
  SupportedPayoutTypes,
  SearchDebounceMilliseconds,
  EconomyEligibilityMaxPageSize,
  LatestOneTimePayoutMaxPageSize,
  MaxPayoutCount,
  SuggestedPayoutsLimit,
  MaxPayoutCsvFileSizeInKilobytes,
  PayoutReviewTablePageSize,
  MaxDialogueHeightPx,
  PayoutColorTypeToHexMap,
  SupportedPayoutColorTypes,
  groupPayoutColor,
  chartLabelMaxLength,
  licensedExperienceHelpUrl,
  violationLabels,
};
