import moment from 'moment-timezone';
import { useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { defaultTimeZone } from '@constants/app';
import {
  DefaultServerCampaignObjectiveType,
  DefaultServerDetailedTargetingMatchType,
  ServerBudgetType,
  ServerCampaignObjectiveType,
  ServerPaymentType,
} from '@constants/campaign';
import {
  CONTINUOUS_VALUE,
  DateFormat,
  DEFAULT_REACH_AD_FORMAT,
  DEFAULT_REACH_BID_TYPE,
  DefaultBudget,
  DefaultDuration,
  FlowTypes,
  FormField,
  noExperiencesOption,
  TimeFormat,
} from '@constants/campaignBuilder';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { usePaymentStore } from '@stores/paymentStoreProvider';
import { SimplifiedCampaignType } from '@type/campaignBuilder';
import { MicroUsdToUsd } from '@utils/currency';
import { GetTimezoneObjFromEnum, GetValidatedTimezoneDbName } from '@utils/timezone';
import { CreateExistingAssetVideo } from '@utils/videoStateHelpers';

/**
 * Hook to get default form values for campaign form
 */
export const useCampaignFormDefaultValue = (): Partial<FormType> => {
  // Fetch data from stores
  const flowType = useCampaignBuilderStore((state) => state.flowType);
  const initialCampaign = useCampaignBuilderStore((state) => state.simplifiedCampaign?.data);
  const prefilledCampaignFields = useCampaignBuilderStore((state) => state.prefilledCampaignFields);

  const isCloneMode = flowType === FlowTypes.CLONE;
  const isEditMode = flowType === FlowTypes.EDIT;
  const campaign = isEditMode || isCloneMode ? initialCampaign : null;

  // useAppStore
  const adCreditActivated = useAppStore(
    (state) => state.adCreditState.data?.is_account_activated || false,
  );
  const defaultBudget = useAppStore(
    (state) => state.appMetadataState.data?.defaultBudgetRecommendationMicroUsd || DefaultBudget,
  );
  const defaultDuration = useAppStore(
    (state) => state.appMetadataState.data?.defaultDurationRecommendationDays || DefaultDuration,
  );
  const isManagedAccount = useAppStore(
    (state) => state.adAccountIsExternalManaged() || state.adAccountIsInternalManaged(),
  );
  const hasCreditCard = usePaymentStore((state) => (state.paymentProfiles?.data || []).length > 0);
  const paymentFailure = useAppStore((state) => state.appData?.paymentFailure);
  const { isGaasEnabled } = useAppStore((state) => state.appMetadataState.data || {});
  const { timezoneDbName: rawTimezoneDbName } = useAppStore((state) =>
    GetTimezoneObjFromEnum(
      state.advertiserState?.data?.organization?.time_zone || defaultTimeZone.value,
    ),
  );

  const timezoneDbName = GetValidatedTimezoneDbName(rawTimezoneDbName);
  const hasValidCreditCard = hasCreditCard && !paymentFailure;

  const getDefaultPaymentType = useCallback(() => {
    if (isManagedAccount) {
      return ServerPaymentType.PAYMENT_TYPE_INVOICE;
    }
    if (adCreditActivated) {
      return ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT;
    }
    if (hasValidCreditCard) {
      return ServerPaymentType.PAYMENT_TYPE_CARD;
    }
    return ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT;
  }, [isManagedAccount, adCreditActivated, hasValidCreditCard]);

  const getDefaultStartDateTime = useCallback(() => {
    const now = moment().add(1, 'hour').tz(timezoneDbName);
    const roundedMinute = Math.ceil(now.minutes() / 30) * 30;
    return now.minutes(roundedMinute);
  }, [timezoneDbName]);

  const fallbackUniverse = useCampaignBuilderStore(
    (state) => state.universesCanAdvertise.data?.[0] || noExperiencesOption,
  );

  // Transform Sponsored Ads to Logo Assets form field values.
  // We must preserve `logo_asset_aspect_width` from the source campaign as
  // an `aspectRatio` string on the form item — `useTransformFormToCampaign`
  // reads `aspectRatio` to derive the `logo_asset_aspect_width` it sends
  // back, and the sponsored-ads backend strict-checks that value for `1`
  // or `3`. Without this the cloned campaign submits with a missing width
  // and the API rejects with "LogoAssetAspectWidth must be either 1 or 3".
  const transformLogoAssets = useCallback(
    ({ sponsored_ads }: SimplifiedCampaignType) =>
      sponsored_ads
        ? sponsored_ads
            .filter(({ logo_asset_id }) => logo_asset_id !== undefined)
            .map(({ logo_asset_aspect_width, logo_asset_id }) => ({
              assetId: logo_asset_id!,
              existing: true,
              isSelected: true,
              ...(logo_asset_aspect_width === 1 && { aspectRatio: '1:1' }),
              ...(logo_asset_aspect_width === 3 && { aspectRatio: '3:1' }),
            }))
            .slice(0, 1)
        : [],
    [],
  );

  // if sponsored_ads exists, use it to transform thumbnails, otherwise use asset_ids
  const transformThumbnails = useCallback(
    ({ asset_ids, sponsored_ads }: SimplifiedCampaignType) => {
      if (sponsored_ads) {
        return sponsored_ads
          .filter(({ asset_id }) => asset_id !== undefined)
          .map(({ asset_id }) => ({
            assetId: asset_id!,
            existing: true,
            isSelected: true,
          }));
      }
      if (asset_ids) {
        return asset_ids.map((assetId: number) => ({
          assetId,
          existing: true,
          isSelected: true,
        }));
      }
      return [];
    },
    [],
  );

  // Transform Frequency Capping Rules to form field values
  const transformFrequencyCappingRules = useCallback(
    ({ frequency_capping_rules }: SimplifiedCampaignType) =>
      frequency_capping_rules
        ? {
            duration_days: frequency_capping_rules[0].duration_days,
            value: frequency_capping_rules[0].value,
          }
        : undefined,
    [],
  );

  // Transform Sponsored Ads to Headline form field values
  const transformHeadline = useCallback(
    ({ sponsored_ads }: SimplifiedCampaignType) => sponsored_ads?.[0]?.headline,
    [],
  );

  // Transform Sponsored Ads to Subtitle form field values
  const transformSubtitle = useCallback(
    ({ sponsored_ads }: SimplifiedCampaignType) => sponsored_ads?.[0]?.subtitle,
    [],
  );

  // Transform Sponsored Ads to Click destination (clickout URL) form field value
  const transformClickDestination = useCallback(
    ({ sponsored_ads }: SimplifiedCampaignType) => sponsored_ads?.[0]?.clickout_url,
    [],
  );

  // Transform Bid Value to form field values
  const transformBidValue = useCallback(
    ({ bid_value_micro_usd }: SimplifiedCampaignType) =>
      bid_value_micro_usd ? MicroUsdToUsd(bid_value_micro_usd) : undefined,
    [],
  );

  // Transform Detailed Targeting Match Type to form field values
  const transformDetailedTargetingMatchType = useCallback(
    ({ detailed_targeting_match_type, targeting_criteria }: SimplifiedCampaignType) =>
      detailed_targeting_match_type ??
      targeting_criteria?.retargeting_criteria?.retargeting_audiences?.[0],
    [],
  );

  // Transform Duration to form field values
  const transformDuration = useCallback(
    ({ duration_in_days }: SimplifiedCampaignType) =>
      duration_in_days === 0 ? CONTINUOUS_VALUE : duration_in_days,
    [],
  );

  // Transform Discount to form field values
  const transformDiscount = useCallback(
    ({ bid_discount_bps }: SimplifiedCampaignType) =>
      bid_discount_bps !== undefined && bid_discount_bps !== null
        ? bid_discount_bps / 100 // Convert basis points to percentage (1000 bps = 10%)
        : 0,
    [],
  );

  // Transform Videos to form field values
  const transformVideos = useCallback(
    ({ off_platform_ad_ready_asset_ids, raw_video_asset_ids }: SimplifiedCampaignType) =>
      (raw_video_asset_ids || off_platform_ad_ready_asset_ids)?.map((assetId) =>
        CreateExistingAssetVideo(String(assetId), `dev-creative-${assetId}`),
      ) ?? [],
    [],
  );

  /**
   * Transform campaign data to form field values
   * This is a pure function that only transforms campaign data to form fields
   */
  const transformCampaignToFormFields = useCallback(
    (campaignData: SimplifiedCampaignType): Partial<FormType> => {
      if (!campaignData) {
        return {};
      }

      const startMoment = moment.tz(campaignData.start_timestamp_ms, timezoneDbName);
      const endMoment = campaignData.end_timestamp_ms
        ? moment.tz(campaignData.end_timestamp_ms, timezoneDbName)
        : undefined;
      const frequencyCappingRule = transformFrequencyCappingRules(campaignData);

      return {
        [FormField.BID_TYPE]: campaignData.bid_type ?? DEFAULT_REACH_BID_TYPE,
        [FormField.BID_VALUE]: transformBidValue(campaignData),
        [FormField.BUDGET]: MicroUsdToUsd(campaignData.budget_in_micro_usd),
        [FormField.BUDGET_TYPE]: campaignData.budget_type,
        [FormField.CAMPAIGN_NAME]: campaignData.name,
        [FormField.CLICK_DESTINATION]: transformClickDestination(campaignData),
        [FormField.CREATIVE_FORMAT]: DEFAULT_REACH_AD_FORMAT,
        [FormField.CUSTOM_BUDGET]: true,
        [FormField.CUSTOM_DURATION]: campaignData.duration_in_days !== 0,
        [FormField.DETAILED_TARGETING_MATCH_TYPE]:
          transformDetailedTargetingMatchType(campaignData),
        [FormField.DISCOUNT]: transformDiscount(campaignData),
        [FormField.DURATION]: transformDuration(campaignData),
        [FormField.END_DATE]: endMoment?.format(DateFormat),
        [FormField.END_TIME]: endMoment?.format(TimeFormat),
        [FormField.EXPERIENCE]: {
          paid_access: undefined,
          universe_id: campaignData.target_universe_id ?? 0,
          universe_name: 'Loading',
        },
        [FormField.FREQUENCY_CAPPING_DURATION_DAYS]: frequencyCappingRule?.duration_days,
        [FormField.FREQUENCY_CAPPING_ON]: !!frequencyCappingRule,
        [FormField.FREQUENCY_CAPPING_VALUE]: frequencyCappingRule?.value,
        [FormField.GOAL]: campaignData.objective,
        [FormField.HEADLINE]: transformHeadline(campaignData),
        [FormField.IDEMPOTENCY_KEY]: uuidv4(),
        [FormField.IS_AUTO_RELOAD_ENABLED]: campaignData.is_auto_reload_ad_credit_enabled ?? false,
        [FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED]: !!campaignData.off_platform_request_id,
        [FormField.LAUNCH_DATA]: campaignData.launch_data_override,
        [FormField.LOGO_ASSETS]: transformLogoAssets(campaignData),
        [FormField.PAYMENT_TYPE]: campaignData.payment_type,
        [FormField.PLACE_ID_OVERRIDE]: campaignData.place_id_override,
        [FormField.START_DATE]: startMoment.format(DateFormat),
        [FormField.START_TIME]: startMoment.format(TimeFormat),
        [FormField.SUBTITLE]: transformSubtitle(campaignData),
        [FormField.THUMBNAILS]: transformThumbnails(campaignData),
        [FormField.VIDEOS]: transformVideos(campaignData),
      };
    },
    [
      timezoneDbName,
      transformLogoAssets,
      transformBidValue,
      transformThumbnails,
      transformVideos,
      transformFrequencyCappingRules,
      transformHeadline,
      transformSubtitle,
      transformClickDestination,
      transformDetailedTargetingMatchType,
      transformDuration,
      transformDiscount,
    ],
  );

  const getOverridePrefilledFields = useCallback(() => {
    const overrideFields: Partial<FormType> = {};
    const { budget_in_micro_usd, duration_in_days, objective, target_universe_id } =
      prefilledCampaignFields || {};
    if (target_universe_id) {
      overrideFields[FormField.EXPERIENCE] = {
        paid_access: undefined,
        universe_id: target_universe_id,
        universe_name: 'Loading',
      };
      if (budget_in_micro_usd) {
        overrideFields[FormField.BUDGET] = MicroUsdToUsd(budget_in_micro_usd);
      }
      if (duration_in_days) {
        overrideFields[FormField.DURATION] =
          duration_in_days === 0 ? CONTINUOUS_VALUE : duration_in_days;
      }
      if (objective) {
        overrideFields[FormField.GOAL] = objective;
      }
    }
    return overrideFields;
  }, [prefilledCampaignFields]);

  // Return the default form values
  return useMemo(() => {
    // For new campaign mode, use defaults and prefilled fields
    const defaultStartMoment = getDefaultStartDateTime();
    const defaultStartDate = defaultStartMoment.format(DateFormat);
    const defaultStartTime = defaultStartMoment.format(TimeFormat);

    // For clone mode or edit mode, transform campaign data
    if ((isCloneMode || isEditMode) && campaign) {
      const campaignFields = transformCampaignToFormFields(campaign);
      const isOffPlatformCampaign = !!campaign?.off_platform_request_id;

      // Override with business logic
      const result: Partial<FormType> = {
        ...campaignFields,
        // Override detailed_targeting_match_type to use default if not set
        [FormField.DETAILED_TARGETING_MATCH_TYPE]:
          campaignFields[FormField.DETAILED_TARGETING_MATCH_TYPE] ??
          DefaultServerDetailedTargetingMatchType,
        // Override is_extend_to_off_platform_enabled
        [FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED]:
          campaignFields[FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED] && isGaasEnabled,
        // In edit mode, if there is a pending scheduled decrease, pre-fill the input with
        // that value so the user sees and edits the intended budget rather than the live one.
        ...(isEditMode && campaign.scheduled_budget_micro_usd
          ? { [FormField.BUDGET]: MicroUsdToUsd(campaign.scheduled_budget_micro_usd) }
          : {}),
      };

      // Special case for clone mode: if off-platform campaign and GaaS not enabled, use default objective
      if (isCloneMode && isOffPlatformCampaign && !isGaasEnabled) {
        result[FormField.GOAL] = DefaultServerCampaignObjectiveType;
      }

      // Override Start Date and Time and End Date and Time
      if (isCloneMode) {
        result[FormField.START_DATE] = defaultStartDate;
        result[FormField.START_TIME] = defaultStartTime;

        if (campaignFields.goal === ServerCampaignObjectiveType.REACH) {
          const defaultEndMoment = getDefaultStartDateTime().add(7, 'day');
          result[FormField.END_DATE] = defaultEndMoment.format(DateFormat);
          result[FormField.END_TIME] = defaultEndMoment.format(TimeFormat);
        }
      }

      return result;
    }

    return {
      [FormField.BID_TYPE]: DEFAULT_REACH_BID_TYPE,
      [FormField.BID_VALUE]: undefined,
      [FormField.BUDGET]: MicroUsdToUsd(defaultBudget),
      [FormField.BUDGET_TYPE]: ServerBudgetType.BUDGET_TYPE_DAILY,
      [FormField.CAMPAIGN_NAME]: '',
      [FormField.CLICK_DESTINATION]: undefined,
      [FormField.CREATIVE_FORMAT]: DEFAULT_REACH_AD_FORMAT,
      [FormField.CUSTOM_BUDGET]: false,
      [FormField.CUSTOM_DURATION]: false,
      [FormField.DETAILED_TARGETING_MATCH_TYPE]: DefaultServerDetailedTargetingMatchType,
      [FormField.DISCOUNT]: undefined,
      [FormField.DURATION]: defaultDuration,
      [FormField.EXPERIENCE]: fallbackUniverse,
      [FormField.GOAL]: DefaultServerCampaignObjectiveType,
      [FormField.HEADLINE]: undefined,
      [FormField.IDEMPOTENCY_KEY]: uuidv4(),
      [FormField.IS_AUTO_RELOAD_ENABLED]: true,
      [FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED]: false,
      [FormField.LAUNCH_DATA]: undefined,
      [FormField.LOGO_ASSETS]: [],
      [FormField.PAYMENT_TYPE]: getDefaultPaymentType(),
      [FormField.PLACE_ID_OVERRIDE]: undefined,
      [FormField.START_DATE]: defaultStartDate,
      [FormField.START_TIME]: defaultStartTime,
      [FormField.SUBTITLE]: undefined,
      [FormField.THUMBNAILS]: [],
      [FormField.VIDEOS]: [],
      ...getOverridePrefilledFields(),
    };
  }, [
    campaign,
    isCloneMode,
    isEditMode,
    defaultBudget,
    defaultDuration,
    getDefaultPaymentType,
    getDefaultStartDateTime,
    fallbackUniverse,
    isGaasEnabled,
    transformCampaignToFormFields,
    getOverridePrefilledFields,
  ]);
};
