import { zodResolver } from '@hookform/resolvers/zod';
import { useWorkspaces } from '@rbx/creator-hub-navigation';
import moment from 'moment-timezone';
import type { Resolver } from 'react-hook-form';

import { defaultTimeZone } from '@constants/app';
import {
  AllServerPaymentType,
  DEFAULT_LIFETIME_BUDGET_DECREASE_BUFFER_RATIO,
  ServerBudgetType,
  ServerCampaignObjectiveType,
  ServerPaymentType,
} from '@constants/campaign';
import {
  CONTINUOUS_VALUE,
  DateFormat,
  FAILED_TO_FETCH_PAYMENT_METHOD_COPY,
  FlowTypes,
  FormField,
  NO_PAYMENT_METHOD_COPY,
  ReachAdFormat,
  TimeFormat,
} from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import { PaymentUnit } from '@constants/payment';
import useFormSchema, { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useNeedsPaymentSetup from '@hooks/campaignBuilder/useNeedsPaymentSetup';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { usePaymentStore } from '@stores/paymentStoreProvider';
import { VideoUploadState } from '@type/fileUpload';
import { GetAdCreditBalanceResponseType } from '@type/payment';
import {
  calculateLifetimeBudgetDecreaseMinimum,
  countSelectedCreatives,
  getCalendarDayEndTimestampMs,
  getScheduledBudgetDecreaseInfo,
  isNearScheduledBudgetMidnight,
} from '@utils/campaignBuilder';
import {
  MicroUsdToUsd,
  MicroUsdToUsdString,
  MicroUsdToUsdStringRoundedUp,
  UsdToMicroUsd,
  UsdToString,
} from '@utils/currency';
import { getSelectedGroupId } from '@utils/groupScopedAccount';
import { GetTimezoneObjFromEnum, GetValidatedTimezoneDbName } from '@utils/timezone';

const MS_PER_HOUR = 1000 * 60 * 60;
const HOURS_PER_DAY = 24;

const VALID_PAYMENT_TYPES: ReadonlySet<ServerPaymentType> = new Set([
  ServerPaymentType.PAYMENT_TYPE_CARD,
  ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT,
  ServerPaymentType.PAYMENT_TYPE_INVOICE,
  ServerPaymentType.PAYMENT_TYPE_GROUP_AD_CREDIT,
]);

export const useFormValidation = (): Resolver<FormType> => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const formSchema = useFormSchema();
  const { currentWorkspace } = useWorkspaces();
  const isAdAccountAutoCreateEnabled = useAppStore(
    (state) => state.appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false,
  );
  const selectedGroupId = getSelectedGroupId(currentWorkspace, isAdAccountAutoCreateEnabled);
  const { ad_credit_balance_in_micro: adCreditBalanceInMicro } = useAppStore(
    (state) => state.adCreditState.data || ({} as GetAdCreditBalanceResponseType),
  );
  const { ad_credit_balance_in_micro: groupAdCreditBalanceInMicro = 0 } = useAppStore((state) =>
    selectedGroupId
      ? state.groupScopedAccountStateByGroupId[selectedGroupId]?.adCreditState?.data ||
        ({} as GetAdCreditBalanceResponseType)
      : ({} as GetAdCreditBalanceResponseType),
  );
  const groupAdAccountId = useAppStore((state) =>
    selectedGroupId
      ? state.groupScopedAccountStateByGroupId[selectedGroupId]?.advertiserState?.data?.ad_account
          ?.id
      : undefined,
  );
  const isGroupAdCreditPaymentAvailable = Boolean(selectedGroupId && groupAdAccountId);
  const groupAdCreditBalanceIsError = useAppStore((state) =>
    selectedGroupId
      ? (state.groupScopedAccountStateByGroupId[selectedGroupId]?.adCreditState?.isError ?? false)
      : false,
  );
  const hasCreditCard = usePaymentStore((state) => (state.paymentProfiles?.data || []).length > 0);
  const adCreditBalanceIsError = useAppStore((state) => state.adCreditState.isError);
  const paymentProfilesIsError = usePaymentStore((state) => state.paymentProfiles.isError);
  const skipPaymentValidation = useNeedsPaymentSetup();
  const dailySpendLimitMicroUsd = useAppStore(
    (state) => state.advertiserState.data?.ad_account?.daily_spend_limit_micro_usd || 0,
  );

  const {
    isDecreaseBudgetEnabled,
    lifetimeBudgetDecreaseBufferRatio,
    offPlatformRequestMinimumDailyBudgetMicroUsd,
    offPlatformRequestMinimumLifetimeBudgetMicroUsd,
  } = useAppStore((state) => state.appMetadataState.data);

  const initialBudget = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.budget_in_micro_usd,
  );
  const initialStartTime = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.start_timestamp_ms,
  );
  const editMode = useCampaignBuilderStore((state) => state.flowType === FlowTypes.EDIT);
  const campaignSpendMicroUsd = useCampaignBuilderStore((state) => state.campaignSpendMicroUsd);
  const campaignTodaySpendMicroUsd = useCampaignBuilderStore(
    (state) => state.campaignTodaySpendMicroUsd,
  );
  const simplifiedCampaignData = useCampaignBuilderStore((state) => state.simplifiedCampaign?.data);
  const advertiserTimezoneEnum = useAppStore(
    (state) => state.advertiserState?.data?.organization?.time_zone,
  );
  const campaignMinimumDailyBudgetMicroUsd = useAppStore(
    (state) => state.appMetadataState.data?.campaignMinimumDailyBudgetMicroUsd ?? 0,
  );
  const isFullDaysEnabled = useAppStore((state) => state.appMetadataState.data?.isFullDaysEnabled);
  const { timezoneDbName: rawTimezoneDbName } = useAppStore((state) =>
    GetTimezoneObjFromEnum(
      state.advertiserState?.data?.organization?.time_zone || defaultTimeZone.value,
    ),
  );
  const isCampaignUsingFullDays = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.is_full_days,
  );
  const isMaxReachEnabled = useAppStore((state) => state.appMetadataState.data?.isMaxReachEnabled);
  const allowOneDayCampaigns = isFullDaysEnabled && (!editMode || isCampaignUsingFullDays);
  const timezoneDbName = GetValidatedTimezoneDbName(rawTimezoneDbName);

  // Set by the EDB superRefine block and read by the budget-range block below it.
  // Zod runs superRefine chains synchronously in declaration order, so this is safe.
  let hasEdbError = false;

  const schema = formSchema
    .superRefine((data, { addIssue }) => {
      // Max Reach enabled check
      if (!isMaxReachEnabled && data[FormField.GOAL] === ServerCampaignObjectiveType.REACH) {
        addIssue({
          code: 'custom',
          message: translate('Validation.ReachNotEnabled'),
          path: [FormField.GOAL],
        });
      }
    })
    .superRefine((data, { addIssue }) => {
      // Reach-specific validations
      if (data[FormField.GOAL] === ServerCampaignObjectiveType.REACH) {
        // Frequency capping validations: when frequency capping is enabled,
        // both duration and value are required
        if (data[FormField.FREQUENCY_CAPPING_ON]) {
          if (data[FormField.FREQUENCY_CAPPING_DURATION_DAYS] == null) {
            addIssue({
              code: 'custom',
              message: translate('Validation.FrequencyCappingDurationRequired'),
              path: [FormField.FREQUENCY_CAPPING_DURATION_DAYS],
            });
          }
          if (data[FormField.FREQUENCY_CAPPING_VALUE] == null) {
            addIssue({
              code: 'custom',
              message: translate('Validation.FrequencyCappingValueRequired'),
              path: [FormField.FREQUENCY_CAPPING_VALUE],
            });
          }
        }

        // Headline validation
        if (!data[FormField.HEADLINE]) {
          addIssue({
            code: 'custom',
            message: translate('Validation.HeadlineRequired'),
            path: [FormField.HEADLINE],
          });
        }

        // BID_VALUE validation
        if (!data[FormField.BID_VALUE]) {
          addIssue({
            code: 'custom',
            message: translate('Validation.CpmRequired'),
            path: [FormField.BID_VALUE],
          });
        }

        // End date validation
        if (!data[FormField.END_DATE]) {
          addIssue({
            code: 'custom',
            message: translate('Validation.EndDateRequired'),
            path: [FormField.END_DATE],
          });
        }

        // End time validation
        if (!data[FormField.END_TIME]) {
          addIssue({
            code: 'custom',
            message: translate('Validation.EndTimeRequired'),
            path: [FormField.END_TIME],
          });
        }

        // 1x2 vertical reach is a video ad: require a finished video upload.
        // The poster image is already enforced by the shared "select at least
        // one thumbnail" check below.
        if (data[FormField.CREATIVE_FORMAT] === ReachAdFormat.VERTICAL_1X2) {
          const hasFinishedVideo = data[FormField.VIDEOS].some(
            (video) => video.state === VideoUploadState.FINISHED && !!video.assetId,
          );
          if (!hasFinishedVideo) {
            addIssue({
              code: 'custom',
              message: translate('Validation.VideoRequired'),
              path: [FormField.VIDEOS],
            });
          }
        }
      }
    })
    .superRefine((data, { addIssue }) => {
      // Budget validation: block decreases unless the decrease budget feature is enabled
      if (
        editMode &&
        !isDecreaseBudgetEnabled &&
        initialBudget &&
        MicroUsdToUsd(initialBudget) > data[FormField.BUDGET]
      ) {
        addIssue({
          code: 'custom',
          message: translate('Validation.BudgetCannotDecrease'),
          path: [FormField.BUDGET],
        });
      }
    })
    .superRefine((data, { addIssue }) => {
      if (!editMode || !isDecreaseBudgetEnabled) {
        return;
      }
      const budgetDecreased =
        initialBudget && UsdToMicroUsd(data[FormField.BUDGET]) < initialBudget;
      const durationChanged =
        simplifiedCampaignData?.duration_in_days != null &&
        Number(data[FormField.DURATION]) !== simplifiedCampaignData.duration_in_days;

      if (!budgetDecreased && !durationChanged) {
        return;
      }
      if (!initialBudget) {
        return;
      }
      const now = Date.now();
      if (!initialStartTime || initialStartTime > now) {
        return;
      }

      if (
        budgetDecreased &&
        simplifiedCampaignData?.scheduled_budget_micro_usd &&
        isNearScheduledBudgetMidnight(timezoneDbName)
      ) {
        addIssue({
          code: 'custom',
          message: translate('Validation.NearMidnightRescheduleBlocked'),
          path: [FormField.BUDGET],
        });
        return;
      }

      let effectiveEndMs: number | undefined;
      if (
        data[FormField.GOAL] === ServerCampaignObjectiveType.REACH &&
        data[FormField.END_DATE] &&
        data[FormField.END_TIME]
      ) {
        effectiveEndMs = moment
          .tz(
            `${data[FormField.END_DATE]} ${data[FormField.END_TIME]}`,
            `${DateFormat} ${TimeFormat}`,
            timezoneDbName,
          )
          .valueOf();
      } else if (Number(data[FormField.DURATION]) > 0) {
        effectiveEndMs = getCalendarDayEndTimestampMs(
          initialStartTime,
          Number(data[FormField.DURATION]),
          advertiserTimezoneEnum,
        );
      }

      if (!effectiveEndMs || effectiveEndMs <= now) {
        return;
      }

      if (
        simplifiedCampaignData?.scheduled_budget_micro_usd &&
        UsdToMicroUsd(data[FormField.BUDGET]) ===
          simplifiedCampaignData.scheduled_budget_micro_usd &&
        simplifiedCampaignData?.end_timestamp_ms &&
        Math.abs(effectiveEndMs - simplifiedCampaignData.end_timestamp_ms) < 60000
      ) {
        return;
      }

      // When re-validating an existing scheduled decrease (duration change only),
      // use the stored effective timestamp from the API. When creating a new
      // decrease (budget decreased), compute the next midnight fresh.
      let effectiveMidnightMs: number;
      let isLastDayOfCampaign: boolean;
      const storedEffectiveTs = simplifiedCampaignData?.scheduled_budget_effective_timestamp_ms;
      if (!budgetDecreased && storedEffectiveTs) {
        effectiveMidnightMs = storedEffectiveTs;
        isLastDayOfCampaign = effectiveMidnightMs >= effectiveEndMs;
      } else {
        const info = getScheduledBudgetDecreaseInfo(advertiserTimezoneEnum, effectiveEndMs);
        effectiveMidnightMs = info.effectiveMidnightMs;
        isLastDayOfCampaign = info.isLastDayOfCampaign;
      }

      if (data[FormField.BUDGET_TYPE] !== ServerBudgetType.BUDGET_TYPE_LIFETIME) {
        if (isLastDayOfCampaign) {
          addIssue({
            code: 'custom',
            message: translate('Description.BudgetLastDayWarning'),
            path: [FormField.BUDGET],
          });
        }
        return;
      }

      const hoursUntilDecrease = (effectiveMidnightMs - now) / MS_PER_HOUR;
      const daysUntilDecrease = Math.max(1, Math.ceil(hoursUntilDecrease / HOURS_PER_DAY));

      const minBudget = calculateLifetimeBudgetDecreaseMinimum({
        bufferRatio:
          lifetimeBudgetDecreaseBufferRatio ?? DEFAULT_LIFETIME_BUDGET_DECREASE_BUFFER_RATIO,
        campaignEndTimestampMs: effectiveEndMs,
        campaignSpendMicroUsd,
        campaignTodaySpendMicroUsd,
        daysUntilDecrease,
        initialBudget,
        minimumDailyBudgetMicroUsd: campaignMinimumDailyBudgetMicroUsd,
        now,
      });

      if (minBudget >= initialBudget) {
        hasEdbError = true;
        addIssue({
          code: 'custom',
          message: translate('Validation.ScheduledBudgetInvalidForDuration'),
          path: [FormField.BUDGET],
        });
      } else if (UsdToMicroUsd(data[FormField.BUDGET]) < minBudget) {
        hasEdbError = true;
        const unit = PaymentUnit[data[FormField.PAYMENT_TYPE] as AllServerPaymentType];
        addIssue({
          code: 'custom',
          message: translate('Validation.MinLifetimeBudget', {
            amount: MicroUsdToUsdString(minBudget),
            unit,
          }),
          path: [FormField.BUDGET],
        });
      }
    })
    .superRefine((data, { addIssue }) => {
      if (skipPaymentValidation) {
        return;
      }
      const selectedPaymentType = data[FormField.PAYMENT_TYPE] as ServerPaymentType;
      if (!VALID_PAYMENT_TYPES.has(selectedPaymentType)) {
        addIssue({
          code: 'custom',
          message: translate(
            adCreditBalanceIsError || paymentProfilesIsError
              ? FAILED_TO_FETCH_PAYMENT_METHOD_COPY
              : NO_PAYMENT_METHOD_COPY,
          ),
          path: [FormField.PAYMENT_TYPE],
        });
      }
      if (
        data[FormField.PAYMENT_TYPE] === ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT &&
        adCreditBalanceIsError
      ) {
        addIssue({
          code: 'custom',
          message: translate(FAILED_TO_FETCH_PAYMENT_METHOD_COPY),
          path: [FormField.PAYMENT_TYPE],
        });
      }
      if (
        data[FormField.PAYMENT_TYPE] === ServerPaymentType.PAYMENT_TYPE_GROUP_AD_CREDIT &&
        isGroupAdCreditPaymentAvailable &&
        groupAdCreditBalanceIsError
      ) {
        addIssue({
          code: 'custom',
          message: translate(FAILED_TO_FETCH_PAYMENT_METHOD_COPY),
          path: [FormField.PAYMENT_TYPE],
        });
      }
      if (
        data[FormField.PAYMENT_TYPE] === ServerPaymentType.PAYMENT_TYPE_CARD &&
        paymentProfilesIsError
      ) {
        addIssue({
          code: 'custom',
          message: translate(FAILED_TO_FETCH_PAYMENT_METHOD_COPY),
          path: [FormField.PAYMENT_TYPE],
        });
      }
      // Payment type validation: check credit card availability
      if (data[FormField.PAYMENT_TYPE] === ServerPaymentType.PAYMENT_TYPE_CARD && !hasCreditCard) {
        addIssue({
          code: 'custom',
          message: translate('Validation.NoCreditCardAvailable'),
          path: [FormField.PAYMENT_TYPE],
        });
      }
    })
    .superRefine((data, { addIssue }) => {
      if (data[FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED]) {
        // Check budget requirements based on budget type for off-platform campaigns
        const isLifetimeBudget =
          data[FormField.BUDGET_TYPE] === ServerBudgetType.BUDGET_TYPE_LIFETIME;
        const minimumBudgetMicroUsd = isLifetimeBudget
          ? offPlatformRequestMinimumLifetimeBudgetMicroUsd
          : offPlatformRequestMinimumDailyBudgetMicroUsd;
        const budgetTypeLabel = translate(isLifetimeBudget ? 'Label.Lifetime' : 'Label.Daily');

        if (Number(data[FormField.BUDGET]) < MicroUsdToUsd(minimumBudgetMicroUsd)) {
          addIssue({
            code: 'too_small',
            inclusive: true,
            message: translate('Validation.OffPlatformMinBudget', {
              amount: UsdToString(MicroUsdToUsd(minimumBudgetMicroUsd)),
              budgetType: budgetTypeLabel,
            }),
            minimum: MicroUsdToUsd(minimumBudgetMicroUsd),
            origin: 'number',
            path: [FormField.BUDGET],
          });
        }
      }
    })
    .superRefine((data, { addIssue }) => {
      if (
        !data[FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED] &&
        countSelectedCreatives(data[FormField.THUMBNAILS]) === 0
      ) {
        addIssue({
          code: 'custom',
          message: translate('Validation.SelectAtLeastOneThumbnail'),
          path: [FormField.THUMBNAILS],
        });
      }
    })
    .superRefine((data, { addIssue }) => {
      // Logo validation: ensure at most one logo is selected
      const selectedLogos = data[FormField.LOGO_ASSETS].filter(
        (logo: { isSelected: boolean }) => logo.isSelected,
      );
      if (selectedLogos.length > 1) {
        addIssue({
          code: 'custom',
          message: translate('Validation.OnlyOneLogoAllowed'),
          path: [FormField.LOGO_ASSETS],
        });
      }
    })
    .superRefine((data, { addIssue }) => {
      const duration = Number(data[FormField.DURATION]);
      const isOffPlatform = data[FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED];

      // Skip validation for continuous campaigns
      if (data[FormField.DURATION] === CONTINUOUS_VALUE) {
        return;
      }

      if (isOffPlatform) {
        // Off-platform campaigns require 28 days minimum
        if (duration < 28) {
          addIssue({
            code: 'too_small',
            inclusive: true,
            message: translate('Validation.OffPlatformMinDuration'),
            minimum: 28,
            origin: 'number',
            path: [FormField.DURATION],
          });
        }
      } else {
        // Regular campaigns require 1 or 2 days minimum based on allowOneDayCampaigns
        const minimumDays = allowOneDayCampaigns ? 1 : 2;
        if (duration < minimumDays) {
          addIssue({
            code: 'too_small',
            inclusive: true,
            message: translate(
              allowOneDayCampaigns
                ? 'Validation.MinDurationOneDay'
                : 'Validation.MinDurationTwoDays',
            ),
            minimum: minimumDays,
            origin: 'number',
            path: [FormField.DURATION],
          });
        }
      }
    })
    .superRefine((data, { addIssue }) => {
      if (data[FormField.PAYMENT_TYPE] === ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT) {
        const requiredBalance =
          UsdToMicroUsd(data[FormField.BUDGET]) /
          (data[FormField.BUDGET_TYPE] === ServerBudgetType.BUDGET_TYPE_LIFETIME
            ? Number(data[FormField.DURATION] || 1)
            : 1);

        if (adCreditBalanceInMicro < requiredBalance) {
          addIssue({
            code: 'too_small',
            inclusive: true,
            message: translate('Validation.MoreAdCreditNeededForBudget', {
              amount: MicroUsdToUsdStringRoundedUp(requiredBalance - adCreditBalanceInMicro),
            }),
            minimum: requiredBalance,
            origin: 'number',
            path: [FormField.PAYMENT_TYPE],
          });
        }
      }
      if (data[FormField.PAYMENT_TYPE] === ServerPaymentType.PAYMENT_TYPE_GROUP_AD_CREDIT) {
        const requiredBalance =
          UsdToMicroUsd(data[FormField.BUDGET]) /
          (data[FormField.BUDGET_TYPE] === ServerBudgetType.BUDGET_TYPE_LIFETIME
            ? Number(data[FormField.DURATION] || 1)
            : 1);

        if (isGroupAdCreditPaymentAvailable && groupAdCreditBalanceInMicro < requiredBalance) {
          addIssue({
            code: 'too_small',
            inclusive: true,
            message: translate('Validation.MoreAdCreditNeededForBudget', {
              amount: MicroUsdToUsdStringRoundedUp(requiredBalance - groupAdCreditBalanceInMicro),
            }),
            minimum: requiredBalance,
            origin: 'number',
            path: [FormField.PAYMENT_TYPE],
          });
        }
      }
    })
    .superRefine((data, { addIssue }) => {
      const unit = PaymentUnit[data[FormField.PAYMENT_TYPE] as AllServerPaymentType];
      if (data[FormField.BUDGET_TYPE] === ServerBudgetType.BUDGET_TYPE_DAILY) {
        if (UsdToMicroUsd(data[FormField.BUDGET]) < campaignMinimumDailyBudgetMicroUsd) {
          addIssue({
            code: 'custom',
            message: translate('Validation.MinDailyBudget', {
              amount: MicroUsdToUsdString(campaignMinimumDailyBudgetMicroUsd),
              unit,
            }),
            path: [FormField.BUDGET],
          });
        } else if (
          // Do not check maximum daily budget for invoice payment type
          dailySpendLimitMicroUsd > 0 && // dailySpendLimitMicroUsd is 0 while loading
          // Do not check maximum daily budget for invoice and ad credit payment types
          ![
            ServerPaymentType.PAYMENT_TYPE_INVOICE,
            ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT,
            ServerPaymentType.PAYMENT_TYPE_GROUP_AD_CREDIT,
          ].includes(data[FormField.PAYMENT_TYPE] as ServerPaymentType) &&
          UsdToMicroUsd(data[FormField.BUDGET]) > dailySpendLimitMicroUsd
        ) {
          addIssue({
            code: 'custom',
            message: translate('Validation.MaxDailyBudget', {
              amount: MicroUsdToUsdString(dailySpendLimitMicroUsd),
              unit,
            }),
            path: [FormField.BUDGET],
          });
        }
      } else if (data[FormField.BUDGET_TYPE] === ServerBudgetType.BUDGET_TYPE_LIFETIME) {
        // Skip the simple $5/day * duration floor when the EDB-aware check already
        // errored — that check is stricter (accounts for spend + buffer) and the
        // two would show conflicting minimum values on the same field.
        if (hasEdbError) {
          return;
        }
        const minimumDailyBudgetMicroUsd = data[FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED]
          ? offPlatformRequestMinimumDailyBudgetMicroUsd
          : campaignMinimumDailyBudgetMicroUsd;
        const campaignMinLifetimeBudgetMicroUsd =
          minimumDailyBudgetMicroUsd * Number(data[FormField.DURATION]);
        if (UsdToMicroUsd(data[FormField.BUDGET]) < campaignMinLifetimeBudgetMicroUsd) {
          addIssue({
            code: 'custom',
            message: translate('Validation.MinLifetimeBudget', {
              amount: MicroUsdToUsdString(campaignMinLifetimeBudgetMicroUsd),
              unit,
            }),
            path: [FormField.BUDGET],
          });
        } else if (
          // Do not check maximum lifetime budget for invoice and ad credit payment types
          ![
            ServerPaymentType.PAYMENT_TYPE_INVOICE,
            ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT,
            ServerPaymentType.PAYMENT_TYPE_GROUP_AD_CREDIT,
          ].includes(data[FormField.PAYMENT_TYPE] as ServerPaymentType) &&
          data[FormField.DURATION] &&
          UsdToMicroUsd(data[FormField.BUDGET]) >
            dailySpendLimitMicroUsd * Number(data[FormField.DURATION])
        ) {
          addIssue({
            code: 'custom',
            message: translate('Validation.MaxLifetimeBudget', {
              amount: MicroUsdToUsdString(
                dailySpendLimitMicroUsd * Number(data[FormField.DURATION]),
              ),
              unit,
            }),
            path: [FormField.BUDGET],
          });
        }
      }
    })
    .superRefine((data, { addIssue }) => {
      if (data[FormField.START_DATE] && data[FormField.START_TIME]) {
        const dateTime = moment.tz(
          `${data[FormField.START_DATE]} ${data[FormField.START_TIME]}`,
          `${DateFormat} ${TimeFormat}`,
          timezoneDbName,
        );

        // If in edit mode and start time is not changed, don't validate
        if (editMode && initialStartTime) {
          if (dateTime.isSame(initialStartTime, 'minutes')) {
            return;
          }
        }
        if (dateTime.isBefore(moment())) {
          addIssue({
            code: 'custom',
            message: translate('Validation.SelectValidTime'),
            path: [FormField.START_TIME],
          });
        }
      }
    })
    .superRefine((data, { addIssue }) => {
      const launchData = data[FormField.LAUNCH_DATA];
      if (launchData && encodeURIComponent(launchData).length > 200) {
        addIssue({
          code: 'too_big',
          maximum: 200,
          message: translate('Validation.LaunchDataMaxLength'),
          origin: 'string',
          path: [FormField.LAUNCH_DATA],
        });
      }
    })
    .superRefine((data, { addIssue }) => {
      // End time validation: ensure end time is after start time
      if (
        data[FormField.END_DATE] &&
        data[FormField.END_TIME] &&
        data[FormField.START_DATE] &&
        data[FormField.START_TIME]
      ) {
        const startDateTime = moment.tz(
          `${data[FormField.START_DATE]} ${data[FormField.START_TIME]}`,
          `${DateFormat} ${TimeFormat}`,
          timezoneDbName,
        );
        const endDateTime = moment.tz(
          `${data[FormField.END_DATE]} ${data[FormField.END_TIME]}`,
          `${DateFormat} ${TimeFormat}`,
          timezoneDbName,
        );

        if (endDateTime.isBefore(startDateTime)) {
          addIssue({
            code: 'custom',
            message: translate('Validation.EndTimeMustBeAfterStart'),
            path: [FormField.END_TIME],
          });
        }
      }
    });
  return zodResolver<FormType, unknown, FormType>(schema);
};
