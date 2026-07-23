import {
  isAdCreditPaymentType,
  ServerCampaignObjectiveType,
  ServerCampaignStatusType,
  ServerDetailedTargetingMatchType,
  ServerPaymentType,
} from '@constants/campaign';
import { StatusText } from '@constants/campaignStatus';
import { defaultCancelCampaignTimeBufferMs } from '@constants/metadata';
import { Campaign } from '@type/campaign';
import { FormatDateToMMMMDYYYYHMMAT } from '@utils/date';
import { IsCompletedStatus } from '@utils/displayStatus';
import { ConvertBudgetMicro, MillisecondsToHours } from '@utils/unitConversion';

const END_USER_CARD_PAYMENT_TYPE = 'Label.Card';
const END_USER_AD_CREDIT_PAYMENT_TYPE = 'Label.AdCreditPayment';
const END_USER_LINE_OF_CREDIT_TYPE = 'Label.LineOfCredit';

const END_USER_BUDGET_TYPE_LIFETIME = 'Label.Lifetime';
const END_USER_BUDGET_TYPE_DAILY = 'Label.Daily';

const END_USER_USD_PREFIX = 'Label.CurrencyPrefix';

const END_USER_OBJECTIVE_TYPE_PLAYS = 'Label.Plays';
const END_USER_OBJECTIVE_TYPE_SPEND = 'Label.Earnings';
const END_USER_OBJECTIVE_TYPE_REACH = 'Label.Reach';
const END_USER_OBJECTIVE_TYPE_ENGAGED_PLAYS = 'Label.EngagedPlays';

const END_USER_AUDIENCE_ALL_PLAYERS = 'Label.AllPlayers';
const END_USER_AUDIENCE_NEW_PLAYERS = 'Label.NewPlayers';
const END_USER_AUDIENCE_RECENT_PLAYERS = 'Label.RecentPlayers';
const END_USER_AUDIENCE_LAPSED_PLAYERS = 'Label.LapsedPlayers';

const END_USER_CAMPAIGN_RUN_CONTINUOUSLY = 'Label.RunContinuously';

export const GetEndUserPaymentTypeString = (paymentType: ServerPaymentType) => {
  switch (paymentType) {
    case ServerPaymentType.PAYMENT_TYPE_CARD:
      return END_USER_CARD_PAYMENT_TYPE;
    case ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT:
    case ServerPaymentType.PAYMENT_TYPE_GROUP_AD_CREDIT:
      return END_USER_AD_CREDIT_PAYMENT_TYPE;
    case ServerPaymentType.PAYMENT_TYPE_INVOICE:
      return END_USER_LINE_OF_CREDIT_TYPE;
    default:
      return '';
  }
};

export const GetEndUserBudgetParts = (campaign: Campaign) => {
  const { budget, payment_type, scheduled_budget_micro_usd } = campaign;
  const formatAmount = (amount: number) =>
    amount
      ? ConvertBudgetMicro(amount).toLocaleString('en-US', {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        })
      : '';

  const prefixKey = isAdCreditPaymentType(payment_type) ? '' : END_USER_USD_PREFIX;

  if (budget?.lifetime_budget_micro_usd) {
    return {
      amount: formatAmount(scheduled_budget_micro_usd || budget.lifetime_budget_micro_usd),
      prefixKey,
      typeKey: END_USER_BUDGET_TYPE_LIFETIME,
    };
  }
  if (budget?.daily_budget_micro_usd) {
    return {
      amount: formatAmount(scheduled_budget_micro_usd || budget.daily_budget_micro_usd),
      prefixKey,
      typeKey: END_USER_BUDGET_TYPE_DAILY,
    };
  }

  return null;
};

export const GetEndUserObjectiveString = (
  objective: ServerCampaignObjectiveType,
  isOffPlatformCampaign: boolean,
) => {
  if (isOffPlatformCampaign) {
    return END_USER_OBJECTIVE_TYPE_SPEND;
  }
  switch (objective) {
    case ServerCampaignObjectiveType.VISITS:
      return END_USER_OBJECTIVE_TYPE_PLAYS;
    case ServerCampaignObjectiveType.REACH:
      return END_USER_OBJECTIVE_TYPE_REACH;
    case ServerCampaignObjectiveType.SPEND:
      return END_USER_OBJECTIVE_TYPE_SPEND;
    case ServerCampaignObjectiveType.ENGAGED_PLAYS:
      return END_USER_OBJECTIVE_TYPE_ENGAGED_PLAYS;
    default:
      return END_USER_OBJECTIVE_TYPE_PLAYS;
  }
};

export const GetAudienceLabelKey = (type?: ServerDetailedTargetingMatchType) => {
  switch (type) {
    case ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_REACTIVATION:
      return END_USER_AUDIENCE_LAPSED_PLAYERS;
    case ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_RETENTION:
      return END_USER_AUDIENCE_RECENT_PLAYERS;
    case ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_ACQUIRE_NEW_USERS:
      return END_USER_AUDIENCE_NEW_PLAYERS;
    default:
      return END_USER_AUDIENCE_ALL_PLAYERS;
  }
};

export const GetEndUserScheduleParts = (campaign: Campaign, timezoneDbName: string) => {
  const startDate = FormatDateToMMMMDYYYYHMMAT({
    timestamp: campaign.start_timestamp_ms,
    timezone: timezoneDbName,
  });
  const isRunContinuously =
    (campaign.budget?.daily_budget_micro_usd ||
      campaign.ad_credit_budget?.daily_budget_ad_credit_micro) &&
    campaign.end_timestamp_ms === 0;
  const endDate = isRunContinuously
    ? null
    : FormatDateToMMMMDYYYYHMMAT({
        timestamp: campaign.end_timestamp_ms,
        timezone: timezoneDbName,
      });
  return {
    endDate,
    runContinuouslyKey: isRunContinuously ? END_USER_CAMPAIGN_RUN_CONTINUOUSLY : null,
    startDate,
  };
};

export const GetEditTooltipTitle = (statusText: StatusText, isDisabled: boolean) => {
  if (statusText === StatusText.DISPLAY_STATUS_CANCELED) {
    return 'Tooltip.CannotEditCanceled';
  }
  if (IsCompletedStatus(statusText)) {
    return 'Tooltip.CannotEditCompleted';
  }
  if (isDisabled) {
    return '';
  }
  return undefined;
};

export const GetCancelTooltipTitle = (
  campaign: Campaign,
  cancelCampaignTimeBufferMs?: number,
  isOffPlatformCampaign?: boolean,
): { key: string; params?: Record<string, string> } | undefined => {
  if (isOffPlatformCampaign) {
    return { key: 'Tooltip.OffPlatformCannotCancel' };
  }
  if (campaign.status === ServerCampaignStatusType.CANCELLED) {
    return { key: 'Tooltip.CampaignAlreadyCanceled' };
  }
  const cancelBufferTimeMs = cancelCampaignTimeBufferMs || defaultCancelCampaignTimeBufferMs;
  if (campaign.start_timestamp_ms - Date.now() < cancelBufferTimeMs) {
    return {
      key: 'Tooltip.CampaignTooCloseToCancel',
      params: { hours: `${MillisecondsToHours(cancelBufferTimeMs)}` },
    };
  }
  return undefined;
};
