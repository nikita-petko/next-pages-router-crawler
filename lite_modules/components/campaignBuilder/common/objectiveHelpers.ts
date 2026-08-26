import moment from 'moment-timezone';
import { UseFormSetValue, UseFormTrigger } from 'react-hook-form';

import {
  ServerBudgetType,
  ServerCampaignObjectiveType,
  ServerDetailedTargetingMatchType,
  ServerPaymentType,
} from '@constants/campaign';
import {
  DateFormat,
  DEFAULT_REACH_AD_FORMAT,
  DEFAULT_REACH_BID_DISCOUNT_BPS,
  DEFAULT_REACH_BID_TYPE,
  DEFAULT_REACH_BID_VALUE,
  DEFAULT_REACH_CTA_BUTTON_TYPE,
  DEFAULT_REACH_FREQUENCY_CAPPING_DURATION_DAYS,
  DEFAULT_REACH_FREQUENCY_CAPPING_VALUE,
  FormField,
  ReachAdFormat,
} from '@constants/campaignBuilder';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import { GetRecommendationResponse } from '@type/campaignBuilder';
import { GetDefaultPaymentType, ResetFormRecommendations } from '@utils/campaignBuilder';
import { MicroUsdToUsd } from '@utils/currency';

export const applyOnPlatformSpendFormValues = ({
  hasPaymentProfile,
  setValue,
  shouldShowCreditCard,
  shouldShowInvoice,
}: {
  hasPaymentProfile: boolean;
  setValue: UseFormSetValue<FormType>;
  shouldShowCreditCard: boolean;
  shouldShowInvoice: boolean;
}) => {
  setValue(FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED, false);
  setValue(
    FormField.PAYMENT_TYPE,
    GetDefaultPaymentType({
      creditCardAdded: hasPaymentProfile,
      isExtendToOffPlatformEnabled: false,
      shouldShowCreditCard,
      shouldShowInvoice,
    }),
  );
};

// Fields that only exist on one of the two Max Reach formats, reset whenever the
// format changes. Shared by the format radios and by the bid-type picker, which
// can force the format to 1x2 when a video-only bid type is chosen.
export const applyReachCreativeFormatChange = ({
  nextFormat,
  setValue,
}: {
  nextFormat: ReachAdFormat;
  setValue: UseFormSetValue<FormType>;
}) => {
  if (nextFormat === ReachAdFormat.HORIZONTAL_2X1) {
    // 2x1 (image) rejects a clickout URL, so drop the click destination, the opt-in
    // that reveals it, and the attribution bar assets that only the clickout
    // experience renders.
    setValue(FormField.CLICK_DESTINATION, undefined);
    setValue(FormField.IS_BRAND_CLICKOUT, false);
    setValue(FormField.ATTRIBUTION_THUMBNAILS, []);
    // 2x1 CTA text comes from the max-reach tile-variant experiment, not from an
    // advertiser choice.
    setValue(FormField.CTA_BUTTON_TYPE, undefined);
    return;
  }
  setValue(FormField.CTA_BUTTON_TYPE, DEFAULT_REACH_CTA_BUTTON_TYPE);
};

export const applyOffPlatformSpendFormValues = ({
  offPlatformRequestMinimumDaysFromStartDate,
  offPlatformRequestMinimumDurationDays,
  offPlatformRequestMinimumLifetimeBudgetMicroUsd,
  setValue,
}: {
  offPlatformRequestMinimumDaysFromStartDate: number;
  offPlatformRequestMinimumDurationDays: number;
  offPlatformRequestMinimumLifetimeBudgetMicroUsd: number;
  setValue: UseFormSetValue<FormType>;
}) => {
  setValue(FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED, true);
  setValue(FormField.PAYMENT_TYPE, ServerPaymentType.PAYMENT_TYPE_INVOICE);
  setValue(FormField.BUDGET_TYPE, ServerBudgetType.BUDGET_TYPE_LIFETIME);
  setValue(FormField.DURATION, offPlatformRequestMinimumDurationDays);
  setValue(FormField.CUSTOM_DURATION, true);
  setValue(FormField.BUDGET, MicroUsdToUsd(offPlatformRequestMinimumLifetimeBudgetMicroUsd));
  setValue(
    FormField.START_DATE,
    moment().add(offPlatformRequestMinimumDaysFromStartDate, 'days').format(DateFormat),
  );
};

// Centralizes the side effects of changing GOAL: applies the objective-specific field bag,
// re-runs ResetFormRecommendations, and re-validates. Shared by ObjectiveSection (user click)
// and ExperienceSection's eligibility-driven auto-default.
interface ApplyObjectiveChangeOptions {
  // ResetFormRecommendations inputs.
  currentPaymentType: ServerPaymentType | undefined;
  detailedTargetingMatchType: ServerDetailedTargetingMatchType;
  hasPaymentProfile: boolean;
  isAdAccountAutoCreateEnabled: boolean;
  // Spend-platform routing.
  isSpendOffPlatformOnly: boolean;
  // Payment defaults (consumed by applyOnPlatformSpendFormValues).
  needsAccountSetup: boolean;
  nextObjective: ServerCampaignObjectiveType;
  offPlatformRequestMinimumDaysFromStartDate: number;
  offPlatformRequestMinimumDurationDays: number;
  offPlatformRequestMinimumLifetimeBudgetMicroUsd: number;
  recommendation: GetRecommendationResponse | undefined;
  // Form binding.
  setValue: UseFormSetValue<FormType>;
  shouldShowCreditCard: boolean;
  shouldShowInvoice: boolean;
  // Reach defaults.
  startTime: string | undefined;
  trigger: UseFormTrigger<FormType>;
}

export const applyObjectiveChange = ({
  currentPaymentType,
  detailedTargetingMatchType,
  hasPaymentProfile,
  isAdAccountAutoCreateEnabled,
  isSpendOffPlatformOnly,
  needsAccountSetup,
  nextObjective,
  offPlatformRequestMinimumDaysFromStartDate,
  offPlatformRequestMinimumDurationDays,
  offPlatformRequestMinimumLifetimeBudgetMicroUsd,
  recommendation,
  setValue,
  shouldShowCreditCard,
  shouldShowInvoice,
  startTime,
  trigger,
}: ApplyObjectiveChangeOptions) => {
  const defaultOnPlatform = () => {
    const shouldKeepCurrentPaymentType =
      currentPaymentType === ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT ||
      currentPaymentType === ServerPaymentType.PAYMENT_TYPE_GROUP_AD_CREDIT ||
      (currentPaymentType === ServerPaymentType.PAYMENT_TYPE_CARD && shouldShowCreditCard) ||
      (currentPaymentType === ServerPaymentType.PAYMENT_TYPE_INVOICE && shouldShowInvoice);

    if (!needsAccountSetup) {
      if (shouldKeepCurrentPaymentType) {
        setValue(FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED, false);
      } else {
        applyOnPlatformSpendFormValues({
          hasPaymentProfile,
          setValue,
          shouldShowCreditCard,
          shouldShowInvoice,
        });
      }
    }

    setValue(FormField.END_DATE, undefined);
    setValue(FormField.END_TIME, undefined);
    setValue(FormField.BID_VALUE, undefined);
    setValue(FormField.BID_TYPE, undefined);
    setValue(FormField.CREATIVE_FORMAT, DEFAULT_REACH_AD_FORMAT);
    setValue(FormField.FREQUENCY_CAPPING_ON, false);
    setValue(FormField.FREQUENCY_CAPPING_VALUE, undefined);
    setValue(FormField.FREQUENCY_CAPPING_DURATION_DAYS, undefined);
    setValue(FormField.HEADLINE, undefined);
    setValue(FormField.SUBTITLE, undefined);
    setValue(FormField.CLICK_DESTINATION, undefined);
    // Reset alongside the field it reveals. Left set, the box comes back checked with an
    // empty URL once the user returns to 1x2, which fails the required-URL rule and
    // disables Publish while the error stays invisible on the untouched field.
    setValue(FormField.IS_BRAND_CLICKOUT, false);
    setValue(FormField.LOGO_ASSETS, []);
    setValue(FormField.ATTRIBUTION_THUMBNAILS, []);
    setValue(FormField.CTA_BUTTON_TYPE, undefined);
    setValue(FormField.DISCOUNT, undefined);
  };

  const handlers: Partial<Record<ServerCampaignObjectiveType, () => void>> = {
    [ServerCampaignObjectiveType.REACH]: () => {
      defaultOnPlatform();
      setValue(FormField.BUDGET_TYPE, ServerBudgetType.BUDGET_TYPE_LIFETIME);
      setValue(FormField.END_DATE, moment().add(7, 'days').format(DateFormat));
      setValue(FormField.END_TIME, startTime);
      setValue(FormField.BID_VALUE, DEFAULT_REACH_BID_VALUE);
      setValue(FormField.BID_TYPE, DEFAULT_REACH_BID_TYPE);
      setValue(FormField.CREATIVE_FORMAT, DEFAULT_REACH_AD_FORMAT);
      setValue(FormField.FREQUENCY_CAPPING_ON, false);
      setValue(FormField.FREQUENCY_CAPPING_VALUE, DEFAULT_REACH_FREQUENCY_CAPPING_VALUE);
      setValue(
        FormField.FREQUENCY_CAPPING_DURATION_DAYS,
        DEFAULT_REACH_FREQUENCY_CAPPING_DURATION_DAYS,
      );
      setValue(FormField.HEADLINE, undefined);
      setValue(FormField.SUBTITLE, undefined);
      setValue(FormField.LOGO_ASSETS, []);
      setValue(FormField.ATTRIBUTION_THUMBNAILS, []);
      setValue(FormField.CTA_BUTTON_TYPE, DEFAULT_REACH_CTA_BUTTON_TYPE);
      setValue(FormField.DISCOUNT, DEFAULT_REACH_BID_DISCOUNT_BPS);
    },
    [ServerCampaignObjectiveType.SPEND]: () => {
      if (isSpendOffPlatformOnly) {
        applyOffPlatformSpendFormValues({
          offPlatformRequestMinimumDaysFromStartDate,
          offPlatformRequestMinimumDurationDays,
          offPlatformRequestMinimumLifetimeBudgetMicroUsd,
          setValue,
        });
      } else {
        defaultOnPlatform();
      }
    },
  };
  (handlers[nextObjective] ?? defaultOnPlatform)();
  // Recommendation may not have landed yet (eligibility-driven auto-default path); the
  // component's recommendation effect will re-run ResetFormRecommendations on arrival.
  if (recommendation) {
    ResetFormRecommendations({
      detailedTargetingMatchType,
      isAdAccountAutoCreateEnabled,
      isExtendToOffPlatformEnabled:
        nextObjective === ServerCampaignObjectiveType.SPEND && isSpendOffPlatformOnly,
      objective: nextObjective,
      recommendation,
      setValue,
    });
  }
  trigger();
};
