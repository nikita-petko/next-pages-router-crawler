import { zodResolver } from '@hookform/resolvers/zod';
import { adPolicyLabelEnumToText, AdPolicyReviewLabelType } from '@rbx/ads-moderation-ui';
import { Button, Dropdown, Menu, MenuItem, TextInput } from '@rbx/foundation-ui';
import { type ReactElement, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { openDialog } from '@components/common/dialog/actions';
import BaseDialog from '@components/common/dialog/BaseDialog';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import {
  type AiCreativeReportReason,
  MAX_AI_CREATIVE_FEEDBACK_DETAILS_LENGTH,
} from '@constants/aiCreatives';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

// Explicit allowlist of the AdPolicyReviewLabel community-standards moderation
// violations (ad_entity_enums.proto AdPolicyReviewLabel.Enum values 1-28) a user can
// report on a static, AI-generated image. Enumerated explicitly rather than derived
// from a positional enum range: a `<= VIOLENT_CONTENT_AND_GORE` bound would silently
// drop a valid reason if upstream inserts a new moderation label after the ads-specific
// block (value 29+), with no test to catch it. Any taxonomy change now requires a
// conscious edit here, which the dialog test locks against the real label map.
//
// Moderation labels intentionally omitted because they can't apply to a still image:
//   - Disruptive Audio (9) / Harmful Off-Platform Speech and Behavior (11): describe an
//     audio track or off-creative conduct a static image can't contain.
//   - Illegal and Regulated Activities (12): deprecated in the proto, superseded by
//     Illegal and Regulated (46).
// Values 29+ are "Ads-Specific Rejection Reasons" (ad-integration classification
// labels), not user-reportable creative violations, so they're excluded by omission.
const AI_CREATIVE_REPORT_REASONS: readonly AiCreativeReportReason[] = [
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_ABUSE_OF_ROBLOX_EMPLOYEES_OR_AFFILIATES,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_BULLYING_AND_HARASSMENT,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_CHEATING_AND_EXPLOITS,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_CHILD_ENDANGERMENT,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_CONTESTS_AND_SWEEPSTAKES,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_DATING_AND_ROMANTIC_CONTENT,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_DIRECTING_USERS_OFF_PLATFORM,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_DISCRIMINATION_AND_HATE,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_EXTORTION_AND_BLACKMAIL,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_IP_VIOLATIONS,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_MISLEADING_IMPERSONATION_MISREPRESENTATION,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_MISUSING_ROBLOX_SYSTEMS,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_POLITICAL_CONTENT,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_PROFANITY,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_REAL_WORLD_DANGEROUS_ACTIVITIES,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_REAL_WORLD_TRAGEDY,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_ROBLOX_ECONOMY,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_SCAMS,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_SEXUAL_CONTENT,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_SHARING_PII,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_SPAM,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_SUICIDE_AND_SELF_HARM,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_TVE,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_THREATS_OF_VIOLENCE,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_VIOLENT_CONTENT_AND_GORE,
].map((label) => label as AiCreativeReportReason);

export interface AiCreativeFeedbackSubmitPayload {
  details?: string;
  imageUrl: string;
  reason: AiCreativeReportReason;
}

interface AiCreativeFeedbackDialogProps extends BaseInjectedDialogProps {
  imageUrl: string;
  onSubmit: (payload: AiCreativeFeedbackSubmitPayload) => void;
}

const AiCreativeFeedbackDialog = ({
  imageUrl,
  onClose,
  onSubmit,
}: AiCreativeFeedbackDialogProps): ReactElement => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.CreativeLibrary);
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);

  const feedbackSchema = useMemo(
    () =>
      z.object({
        // The details input hard-caps length via the TextInput onChange slice, so
        // form state can never exceed the max — no schema .max() needed here.
        details: z.string().optional(),
        // AdPolicyReviewLabel is a numeric enum, so the reason is a number constrained
        // at runtime to the curated subset surfaced in the dropdown. We keep the
        // schema's output as `number` (rather than a type-guard refine) so the zod
        // input/output types stay aligned for react-hook-form; the narrowing back to
        // AiCreativeReportReason happens at the submit boundary.
        reason: z
          .number({
            error: (issue) =>
              issue.input === undefined ? translate('Validation.ReportReasonRequired') : undefined,
          })
          .refine((value) => AI_CREATIVE_REPORT_REASONS.includes(value as AiCreativeReportReason), {
            message: translate('Validation.ReportReasonRequired'),
          }),
      }),
    [translate],
  );

  type FeedbackFormType = z.infer<typeof feedbackSchema>;

  const {
    control,
    formState: { isValid },
    handleSubmit,
    reset,
  } = useForm<FeedbackFormType>({
    defaultValues: {
      details: '',
      reason: undefined,
    },
    mode: 'onChange',
    resolver: zodResolver(feedbackSchema),
  });

  const handleFormSubmit = (data: FeedbackFormType) => {
    onSubmit({
      details: data.details?.trim() ? data.details.trim() : undefined,
      imageUrl,
      reason: data.reason as AiCreativeReportReason,
    });
    reset();
    onClose();
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  // Labels come straight from the shared ads-moderation map, which is the single source
  // of truth for this taxonomy across moderation surfaces but only ships English text —
  // there are no @rbx/intl keys for the AdPolicyReviewLabel enum. We intentionally render
  // that English here (rather than minting parallel translation keys) so the reasons stay
  // in lockstep with the canonical enum and don't drift from other moderation UIs. If/when
  // the shared package exposes localized strings, swap this lookup to use them.
  const getReportReasonLabel = (reason: AiCreativeReportReason): string =>
    adPolicyLabelEnumToText.get(reason as AdPolicyReviewLabelType) ?? String(reason);

  return (
    <BaseDialog
      dialogBody={
        <div className='flex flex-col gap-large padding-top-small'>
          <Controller
            control={control}
            name='reason'
            render={({ field, fieldState }) => (
              <div className='flex flex-col gap-xsmall width-full'>
                <Dropdown
                  label={translate('Label.ReportReason')}
                  onValueChange={(value) => {
                    field.onChange(Number(value));
                  }}
                  placeholder={translate('Label.SelectReportReason')}
                  size='Medium'
                  value={field.value != null ? String(field.value) : undefined}>
                  <Menu>
                    {AI_CREATIVE_REPORT_REASONS.map((reason) => (
                      <MenuItem
                        key={String(reason)}
                        title={getReportReasonLabel(reason)}
                        value={String(reason)}
                      />
                    ))}
                  </Menu>
                </Dropdown>
                {fieldState.error?.message ? (
                  <p className='text-caption-small content-system-alert margin-[0px]'>
                    {fieldState.error.message}
                  </p>
                ) : null}
              </div>
            )}
          />
          <Controller
            control={control}
            name='details'
            render={({ field, fieldState }) => (
              <div className='flex flex-col gap-xsmall width-full'>
                <TextInput
                  label={translate('Label.ReportDetailsOptional')}
                  name={field.name}
                  onBlur={field.onBlur}
                  onChange={(event) => {
                    field.onChange(
                      event.target.value.slice(0, MAX_AI_CREATIVE_FEEDBACK_DETAILS_LENGTH),
                    );
                  }}
                  placeholder={translate('Label.ReportDetailsPlaceholder')}
                  size='Medium'
                  value={field.value ?? ''}
                />
                {fieldState.error?.message ? (
                  <p className='text-caption-small content-system-alert margin-[0px]'>
                    {fieldState.error.message}
                  </p>
                ) : null}
              </div>
            )}
          />
        </div>
      }
      dialogDescription={translate('Description.ReportAdPrompt')}
      dialogFooter={
        <>
          <Button
            isDisabled={!isValid}
            onClick={handleSubmit(handleFormSubmit)}
            size='Medium'
            variant='Emphasis'>
            {translateReport('Action.Submit')}
          </Button>
          <Button onClick={handleCancel} size='Medium' variant='Standard'>
            {translate('Action.Cancel')}
          </Button>
        </>
      }
      dialogTitle={translate('Heading.ReportAd')}
    />
  );
};

export const openAiCreativeFeedbackDialog = (
  imageUrl: string,
  onSubmit: (payload: AiCreativeFeedbackSubmitPayload) => void,
): void => {
  openDialog({ component: AiCreativeFeedbackDialog, props: { imageUrl, onSubmit } });
};

export default AiCreativeFeedbackDialog;
