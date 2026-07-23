import { zodResolver } from '@hookform/resolvers/zod';
import moment from 'moment-timezone';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  AdIntegrationFormField,
  MaxAdvertiserNameLength,
  MaxCampaignNameLength,
} from '@constants/adIntegrations';
import { DateFormat, TimeFormat } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import {
  AdIntegrationCampaignDetailsFormValues,
  AdIntegrationFormMode,
} from '@type/adIntegrations';

export const getIsCampaignInProgress = (
  mode: AdIntegrationFormMode,
  startDate: string,
  timezoneDbName: string,
): boolean =>
  mode === 'edit' &&
  Boolean(startDate) &&
  moment.tz(startDate, DateFormat, timezoneDbName).isBefore(moment().tz(timezoneDbName), 'day');

export const getIsCampaignEnded = (
  mode: AdIntegrationFormMode,
  endDate: string,
  timezoneDbName: string,
): boolean =>
  mode === 'edit' &&
  Boolean(endDate) &&
  moment.tz(endDate, DateFormat, timezoneDbName).isBefore(moment().tz(timezoneDbName), 'day');

const useAdIntegrationCampaignDetailsSchema = (
  campaignInProgress: boolean,
  timezoneDbName: string,
  minimumStartTimestampMsUtc: number,
) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateAccount } = useNamespacedTranslation(TranslationNamespace.Account);
  const { translate: translateCreativeLibrary } = useNamespacedTranslation(
    TranslationNamespace.CreativeLibrary,
  );

  return useMemo(
    () =>
      z
        .object({
          // Ads category is no longer collected in the form; the API always
          // receives UNSPECIFIED. Kept on the schema so defaultValues still parse.
          [AdIntegrationFormField.AdsCategory]: z.string(),
          [AdIntegrationFormField.AdvertiserName]: z
            .string()
            .min(
              1,
              translate('Validation.FieldRequired', {
                fieldName: translateAccount('Label.AdvertiserName'),
              }),
            )
            .max(
              MaxAdvertiserNameLength,
              translate('Validation.FieldMaxLength', {
                fieldMaxLength: String(MaxAdvertiserNameLength),
                fieldName: translateAccount('Label.AdvertiserName'),
              }),
            ),
          [AdIntegrationFormField.CampaignName]: z
            .string()
            .min(
              1,
              translate('Validation.FieldRequired', {
                fieldName: translateCampaign('Label.CampaignName'),
              }),
            )
            .max(
              MaxCampaignNameLength,
              translate('Validation.FieldMaxLength', {
                fieldMaxLength: String(MaxCampaignNameLength),
                fieldName: translateCampaign('Label.CampaignName'),
              }),
            ),
          [AdIntegrationFormField.EndDate]: z.string().min(
            1,
            translate('Validation.FieldRequired', {
              fieldName: translateCampaign('Label.EndDate'),
            }),
          ),
          [AdIntegrationFormField.EndTime]: z.string().min(
            1,
            translate('Validation.FieldRequired', {
              fieldName: translateCampaign('Label.EndTime'),
            }),
          ),
          [AdIntegrationFormField.Experience]: z
            .number({
              error: translate('Validation.FieldRequired', {
                fieldName: translateCreativeLibrary('Label.Experience'),
              }),
            })
            .int()
            .positive(),
          [AdIntegrationFormField.HasRewardedPlacements]: z.boolean(),
          [AdIntegrationFormField.StartDate]: z.string().min(
            1,
            translate('Validation.FieldRequired', {
              fieldName: translateCampaign('Label.CampaignStartDate'),
            }),
          ),
          [AdIntegrationFormField.StartTime]: z.string().min(
            1,
            translate('Validation.FieldRequired', {
              fieldName: translateCampaign('Label.StartTime'),
            }),
          ),
          [AdIntegrationFormField.TermsAndAdsStandardsAcknowledgement]: z
            .boolean()
            .refine((value) => value, {
              message: translateAccount('Validation.AdIntegrationTermsAcknowledgementRequired'),
            }),
        })
        .superRefine((values, ctx) => {
          const now = moment().tz(timezoneDbName);
          const minimumAllowedStartMoment = moment.tz(
            minimumStartTimestampMsUtc > 0
              ? Math.max(now.valueOf(), minimumStartTimestampMsUtc)
              : now.valueOf(),
            timezoneDbName,
          );
          const startDateMoment = values.startDate
            ? moment.tz(values.startDate, DateFormat, timezoneDbName)
            : null;

          if (
            startDateMoment?.isValid() &&
            startDateMoment.isBefore(minimumAllowedStartMoment, 'day') &&
            !campaignInProgress
          ) {
            ctx.addIssue({
              code: 'custom',
              message: translateAccount('Validation.StartDateMustBeInFuture'),
              path: [AdIntegrationFormField.StartDate],
            });
          }

          if (values.startDate && values.startTime) {
            const startMoment = moment.tz(
              `${values.startDate} ${values.startTime}`,
              `${DateFormat} ${TimeFormat}`,
              timezoneDbName,
            );

            if (
              startMoment.isValid() &&
              !startDateMoment?.isBefore(minimumAllowedStartMoment, 'day') &&
              startMoment.isBefore(minimumAllowedStartMoment) &&
              !campaignInProgress
            ) {
              ctx.addIssue({
                code: 'custom',
                message: translateAccount('Validation.StartDateMustBeInFuture'),
                path: [AdIntegrationFormField.StartDate],
              });
            }

            if (values.endDate && values.endTime) {
              const endMoment = moment.tz(
                `${values.endDate} ${values.endTime}`,
                `${DateFormat} ${TimeFormat}`,
                timezoneDbName,
              );

              if (
                startMoment.isValid() &&
                endMoment.isValid() &&
                endMoment.isSameOrBefore(startMoment)
              ) {
                ctx.addIssue({
                  code: 'custom',
                  message: translateAccount('Validation.EndDateAfterStartDate'),
                  path: [AdIntegrationFormField.EndDate],
                });
              }
            }
          }
        }),
    [
      campaignInProgress,
      minimumStartTimestampMsUtc,
      timezoneDbName,
      translate,
      translateAccount,
      translateCampaign,
      translateCreativeLibrary,
    ],
  );
};

const useAdIntegrationCampaignDetailsForm = (
  defaultValues: AdIntegrationCampaignDetailsFormValues,
  mode: AdIntegrationFormMode = 'create',
  timezoneDbName: string = 'UTC',
  minimumStartTimestampMsUtc: number = 0,
) => {
  const campaignInProgress = getIsCampaignInProgress(mode, defaultValues.startDate, timezoneDbName);
  const schema = useAdIntegrationCampaignDetailsSchema(
    campaignInProgress,
    timezoneDbName,
    minimumStartTimestampMsUtc,
  );

  return useForm<AdIntegrationCampaignDetailsFormValues>({
    defaultValues,
    mode: 'onChange',
    resolver: zodResolver(schema),
  });
};

export default useAdIntegrationCampaignDetailsForm;
