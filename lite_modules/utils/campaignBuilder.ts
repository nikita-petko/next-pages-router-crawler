import moment from 'moment';
import { UseFormSetValue } from 'react-hook-form';

import { ServerRetargetingType } from '@constants/advancedTargeting';
import {
  SCHEDULED_BUDGET_DECREASE_BUFFER_MS,
  ServerBudgetType,
  ServerCampaignObjectiveType,
  ServerDetailedTargetingMatchType,
  ServerPaymentType,
} from '@constants/campaign';
import {
  CampaignObjectiveType,
  DefaultBudget,
  DefaultDuration,
  FlowTypes,
  FormField,
  TimeFormat,
} from '@constants/campaignBuilder';
import { CampaignDisplayStatusType } from '@constants/campaignStatus';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import { TargetingCriteriaType } from '@type/advancedTargeting';
import {
  GetRecommendationResponse,
  SimplifiedCampaignType,
  TimeOption,
} from '@type/campaignBuilder';
import { MICRO_USD_IN_USD, MicroUsdToUsd } from '@utils/currency';
import { GetTimezoneObjFromEnum } from '@utils/timezone';

export const GetEditCampaignDisabledTooltipText = (
  flowType?: FlowTypes,
  campaignStatus?: CampaignDisplayStatusType,
) => {
  if (!campaignStatus || flowType !== FlowTypes.EDIT) {
    return '';
  }
  if (
    [
      CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_COMPLETED,
      CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_PROCESSING,
    ].includes(campaignStatus)
  ) {
    return 'Description.EditDisabledCompleted';
  }
  if (campaignStatus === CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_CANCELED) {
    return 'Description.EditDisabledCanceled';
  }
  return '';
};

export const IsEditCampaignDisabled = (
  flowType?: FlowTypes,
  campaignStatus?: CampaignDisplayStatusType,
) => !!GetEditCampaignDisabledTooltipText(flowType, campaignStatus);

export const SanitizeUniverseName = (universeName: string) =>
  universeName.replace(/[&"']/g, '').replace(/</g, '[').replace(/>/g, ']');

export const GetEditTooltipTitle = ({
  campaignStatus,
  editable,
  flowType,
}: {
  campaignStatus?: CampaignDisplayStatusType;
  editable: boolean;
  flowType?: FlowTypes;
}) => {
  const editMode = flowType === FlowTypes.EDIT;
  if (!editMode) {
    return '';
  }
  const editCampaignDisabledTooltip = GetEditCampaignDisabledTooltipText(flowType, campaignStatus);
  if (editCampaignDisabledTooltip) {
    return editCampaignDisabledTooltip;
  }
  if (editable) {
    return '';
  }
  return 'Description.EditDisabledPublished';
};

export const GetObjectiveTargetingCriteriaRequestJson = (
  objective: ServerDetailedTargetingMatchType,
): TargetingCriteriaType => {
  switch (objective) {
    case ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_RETENTION:
      return {
        retargeting_criteria: {
          retargeting_audiences: [ServerRetargetingType.RETARGETING_NEW_USERS_FIRST_30_DAYS],
        },
      } as TargetingCriteriaType;
    case ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_REACTIVATION:
      return {
        retargeting_criteria: {
          retargeting_audiences: [ServerRetargetingType.RETARGETING_LAPSED_USERS_30_DAYS],
        },
      } as TargetingCriteriaType;
    case ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_ACQUIRE_NEW_USERS:
      return {
        retargeting_criteria: {
          retargeting_audiences: [ServerRetargetingType.RETARGETING_EXCLUDE_USERS_180_DAYS],
        },
      } as TargetingCriteriaType;
    default:
      return {} as TargetingCriteriaType;
  }
};

export const GetObjectiveTargetingCriteriaByObjectiveRequestJson = (
  objective: ServerCampaignObjectiveType,
): TargetingCriteriaType => {
  switch (objective) {
    case ServerCampaignObjectiveType.RETENTION:
      return {
        retargeting_criteria: {
          retargeting_audiences: [ServerRetargetingType.RETARGETING_NEW_USERS_FIRST_30_DAYS],
        },
      } as TargetingCriteriaType;
    case ServerCampaignObjectiveType.REACTIVATION:
      return {
        retargeting_criteria: {
          retargeting_audiences: [ServerRetargetingType.RETARGETING_LAPSED_USERS_30_DAYS],
        },
      } as TargetingCriteriaType;
    case ServerCampaignObjectiveType.NEW_USERS:
      return {
        retargeting_criteria: {
          retargeting_audiences: [ServerRetargetingType.RETARGETING_EXCLUDE_USERS_180_DAYS],
        },
      } as TargetingCriteriaType;
    default:
      return {} as TargetingCriteriaType;
  }
};

export const ObjectiveRequiresMinimumAudienceSize = (
  objective: ServerCampaignObjectiveType,
): boolean =>
  objective === ServerCampaignObjectiveType.RETENTION ||
  objective === ServerCampaignObjectiveType.REACTIVATION;

export const RequiresMinimumAudienceSize = (
  targetingMatchType: ServerDetailedTargetingMatchType,
): boolean =>
  targetingMatchType === ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_RETENTION ||
  targetingMatchType ===
    ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_REACTIVATION;

export const IsAdvancedTargetingAllowed = (
  objective: ServerCampaignObjectiveType,
  isExtendToOffPlatformEnabled: boolean,
): boolean =>
  (objective === ServerCampaignObjectiveType.VISITS ||
    objective === ServerCampaignObjectiveType.SPEND) &&
  !isExtendToOffPlatformEnabled;

interface ResetFormRecommendationsParams {
  detailedTargetingMatchType: ServerDetailedTargetingMatchType;
  isAdAccountAutoCreateEnabled?: boolean;
  isExtendToOffPlatformEnabled: boolean;
  objective: ServerCampaignObjectiveType;
  prefillValues?: Partial<SimplifiedCampaignType>;
  recommendation: GetRecommendationResponse;
  setValue: UseFormSetValue<FormType>;
}

export const GetDefaultPaymentType = ({
  creditCardAdded,
  isExtendToOffPlatformEnabled,
  shouldShowCreditCard,
  shouldShowInvoice,
}: {
  creditCardAdded: boolean;
  isExtendToOffPlatformEnabled: boolean;
  shouldShowCreditCard: boolean;
  shouldShowInvoice: boolean;
}) => {
  if (isExtendToOffPlatformEnabled) {
    return ServerPaymentType.PAYMENT_TYPE_INVOICE;
  }
  if (shouldShowInvoice) {
    return ServerPaymentType.PAYMENT_TYPE_INVOICE;
  }
  if (creditCardAdded && shouldShowCreditCard) {
    return ServerPaymentType.PAYMENT_TYPE_CARD;
  }
  return ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT;
};

export const ResetFormRecommendations = ({
  detailedTargetingMatchType,
  isAdAccountAutoCreateEnabled = false,
  isExtendToOffPlatformEnabled,
  objective,
  prefillValues,
  recommendation,
  setValue,
}: ResetFormRecommendationsParams) => {
  if (isExtendToOffPlatformEnabled) {
    return {}; // TODO: determine if we need to reset GaaS form and/or offer recommended budget and duration for GaaS experiences. for now prevent resetting form values.
  }

  // Use audience-based budget options
  const budgetOptions =
    recommendation?.budget_options_by_audience_in_micro_usd?.[detailedTargetingMatchType] ?? [];

  const recommendedBudget =
    prefillValues?.budget_in_micro_usd ||
    budgetOptions?.find(({ is_recommended }) => is_recommended)?.value ||
    DefaultBudget;
  const recommendedDuration =
    prefillValues?.duration_in_days ||
    recommendation?.duration_options_in_days?.find(({ is_recommended }) => is_recommended)?.value ||
    DefaultDuration;
  setValue(FormField.DURATION, recommendedDuration);
  setValue(FormField.BUDGET, MicroUsdToUsd(recommendedBudget));
  setValue(
    FormField.CUSTOM_BUDGET,
    !!prefillValues?.budget_in_micro_usd ||
      (isAdAccountAutoCreateEnabled && budgetOptions.length === 0),
  );
  setValue(
    FormField.CUSTOM_DURATION,
    !!prefillValues?.duration_in_days ||
      (isAdAccountAutoCreateEnabled && !recommendation?.duration_options_in_days?.length),
  );
  // REACH objective requires lifetime budget, others default to daily
  setValue(
    FormField.BUDGET_TYPE,
    objective === ServerCampaignObjectiveType.REACH
      ? ServerBudgetType.BUDGET_TYPE_LIFETIME
      : ServerBudgetType.BUDGET_TYPE_DAILY,
  );
  return { recommendedBudget, recommendedDuration };
};

export const GetEndUserDisplayCampaignObjective = (campaignObjectiveVal: string) => {
  switch (campaignObjectiveVal) {
    case CampaignObjectiveType.AWARENESS:
      return 'Label.Awareness';
    case CampaignObjectiveType.VISITS:
      return 'Label.Visits';
    case CampaignObjectiveType.VIDEO_VIEWS:
      return 'Label.VideoViews';
    default:
      return '';
  }
};

export const GenerateTimeOptions = (
  isToday: boolean,
  timezoneDbName: string,
  locale?: string | null,
) => {
  const times: TimeOption[] = [];
  const now = moment().tz(timezoneDbName);
  const currentHour = now.hours();
  const currentMinute = now.minutes();
  const roundedCurrentMinute = Math.ceil(currentMinute / 30) * 30;

  const timeFormatter = locale
    ? new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' })
    : null;

  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 30) {
      // Skip past times if it's today
      const isPastTimeToday =
        isToday && (hour < currentHour || (hour === currentHour && minute < roundedCurrentMinute));

      if (!isPastTimeToday) {
        const timeString = moment().hour(hour).minute(minute).format(TimeFormat);
        // Arbitrary date — only hour/minute matter for time formatting
        const label = timeFormatter
          ? timeFormatter.format(new Date(2000, 0, 1, hour, minute))
          : timeString;
        times.push({
          label,
          value: timeString,
        });
      }
    }
  }
  return times;
};

/**
 * Computes the campaign end timestamp using calendar-day logic in the advertiser's
 * timezone, matching the backend's `calculateEndtimestampWithDuration` (non-full-days
 * path). This is intentionally conservative — it yields an earlier end time than a
 * naive `start + duration * 86400000` calculation because it truncates the start to
 * midnight and subtracts one second from the end.
 *
 * Backend reference: https://sourcegraph.rbx.com/search?q=%22func+calculateEndtimestampWithDuration%22&patternType=keyword&sm=0
 */
export const getCalendarDayEndTimestampMs = (
  startTimestampMs: number,
  durationInDays: number,
  advertiserTimezoneEnum?: number,
): number => {
  const tzName = GetTimezoneObjFromEnum(advertiserTimezoneEnum).timezoneDbName;
  return moment
    .tz(startTimestampMs, tzName)
    .startOf('day')
    .add(durationInDays, 'days')
    .subtract(1, 'second')
    .valueOf();
};

// Returns whether the current time is within SCHEDULED_BUDGET_DECREASE_BUFFER_MS of the next
// midnight in the given timezone. Mirrors the backend isNearMidnightAt logic.
export const isNearScheduledBudgetMidnight = (timezoneDbName: string): boolean => {
  const nextMidnight = moment().tz(timezoneDbName).startOf('day').add(1, 'day');
  return nextMidnight.valueOf() - Date.now() < SCHEDULED_BUDGET_DECREASE_BUFFER_MS;
};

// Returns the budget decrease message and whether the effective midnight falls on the campaign's
// last day. Mirrors the backend NextBudgetDecreaseMidnight logic: if midnight is within
// SCHEDULED_BUDGET_DECREASE_BUFFER_MS, the effective date is pushed to the following midnight.
export const getScheduledBudgetDecreaseInfo = (
  advertiserTimezoneEnum?: number,
  campaignEndTimestampMs?: number,
): {
  effectiveMidnightMs: number;
  isLastDayOfCampaign: boolean;
  messageKey: string;
  messageParams?: Record<string, string>;
} => {
  const tzName = GetTimezoneObjFromEnum(advertiserTimezoneEnum).timezoneDbName;
  const nearMidnight = isNearScheduledBudgetMidnight(tzName);
  const nextMidnight = moment().tz(tzName).startOf('day').add(1, 'day');
  const effectiveMidnight = nearMidnight ? nextMidnight.clone().add(1, 'day') : nextMidnight;
  const effectiveMidnightMs = effectiveMidnight.valueOf();
  const isLastDayOfCampaign =
    !!campaignEndTimestampMs && effectiveMidnightMs >= campaignEndTimestampMs;
  const messageKey = nearMidnight
    ? 'Description.BudgetDecreaseOnDate'
    : 'Description.BudgetDecreaseNextDay';
  const messageParams = nearMidnight ? { date: effectiveMidnight.format('MMM D') } : undefined;
  return { effectiveMidnightMs, isLastDayOfCampaign, messageKey, messageParams };
};

const HOURS_PER_DAY = 24;

/**
 * Calculates the minimum lifetime budget for a scheduled decrease.
 * Mirrors the backend's validateLifetimeBudgetMinimum formula:
 *
 *   spendBeforeToday  = totalSpend - todaySpend
 *   daysRemaining     = ceil((end - now) / 24h), min 1
 *   daysUntilDecrease = ceil((effectiveMidnight - now) / 24h), min 1
 *   EDB               = max(0, (currentBudget - spendBeforeToday) / daysRemaining)
 *   bufferedEDB       = ceil(EDB * bufferRatio)
 *   minBudget         = spendBeforeToday + daysUntilDecrease * bufferedEDB
 *                       + $5 * (daysRemaining - daysUntilDecrease)
 *   minimum           = roundUpToDollar(minBudget)
 *
 * daysUntilDecrease is normally 1, but becomes 2 when the decrease is pushed
 * to the following midnight (within SCHEDULED_BUDGET_DECREASE_BUFFER_MS).
 */
export const calculateLifetimeBudgetDecreaseMinimum = ({
  bufferRatio,
  campaignEndTimestampMs,
  campaignSpendMicroUsd,
  campaignTodaySpendMicroUsd,
  daysUntilDecrease = 1,
  initialBudget,
  minimumDailyBudgetMicroUsd,
  now,
}: {
  bufferRatio: number;
  campaignEndTimestampMs: number;
  campaignSpendMicroUsd: number;
  campaignTodaySpendMicroUsd: number;
  daysUntilDecrease?: number;
  initialBudget: number;
  minimumDailyBudgetMicroUsd: number;
  now: number;
}): number => {
  const spendBeforeToday = Math.max(0, campaignSpendMicroUsd - campaignTodaySpendMicroUsd);

  const daysRemaining = Math.max(
    1,
    Math.ceil(moment(campaignEndTimestampMs).diff(now, 'hours', true) / HOURS_PER_DAY),
  );

  const currentEDB = Math.max(0, (initialBudget - spendBeforeToday) / daysRemaining);
  const bufferedEDB = Math.ceil(currentEDB * bufferRatio);

  const minimumMicroUsd =
    spendBeforeToday +
    daysUntilDecrease * bufferedEDB +
    minimumDailyBudgetMicroUsd * (daysRemaining - daysUntilDecrease);
  return Math.ceil(minimumMicroUsd / MICRO_USD_IN_USD) * MICRO_USD_IN_USD;
};

// Counts the creatives selected on the form. A "selected" creative is one the
// user has on (or is adding to) the campaign — paused/stopped existing
// creatives stay selected and are counted here just like active ones. This is
// the pre-creative-library behavior: the cap is based purely on the form
// selection and never consults the (async, date-filtered) ad list, so it's
// stable and instant. Per-creative serving status is handled separately (and
// is being reworked in a follow-up PR).
export const countSelectedCreatives = (items: { isSelected?: boolean }[] | undefined): number =>
  (items ?? []).filter((item) => item.isSelected).length;
