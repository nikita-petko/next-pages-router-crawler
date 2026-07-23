import { mapValues } from 'lodash';
import moment from 'moment-timezone';
import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { FormState, UseFormReturn } from 'react-hook-form';

import { ServerAdAssetType } from '@constants/ad';
import { defaultTimeZone } from '@constants/app';
import { isAdCreditPaymentType, ServerCampaignObjectiveType } from '@constants/campaign';
import {
  AssetSource,
  CONTINUOUS_VALUE,
  DateFormat,
  FormField,
  ReachAdFormat,
  TimeFormat,
} from '@constants/campaignBuilder';
import { EntityType } from '@constants/entity';
import type { FormType as AdvancedTargetingFormType } from '@hooks/campaignBuilder/advancedTargetingFormSchema';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { ServerAdSetBidType } from '@type/adSet';
import { CreationCampaignType, ThumbnailType } from '@type/campaignBuilder';
import { UploadedVideoType, VideoUploadState } from '@type/fileUpload';
import { FormatTargetingCriteriaRequestJson } from '@utils/advancedTargeting';
import { MicroUsdToUsd, UsdToMicroUsd } from '@utils/currency';
import { ConvertEntityTypeEnumToString } from '@utils/enumToString';
import { GetTimezoneObjFromEnum, GetValidatedTimezoneDbName } from '@utils/timezone';

interface UseTransformFormToCampaignParams {
  advancedTargetingFormMethods?: UseFormReturn<AdvancedTargetingFormType>;
}

/**
 * Convert raw logging params object to Record<string, string>
 */
const convertLoggingParamsToStrings = (
  loggingParamsRaw: Record<string, number | string | boolean | undefined | null | string[]>,
): Record<string, string> =>
  mapValues(loggingParamsRaw, (value) =>
    value === undefined || value === null ? '' : String(value),
  );

/**
 * Hook to transform form data into campaign creation API request format
 */
export const useTransformFormToCampaign = ({
  advancedTargetingFormMethods,
}: UseTransformFormToCampaignParams) => {
  // Get timezone from app store
  const { timezoneDbName: rawTimezoneDbName } = useAppStore((state) =>
    GetTimezoneObjFromEnum(
      state.advertiserState?.data?.organization?.time_zone || defaultTimeZone.value,
    ),
  );
  const timezoneDbName = GetValidatedTimezoneDbName(rawTimezoneDbName);

  // Get ad credit balance
  const adCreditBalance = useAppStore(
    (state) => state.adCreditState?.data?.ad_credit_balance_in_micro || 0,
  );

  // Get campaign builder store values for logging
  const flowType = useCampaignBuilderStore((state) => state.flowType);
  const durations = useCampaignBuilderStore(
    (state) => state.recommendation?.duration_options_in_days || [],
  );
  const audienceEstimationContext = useCampaignBuilderStore(
    (state) => state.audienceEstimationContext,
  );
  const budgetOptionsByAudience = useCampaignBuilderStore(
    (state) => state.recommendation?.budget_options_by_audience_in_micro_usd,
  );
  const { data: universesCanAdvertise } = useCampaignBuilderStore(
    (state) => state.universesCanAdvertise,
  );
  const simplifiedCampaign = useCampaignBuilderStore((state) => state.simplifiedCampaign?.data);

  // Get router for cloning campaign ID
  const router = useRouter();

  const transformDuration = useCallback(
    (data: FormType) =>
      data[FormField.DURATION] === CONTINUOUS_VALUE ? 0 : data[FormField.DURATION],
    [],
  );

  const transformStartTime = useCallback(
    (data: FormType) =>
      moment
        .tz(
          `${data[FormField.START_DATE]} ${data[FormField.START_TIME]}`,
          `${DateFormat} ${TimeFormat}`,
          timezoneDbName,
        )
        .valueOf(),
    [timezoneDbName],
  );

  const transformIsAutoReloadAdCreditEnabled = useCallback(
    (data: FormType) =>
      data[FormField.IS_AUTO_RELOAD_ENABLED] && isAdCreditPaymentType(data[FormField.PAYMENT_TYPE]),
    [],
  );

  const transformOffPlatformDevAssetIds = useCallback(
    (data: FormType) =>
      data[FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED] &&
      data[FormField.GOAL] === ServerCampaignObjectiveType.SPEND
        ? data[FormField.VIDEOS].map((video: UploadedVideoType) =>
            parseInt(String(video.assetId || 0), 10),
          )
        : undefined,
    [],
  );

  const transformAssetIds = useCallback((data: FormType) => {
    const goal = data[FormField.GOAL];
    const isExtendToOffPlatformEnabled = data[FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED];

    if (goal === ServerCampaignObjectiveType.REACH) {
      return [];
    }

    if (goal === ServerCampaignObjectiveType.SPEND && isExtendToOffPlatformEnabled) {
      return [];
    }

    // Dedupe so a single create request can't carry the same asset id twice.
    return Array.from(
      new Set(
        data[FormField.THUMBNAILS]
          .filter(({ isSelected }) => isSelected)
          .map(({ assetId }) => assetId),
      ),
    );
  }, []);

  const transformSponsoredAds = useCallback((data: FormType) => {
    const selectedLogoData = data[FormField.LOGO_ASSETS].find(({ isSelected }) => isSelected);
    const selectedLogo = selectedLogoData?.assetId;
    const logoAspectRatio = selectedLogoData?.aspectRatio;

    // Extract width from aspect ratio string (e.g., "3:1" -> 3)
    const logoAspectWidth = logoAspectRatio
      ? parseInt(logoAspectRatio.split(':')[0], 10)
      : undefined;

    // The clickout URL is only valid for 1x2 (video) ads — the backend rejects
    // it as a forbidden field on 2x1 (image) ads.
    const isVerticalFormat = data[FormField.CREATIVE_FORMAT] === ReachAdFormat.VERTICAL_1X2;
    const clickDestination = data[FormField.CLICK_DESTINATION]?.trim();
    const clickoutUrl = isVerticalFormat && clickDestination ? clickDestination : undefined;

    // 1x2 vertical reach is a video ad: the primary asset is the uploaded video
    // (asset_type VIDEO) and the selected image is its poster/fallback
    // (thumbnail_asset_id). Cap to a single poster so we do not emit N ads
    // that all share the same video asset_id. 2x1 horizontal stays an image
    // ad (asset_id = image) and may still carry multiple selections.
    const finishedVideo = data[FormField.VIDEOS].find(
      (video: UploadedVideoType) => video.state === VideoUploadState.FINISHED && !!video.assetId,
    );
    const videoAssetId = finishedVideo?.assetId ? parseInt(finishedVideo.assetId, 10) : undefined;
    const useVideoAsset = isVerticalFormat && videoAssetId !== undefined;
    const selectedThumbnails = data[FormField.THUMBNAILS].filter(({ isSelected }) => isSelected);
    const thumbnailsForAds = useVideoAsset ? selectedThumbnails.slice(0, 1) : selectedThumbnails;

    return data[FormField.GOAL] === ServerCampaignObjectiveType.REACH
      ? thumbnailsForAds.map(({ assetId }) => ({
          asset_id: useVideoAsset ? videoAssetId : assetId,
          ...(useVideoAsset && {
            asset_type: ServerAdAssetType.VIDEO,
            thumbnail_asset_id: assetId,
          }),
          headline: data[FormField.HEADLINE] || '',
          ...(clickoutUrl !== undefined && { clickout_url: clickoutUrl }),
          ...(selectedLogo !== undefined && { logo_asset_id: selectedLogo }),
          ...(logoAspectWidth !== undefined && { logo_asset_aspect_width: logoAspectWidth }),
          ...(data[FormField.SUBTITLE] !== undefined && { subtitle: data[FormField.SUBTITLE] }),
        }))
      : undefined;
  }, []);

  const transformFrequencyCappingRules = useCallback(
    (data: FormType) =>
      data[FormField.FREQUENCY_CAPPING_ON] &&
      data[FormField.FREQUENCY_CAPPING_DURATION_DAYS] &&
      data[FormField.FREQUENCY_CAPPING_VALUE]
        ? [
            {
              duration_days: data[FormField.FREQUENCY_CAPPING_DURATION_DAYS],
              value: data[FormField.FREQUENCY_CAPPING_VALUE],
            },
          ]
        : undefined,
    [],
  );

  const transformBidValueMicroUsd = useCallback((data: FormType) => {
    if (data[FormField.GOAL] === ServerCampaignObjectiveType.REACH && data[FormField.BID_VALUE]) {
      return UsdToMicroUsd(data[FormField.BID_VALUE]);
    }
    return undefined;
  }, []);

  // A REACH video ad may omit target_universe_id when a clickout URL is set,
  // so drop the universe id whenever a non-empty clickout URL is provided.
  const transformTargetUniverseId = useCallback((data: FormType) => {
    const clickDestination = data[FormField.CLICK_DESTINATION]?.trim();
    const hasClickoutUrl =
      data[FormField.CREATIVE_FORMAT] === ReachAdFormat.VERTICAL_1X2 && !!clickDestination;
    return hasClickoutUrl ? undefined : data[FormField.EXPERIENCE].universe_id;
  }, []);

  // Max Reach campaigns carry an explicit bid type (CPM or CPV2). Other
  // objectives derive their bid type server-side, so leave it unset.
  const transformBidType = useCallback((data: FormType) => {
    if (data[FormField.GOAL] === ServerCampaignObjectiveType.REACH) {
      return data[FormField.BID_TYPE] ?? ServerAdSetBidType.CPM_CHARGE;
    }
    return undefined;
  }, []);

  const transformDiscountBps = useCallback((data: FormType) => {
    if (data[FormField.GOAL] === ServerCampaignObjectiveType.REACH && data[FormField.DISCOUNT]) {
      // Convert discount percentage to basis points (1% = 100 bps)
      return data[FormField.DISCOUNT] * 100;
    }
    return undefined;
  }, []);

  const transformTargetingCriteria = useCallback(
    (data: FormType) => {
      if (
        (data[FormField.GOAL] === ServerCampaignObjectiveType.VISITS ||
          data[FormField.GOAL] === ServerCampaignObjectiveType.REACH ||
          data[FormField.GOAL] === ServerCampaignObjectiveType.SPEND) &&
        !data[FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED] &&
        advancedTargetingFormMethods
      ) {
        return FormatTargetingCriteriaRequestJson(advancedTargetingFormMethods.getValues());
      }
      return undefined;
    },
    [advancedTargetingFormMethods],
  );

  const transformEndTimestampMs = useCallback(
    (data: FormType) => {
      if (data[FormField.END_DATE] && data[FormField.END_TIME]) {
        return moment
          .tz(
            `${data[FormField.END_DATE]} ${data[FormField.END_TIME]}`,
            `${DateFormat} ${TimeFormat}`,
            timezoneDbName,
          )
          .valueOf();
      }
      return undefined;
    },
    [timezoneDbName],
  );

  const transformFormToCampaignCreation = useCallback(
    (data: FormType): CreationCampaignType => ({
      asset_ids: transformAssetIds(data),
      bid_discount_bps: transformDiscountBps(data),
      bid_type: transformBidType(data),
      bid_value_micro_usd: transformBidValueMicroUsd(data),
      budget_in_micro_usd: UsdToMicroUsd(data[FormField.BUDGET]),
      budget_type: data[FormField.BUDGET_TYPE],
      detailed_targeting_match_type: data[FormField.DETAILED_TARGETING_MATCH_TYPE],
      duration_in_days: transformDuration(data),
      end_timestamp_ms: transformEndTimestampMs(data),
      frequency_capping_rules: transformFrequencyCappingRules(data),
      is_auto_reload_ad_credit_enabled: transformIsAutoReloadAdCreditEnabled(data),
      is_off_platform_request: data[FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED],
      launch_data_override: data[FormField.LAUNCH_DATA] || undefined,
      name: data[FormField.CAMPAIGN_NAME],
      objective: data[FormField.GOAL],
      payment_type: data[FormField.PAYMENT_TYPE],
      place_id_override: data[FormField.PLACE_ID_OVERRIDE] || undefined,
      raw_video_asset_ids: transformOffPlatformDevAssetIds(data),
      sponsored_ads: transformSponsoredAds(data),
      start_timestamp_ms: transformStartTime(data),
      target_universe_id: transformTargetUniverseId(data),
      targeting_criteria: transformTargetingCriteria(data),
    }),
    [
      transformAssetIds,
      transformBidType,
      transformBidValueMicroUsd,
      transformDuration,
      transformFrequencyCappingRules,
      transformIsAutoReloadAdCreditEnabled,
      transformOffPlatformDevAssetIds,
      transformDiscountBps,
      transformStartTime,
      transformSponsoredAds,
      transformTargetUniverseId,
      transformTargetingCriteria,
      transformEndTimestampMs,
    ],
  );

  const transformFormToCampaignCreationLoggingParams = useCallback(
    (data: FormType): Record<string, string> => {
      // Get selected creatives for logging
      const creatives = data[FormField.THUMBNAILS];
      const selectedCreatives = creatives.filter(({ isSelected }) => isSelected);
      const importedThumbnails = selectedCreatives.filter(
        ({ source }) => source === AssetSource.CREATOR,
      );
      const uploadedThumbnails = selectedCreatives.filter(
        ({ source }) => source === AssetSource.ADS_MANAGER,
      );
      const sourceBreakdown = selectedCreatives.reduce(
        (counts, creative) => {
          if (creative.creativeOrigin === 'ai') {
            return { ...counts, ai: counts.ai + 1 };
          }
          if (creative.creativeOrigin === 'library') {
            return { ...counts, library: counts.library + 1 };
          }
          if (creative.creativeOrigin === 'upload') {
            return { ...counts, upload: counts.upload + 1 };
          }
          // Legacy fallback while old draft entries still only carry `source`.
          if (creative.source === AssetSource.CREATOR) {
            return { ...counts, library: counts.library + 1 };
          }
          if (creative.source === AssetSource.ADS_MANAGER) {
            return { ...counts, upload: counts.upload + 1 };
          }
          return counts;
        },
        { ai: 0, library: 0, upload: 0 },
      );

      // Calculate logging parameters
      const objective = data[FormField.GOAL];
      const detailedTargetingMatchType = data[FormField.DETAILED_TARGETING_MATCH_TYPE];
      // Use audience-based budget options
      const budgetOptions = budgetOptionsByAudience?.[detailedTargetingMatchType] || [];
      const audienceEstimate = audienceEstimationContext?.estimates[detailedTargetingMatchType];

      const loggingParamsRaw = {
        adCreditBalance: MicroUsdToUsd(adCreditBalance),
        aiCount: sourceBreakdown.ai,
        audienceEstimate: JSON.stringify(audienceEstimate?.data || ''),
        budget: data[FormField.BUDGET],
        budgetIsMiddleRecommended: budgetOptions
          .filter((budget) => budget.is_recommended)
          .map((budget) => MicroUsdToUsd(budget.value))
          .includes(data[FormField.BUDGET]),
        budgetIsRecommended: budgetOptions
          .map((budget) => MicroUsdToUsd(budget.value))
          .includes(data[FormField.BUDGET]),
        budgetType: data[FormField.BUDGET_TYPE],
        chosenUniverseIndex:
          universesCanAdvertise?.findIndex(
            (universe) => universe.universe_id === data[FormField.EXPERIENCE].universe_id,
          ) ?? -1,
        cloningCampaignId: router.query.campaignId,
        discount: transformDiscountBps(data),
        duration: transformDuration(data),
        durationIsMiddleRecommended: durations
          .filter((durationOption) => durationOption.is_recommended)
          .map((durationOption) => durationOption.value)
          .includes(data[FormField.DURATION]),
        durationIsRecommended: durations
          .map((durationOption) => durationOption.value)
          .includes(data[FormField.DURATION]),
        endTimestampMs: transformEndTimestampMs(data),
        flowType,
        frequencyCappingRules: JSON.stringify(transformFrequencyCappingRules(data) || {}),
        importedThumbnailsCount: importedThumbnails.length,
        isAutoReloadAdCreditEnabled: transformIsAutoReloadAdCreditEnabled(data),
        launchData: data[FormField.LAUNCH_DATA],
        libraryCount: sourceBreakdown.library,
        objective,
        offPlatformDevAssetIds: transformOffPlatformDevAssetIds(data)?.join(',') || undefined,
        optionsLength: universesCanAdvertise?.length,
        paymentType: data[FormField.PAYMENT_TYPE],
        placeIdOverride: data[FormField.PLACE_ID_OVERRIDE],
        targetingCriteria: JSON.stringify(transformTargetingCriteria(data) || {}),
        universeId: data[FormField.EXPERIENCE].universe_id,
        uploadCount: sourceBreakdown.upload,
        uploadedThumbnailsCount: uploadedThumbnails.length,
        uploadedVideosCount: data[FormField.VIDEOS].length,
      };

      return convertLoggingParamsToStrings(loggingParamsRaw);
    },
    [
      adCreditBalance,
      audienceEstimationContext,
      transformDuration,
      transformIsAutoReloadAdCreditEnabled,
      transformOffPlatformDevAssetIds,
      durations,
      flowType,
      budgetOptionsByAudience,
      router.query.campaignId,
      universesCanAdvertise,
      transformTargetingCriteria,
      transformEndTimestampMs,
      transformFrequencyCappingRules,
      transformDiscountBps,
    ],
  );

  const transformFormToCampaignEdit = useCallback(
    (data: FormType, dirtyFields: FormState<FormType>['dirtyFields']) => {
      const budgetInMicroUSD = dirtyFields[FormField.BUDGET]
        ? UsdToMicroUsd(data[FormField.BUDGET])
        : undefined;

      const durationInDays = transformDuration(data);

      // Don't attempt to update start time if it hasn't changed, otherwise it will throw an error if set in the past
      const startTimestampMs =
        dirtyFields[FormField.START_TIME] || dirtyFields[FormField.START_DATE]
          ? transformStartTime(data)
          : undefined;

      // Don't attempt to update end time if it hasn't changed
      const endTimestampMs =
        dirtyFields[FormField.END_TIME] || dirtyFields[FormField.END_DATE]
          ? transformEndTimestampMs(data)
          : undefined;

      // Only submit selected creatives that aren't already on the campaign
      // (`existing` is set from the campaign's sponsored_ads/asset_ids when the
      // form loads), and dedupe so a single request can't carry the same id
      // twice — the backend adds the first, then rejects the second with
      // "AssetId already exists on this campaign".
      const assetIds = Array.from(
        new Set(
          data[FormField.THUMBNAILS]
            .filter(({ existing, isSelected }) => isSelected && !existing)
            .map(({ assetId }) => assetId),
        ),
      );

      // Handle off-platform asset IDs for video
      const offPlatformAssetIds =
        data[FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED] && data[FormField.VIDEOS]
          ? data[FormField.VIDEOS]
              .map((video: UploadedVideoType) => parseInt(String(video.assetId || 0), 10))
              .filter((assetId: number) => assetId !== 0)
          : undefined;

      const isReachObjective = data[FormField.GOAL] === ServerCampaignObjectiveType.REACH;

      return {
        asset_ids: assetIds,
        budget_in_micro_usd: budgetInMicroUSD,
        ...(isReachObjective
          ? { end_timestamp_ms: endTimestampMs }
          : { duration_in_days: durationInDays }),
        is_auto_reload_ad_credit_enabled: data[FormField.IS_AUTO_RELOAD_ENABLED],
        name: data[FormField.CAMPAIGN_NAME],
        raw_video_asset_ids: offPlatformAssetIds,
        start_timestamp_ms: startTimestampMs,
      };
    },
    [transformDuration, transformStartTime, transformEndTimestampMs],
  );

  const transformFormToCampaignEditLoggingParams = useCallback(
    (
      data: FormType,
      dirtyFields: Partial<Record<keyof FormType, boolean | object>>,
    ): Record<string, string> => {
      const previousStartTime =
        dirtyFields[FormField.START_TIME] || dirtyFields[FormField.START_DATE]
          ? simplifiedCampaign?.start_timestamp_ms
          : undefined;

      const previousEndTime =
        dirtyFields[FormField.END_TIME] || dirtyFields[FormField.END_DATE]
          ? simplifiedCampaign?.end_timestamp_ms
          : undefined;

      const assetIds = data[FormField.THUMBNAILS]
        .filter(({ existing, isSelected }: ThumbnailType) => isSelected && !existing)
        .map(({ assetId }: ThumbnailType) => assetId);

      const loggingParamsRaw = {
        assetIds: assetIds.join(','),
        budget: UsdToMicroUsd(data[FormField.BUDGET]),
        cloningCampaignId: JSON.stringify(router.query.campaignId) || '',
        duration: transformDuration(data),
        endTime: transformEndTimestampMs(data),
        entityType: ConvertEntityTypeEnumToString(EntityType.ENTITY_TYPE_CAMPAIGN),
        flowType,
        launchData: data[FormField.LAUNCH_DATA],
        name: data[FormField.CAMPAIGN_NAME],
        placeIdOverride: data[FormField.PLACE_ID_OVERRIDE],
        previousBudget: simplifiedCampaign?.budget_in_micro_usd,
        previousDuration: simplifiedCampaign?.duration_in_days,
        previousEndTime,
        previousName: simplifiedCampaign?.name,
        previousStartTime,
        startTime: transformStartTime(data),
      };

      return convertLoggingParamsToStrings(loggingParamsRaw);
    },
    [
      flowType,
      router.query.campaignId,
      simplifiedCampaign,
      transformDuration,
      transformEndTimestampMs,
      transformStartTime,
    ],
  );

  return {
    transformFormToCampaignCreation,
    transformFormToCampaignCreationLoggingParams,
    transformFormToCampaignEdit,
    transformFormToCampaignEditLoggingParams,
  };
};
