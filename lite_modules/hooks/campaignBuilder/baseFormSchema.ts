import { useMemo } from 'react';
import { z } from 'zod';

import {
  ServerBudgetType,
  ServerCampaignObjectiveType,
  ServerDetailedTargetingMatchType,
  ServerPaymentType,
} from '@constants/campaign';
import {
  AssetSource,
  CONTINUOUS_VALUE,
  DEFAULT_HEADLINE_MAX_LENGTH,
  DEFAULT_SUBTITLE_MAX_LENGTH,
  FormField,
  ReachAdFormat,
} from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useAppStore } from '@stores/appStoreProvider';
import { ServerAdSetBidType } from '@type/adSet';
import { VideoUploadState } from '@type/fileUpload';

const useFormSchema = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const maxHeadlineLength =
    useAppStore((state) => state.appMetadataState?.data?.maxHeadlineLengthInChars) ||
    DEFAULT_HEADLINE_MAX_LENGTH;
  const maxSubtitleLength =
    useAppStore((state) => state.appMetadataState?.data?.maxSubtitleLengthInChars) ||
    DEFAULT_SUBTITLE_MAX_LENGTH;

  return useMemo(
    () =>
      z.object({
        [FormField.BID_TYPE]: z.enum(ServerAdSetBidType).optional(),
        [FormField.BID_VALUE]: z.number().positive().optional(),
        [FormField.BUDGET]: z
          .number({
            error: (issue) =>
              issue.input === undefined
                ? translate('Validation.BudgetRequired')
                : translate('Validation.BudgetRequired'),
          })
          .positive()
          .min(0.01, {
            error: translate('Validation.BudgetRequired'),
          }),
        [FormField.BUDGET_TYPE]: z.enum(ServerBudgetType, {
          error: (issue) =>
            issue.input === undefined ? translate('Validation.BudgetTypeRequired') : undefined,
        }),
        [FormField.CAMPAIGN_NAME]: z
          .string()
          .min(1, {
            error: translate('Validation.CampaignNameRequired'),
          })
          .max(128, {
            error: translate('Validation.CampaignNameMaxLength'),
          })
          .regex(/^[^&<>"']*$/, {
            error: translate('Validation.CampaignNameSpecialChars'),
          }),
        // Optional clickout URL for 1x2 video ads. Only sent to the API for the
        // vertical format; image (2x1) ads reject it server-side.
        [FormField.CLICK_DESTINATION]: z.string().optional(),
        [FormField.CREATIVE_FORMAT]: z.enum(ReachAdFormat).optional(),
        [FormField.CUSTOM_BUDGET]: z.boolean(),
        [FormField.CUSTOM_DURATION]: z.boolean(),
        [FormField.DETAILED_TARGETING_MATCH_TYPE]: z.enum(ServerDetailedTargetingMatchType),
        [FormField.DISCOUNT]: z.number().min(0).max(100).optional(),
        [FormField.DURATION]: z.int().positive().or(z.literal(CONTINUOUS_VALUE)),
        [FormField.END_DATE]: z.string().optional(),
        [FormField.END_TIME]: z.string().optional(),
        [FormField.EXPERIENCE]: z.object({
          paid_access: z.boolean().optional(),
          universe_id: z.number().gt(0),
          universe_name: z.string(),
        }),
        [FormField.FREQUENCY_CAPPING_DURATION_DAYS]: z.number().min(1).max(30).optional(),
        [FormField.FREQUENCY_CAPPING_ON]: z.boolean().optional(),
        [FormField.FREQUENCY_CAPPING_VALUE]: z.number().min(1).max(100).optional(),
        [FormField.GOAL]: z.enum(ServerCampaignObjectiveType),
        [FormField.HEADLINE]: z.string().min(1).max(maxHeadlineLength).optional(),
        [FormField.IDEMPOTENCY_KEY]: z.string(),
        [FormField.IS_AUTO_RELOAD_ENABLED]: z.boolean(),
        [FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED]: z.boolean(),
        [FormField.LAUNCH_DATA]: z.string().max(200).optional(),
        [FormField.LOGO_ASSETS]: z.array(
          z.object({
            aspectRatio: z.string().optional(),
            assetId: z.number(),
            creativeOrigin: z.enum(['upload', 'library', 'ai']).optional(),
            existing: z.boolean(),
            isSelected: z.boolean(),
            source: z.enum(AssetSource).optional(),
          }),
        ),
        [FormField.PAYMENT_TYPE]: z.enum(ServerPaymentType),
        [FormField.PLACE_ID_OVERRIDE]: z.number().optional(),
        [FormField.START_DATE]: z.string(),
        [FormField.START_TIME]: z.string(),
        [FormField.SUBTITLE]: z.string().max(maxSubtitleLength).optional(),
        [FormField.THUMBNAILS]: z.array(
          z.object({
            assetId: z.number(),
            creativeOrigin: z.enum(['upload', 'library', 'ai']).optional(),
            existing: z.boolean(),
            isSelected: z.boolean(),
            source: z.enum(AssetSource).optional(),
          }),
        ),
        [FormField.VIDEOS]: z.array(
          z.object({
            assetId: z.string().optional(),
            cancelCb: z.function().optional(),
            duration: z.number().optional(),
            error: z.string().optional(),
            file: z.instanceof(File).or(z.instanceof(Blob)),
            height: z.number().optional(),
            id: z.string(),
            isSelected: z.boolean().optional(),
            progress: z.number(),
            state: z.enum(VideoUploadState),
            width: z.number().optional(),
          }),
        ),
      }),
    [translate, maxHeadlineLength, maxSubtitleLength],
  );
};

export type FormType = z.infer<ReturnType<typeof useFormSchema>>;

export default useFormSchema;
