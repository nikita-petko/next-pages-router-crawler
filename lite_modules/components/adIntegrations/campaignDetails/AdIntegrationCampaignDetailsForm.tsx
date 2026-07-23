import { adPolicyLabelEnumToText } from '@rbx/ads-moderation-ui';
import { AdIntegrationPlacement } from '@rbx/client-ads-management-api/v1';
import { Button, Checkbox, Link } from '@rbx/foundation-ui';
import { useLocalization } from '@rbx/intl';
import {
  DatePicker,
  FormLabel,
  MenuItem,
  PickersUtilsProvider,
  Select,
  TextField,
  Typography,
} from '@rbx/ui';
import moment from 'moment-timezone';
import { ChangeEvent, ReactNode, useCallback, useId, useMemo, useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';

import AdIntegrationAssetsDrawer from '@components/adIntegrations/assetsDrawer/AdIntegrationAssetsDrawer';
import useAdIntegrationCampaignDetailsFormStyles from '@components/adIntegrations/campaignDetails/AdIntegrationCampaignDetailsForm.styles';
import AdIntegrationExperienceSection from '@components/adIntegrations/campaignDetails/AdIntegrationExperienceSection';
import RevenueShareEstimateTile from '@components/adIntegrations/campaignDetails/RevenueShareEstimateTile';
import { openAdIntegrationRevenueShareIncreaseDialog } from '@components/adIntegrations/dialogs/AdIntegrationRevenueShareIncreaseDialog';
import { openErrorDialog } from '@components/common/dialog/errorDialog';
import {
  AdIntegrationFormField,
  AdsCategoryOption,
  AdsCategoryOptions,
  MaxAdvertiserNameLength,
  MaxCampaignNameLength,
} from '@constants/adIntegrations';
import { AdCategoryInfoDocsUrl, AdIntegrationsDocsUrl } from '@constants/adIntegrationsUrls';
import { defaultTimeZone } from '@constants/app';
import {
  DateFormat,
  FORM_HELPER_TEXT_PROPS,
  INPUT_LABEL_PROPS,
  TimeFormat,
} from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import useAdIntegrationCampaignDetailsForm, {
  getIsCampaignEnded,
  getIsCampaignInProgress,
} from '@hooks/adIntegrations/useAdIntegrationCampaignDetailsForm';
import useRevenueShareEstimatePreview from '@hooks/adIntegrations/useRevenueShareEstimatePreview';
import useDateFnsLocale from '@hooks/useDateFnsLocale';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useAppStore } from '@stores/appStoreProvider';
import {
  AdIntegrationCampaignDetailsChangedFields,
  AdIntegrationCampaignDetailsFormValues,
  AdIntegrationFormMode,
  RevenueShareEstimatePreview,
} from '@type/adIntegrations';
import { TimeOption } from '@type/campaignBuilder';
import { parseResponseErrorToAMAError } from '@type/errorResponse';
import { UniverseShapeType } from '@type/universe';
import { GenerateTimeOptions } from '@utils/campaignBuilder';
import { CaptureException } from '@utils/error';
import { getSelectedTimeConversion } from '@utils/scheduleTimeConversion';
import {
  getLocalizedTimezoneTitle,
  GetTimezoneObjFromEnum,
  GetValidatedTimezoneDbName,
} from '@utils/timezone';

interface AdIntegrationCampaignDetailsFormProps {
  campaignId?: string;
  campaignStartTimestampMs?: number;
  defaultValues: AdIntegrationCampaignDetailsFormValues;
  isSubmitting: boolean;
  mode: AdIntegrationFormMode;
  onCancel: () => void;
  onSavePlacements?: (additions: number[], removals: string[]) => Promise<void>;
  onSubmit: (
    values: AdIntegrationCampaignDetailsFormValues,
    changedFields: AdIntegrationCampaignDetailsChangedFields,
    pendingAssetIds?: number[],
  ) => Promise<void>;
  placements: AdIntegrationPlacement[];
  // Persisted revenue share signals snapshot for the campaign being edited (if
  // any). When present and the experience is unchanged, the preview hook reuses
  // it instead of calling the Frost backend. Undefined in create mode.
  savedRevenueShareSignals?: RevenueShareEstimatePreview;
  universes: UniverseShapeType[];
  userId?: number;
}

const AdIntegrationCampaignDetailsForm = ({
  campaignId,
  campaignStartTimestampMs,
  defaultValues,
  isSubmitting,
  mode,
  onCancel,
  onSavePlacements,
  onSubmit,
  placements,
  savedRevenueShareSignals,
  universes,
  userId,
}: AdIntegrationCampaignDetailsFormProps) => {
  const { translate, translateHTML } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { translate: translateAccount, translateHTML: translateAccountHTML } =
    useNamespacedTranslation(TranslationNamespace.Account);
  // Timezone city labels (Label.TimezoneCity.*) are defined in the Timezone
  // namespace, so resolve them separately from the Campaign copy.
  const { translate: translateTimezone } = useNamespacedTranslation(TranslationNamespace.Timezone);
  const { locale } = useLocalization();
  const dateFnsLocale = useDateFnsLocale();
  const [assetsDrawerOpen, setAssetsDrawerOpen] = useState<boolean>(false);
  const [pendingAssetIds, setPendingAssetIds] = useState<number[]>([]);
  const [startDatePickerOpen, setStartDatePickerOpen] = useState<boolean>(false);
  const [endDatePickerOpen, setEndDatePickerOpen] = useState<boolean>(false);

  const {
    cityKey,
    timezoneDbName: rawTimezoneDbName,
    title: staticTimezoneTitle,
  } = useAppStore((state) =>
    GetTimezoneObjFromEnum(
      state.advertiserState?.data?.organization?.time_zone || defaultTimeZone.value,
    ),
  );
  const timezoneDbName = GetValidatedTimezoneDbName(rawTimezoneDbName);
  const isAdIntegrationRewardedPlacementsEnabled = useAppStore(
    (state) => state.appData?.isAdIntegrationRewardedPlacementsEnabled ?? false,
  );
  const isRevenueShareEstimateEnabled = useAppStore(
    (state) => state.appMetadataState?.data?.isAdIntegrationRevenueShareEstimateEnabled ?? false,
  );
  const adIntegrationCampaignMinimumStartTimestampMsUtc = useAppStore(
    (state) => state.appMetadataState.data?.adIntegrationCampaignMinimumStartTimestampMsUtc ?? 0,
  );
  const timezoneTitle = useMemo(
    () =>
      locale && rawTimezoneDbName
        ? getLocalizedTimezoneTitle(timezoneDbName, cityKey, locale, translateTimezone)
        : staticTimezoneTitle,
    [timezoneDbName, cityKey, rawTimezoneDbName, staticTimezoneTitle, locale, translateTimezone],
  );

  const campaignInProgress = getIsCampaignInProgress(mode, defaultValues.startDate, timezoneDbName);
  const campaignEnded = getIsCampaignEnded(mode, defaultValues.endDate, timezoneDbName);
  const disableEditing = campaignEnded;
  // A live campaign has already started but has not yet ended. Extending its end
  // date increases the billable duration (and thus the max revenue share owed),
  // so we confirm the change before saving.
  const isLiveCampaign = campaignInProgress && !campaignEnded;
  const form = useAdIntegrationCampaignDetailsForm(
    defaultValues,
    mode,
    timezoneDbName,
    adIntegrationCampaignMinimumStartTimestampMsUtc,
  );
  const {
    classes: {
      assetsActionRow,
      buttonRow,
      checkboxError,
      checkboxSection,
      container,
      datePickerError,
      dateTimeRow,
      fieldSection,
      formColumn,
      halfWidth,
      inlineTile,
      layout,
      mutedText,
      rowError,
      sectionHeader,
      sidebar,
      subSection,
    },
    cx,
  } = useAdIntegrationCampaignDetailsFormStyles();
  const {
    control,
    formState: { dirtyFields, errors, isValid },
    handleSubmit,
    trigger,
  } = form;
  const rewardedPlacementsLabelId = useId();
  const rewardedPlacementsCheckboxId = useId();
  const termsAcknowledgementLabelId = useId();
  const termsAcknowledgementCheckboxId = useId();
  const advertiserName = useWatch({
    control,
    name: AdIntegrationFormField.AdvertiserName,
  });
  const campaignName = useWatch({
    control,
    name: AdIntegrationFormField.CampaignName,
  });
  const startDate = useWatch({
    control,
    name: AdIntegrationFormField.StartDate,
  });
  const startTime = useWatch({
    control,
    name: AdIntegrationFormField.StartTime,
  });
  const endDate = useWatch({
    control,
    name: AdIntegrationFormField.EndDate,
  });
  const endTime = useWatch({
    control,
    name: AdIntegrationFormField.EndTime,
  });
  const selectedExperience = useWatch({
    control,
    name: AdIntegrationFormField.Experience,
  });
  const isStartDateRangeError = errors.startDate?.type === 'custom';
  const startDateRangeErrorMessage = isStartDateRangeError ? errors.startDate?.message : undefined;
  const isEndDateRangeError = errors.endDate?.type === 'custom';
  const endDateRangeErrorMessage = isEndDateRangeError ? errors.endDate?.message : undefined;
  const minimumAllowedStartMoment = useMemo(
    () =>
      adIntegrationCampaignMinimumStartTimestampMsUtc > 0
        ? moment.tz(
            Math.max(
              moment().tz(timezoneDbName).valueOf(),
              adIntegrationCampaignMinimumStartTimestampMsUtc,
            ),
            timezoneDbName,
          )
        : null,
    [adIntegrationCampaignMinimumStartTimestampMsUtc, timezoneDbName],
  );
  const minimumAllowedStartDateMoment = useMemo(
    () => minimumAllowedStartMoment?.clone().startOf('day') ?? null,
    [minimumAllowedStartMoment],
  );
  const selectedStartDateMoment = useMemo(
    () => (startDate ? moment.tz(startDate, DateFormat, timezoneDbName) : null),
    [startDate, timezoneDbName],
  );
  const minimumAllowedEndDateMoment = useMemo(() => {
    if (selectedStartDateMoment?.isValid() && minimumAllowedStartDateMoment) {
      return moment.max(selectedStartDateMoment, minimumAllowedStartDateMoment);
    }

    if (selectedStartDateMoment?.isValid()) {
      return selectedStartDateMoment;
    }

    return minimumAllowedStartDateMoment;
  }, [minimumAllowedStartDateMoment, selectedStartDateMoment]);

  const isStartToday = useMemo<boolean>(
    () =>
      startDate
        ? moment
            .tz(startDate, DateFormat, timezoneDbName)
            .isSame(moment().tz(timezoneDbName), 'day')
        : false,
    [startDate, timezoneDbName],
  );

  const isEndToday = useMemo<boolean>(
    () =>
      endDate
        ? moment.tz(endDate, DateFormat, timezoneDbName).isSame(moment().tz(timezoneDbName), 'day')
        : false,
    [endDate, timezoneDbName],
  );

  const startTimeOptions = useMemo<TimeOption[]>(
    () => GenerateTimeOptions(isStartToday, timezoneDbName, locale),
    [isStartToday, timezoneDbName, locale],
  );

  const endTimeOptions = useMemo<TimeOption[]>(
    () => GenerateTimeOptions(isEndToday, timezoneDbName, locale),
    [isEndToday, timezoneDbName, locale],
  );
  const startTimeConversion = useMemo(
    () =>
      getSelectedTimeConversion({
        date: startDate,
        locale,
        time: startTime,
        timezoneDbName,
      }),
    [locale, startDate, startTime, timezoneDbName],
  );
  const endTimeConversion = useMemo(
    () =>
      getSelectedTimeConversion({
        date: endDate,
        locale,
        time: endTime,
        timezoneDbName,
      }),
    [endDate, endTime, locale, timezoneDbName],
  );
  const startTimeConversionText = useMemo(
    () =>
      startTimeConversion
        ? translate('Description.ScheduleTimezoneAndBrowserTime', {
            browserLocalTime: startTimeConversion.browserLocalTime,
            timezoneTitle,
          })
        : '',
    [startTimeConversion, timezoneTitle, translate],
  );
  const endTimeConversionText = useMemo(
    () =>
      endTimeConversion
        ? translate('Description.ScheduleTimezoneAndBrowserTime', {
            browserLocalTime: endTimeConversion.browserLocalTime,
            timezoneTitle,
          })
        : '',
    [endTimeConversion, timezoneTitle, translate],
  );
  const startTimeHelperText = startTimeConversionText || timezoneTitle;
  const endTimeHelperText = endTimeConversionText || timezoneTitle;

  // Convert form date+time+timezone into epoch ms the same way the service does
  // (formatDateTimeToApiTimestamp), returning undefined for incomplete/invalid input.
  const toTimestampMs = useCallback(
    (date: string, time: string): number | undefined => {
      if (!date || !time) {
        return undefined;
      }
      const parsed = moment.tz(`${date} ${time}`, `${DateFormat} ${TimeFormat}`, timezoneDbName);
      return parsed.isValid() ? parsed.valueOf() : undefined;
    },
    [timezoneDbName],
  );
  const startTimestampMs = useMemo(
    () => toTimestampMs(startDate, startTime),
    [startDate, startTime, toTimestampMs],
  );
  const endTimestampMs = useMemo(
    () => toTimestampMs(endDate, endTime),
    [endDate, endTime, toTimestampMs],
  );
  const selectedUniverseId = selectedExperience || undefined;
  const {
    avgDailyVisits,
    billableDays,
    isError: isRevenueShareEstimateError,
    maxRevenueShareMicroUsd,
    weightedCptvMicroUsd,
  } = useRevenueShareEstimatePreview({
    endTimestampMs,
    // On edit, reuse the campaign's persisted snapshot so we don't re-fetch from
    // Frost for an experience that already has a saved estimate. The hook ignores
    // it once the user switches to a different experience.
    savedSignals: savedRevenueShareSignals,
    startTimestampMs,
    // Gated behind the revenue share estimate flag: passing undefined keeps the
    // hook from issuing any network request while the feature is disabled.
    universeId: isRevenueShareEstimateEnabled ? selectedUniverseId : undefined,
  });

  const rewardedPlacementsLabelKey = 'Label.AdIntegrationNoRewardedPlacements';
  const getAdsCategoryOptionLabel = useCallback((option: AdsCategoryOption): ReactNode => {
    if ('enumValue' in option) {
      return adPolicyLabelEnumToText.get(option.enumValue) ?? option.value;
    }
    return option.label;
  }, []);

  const handlePendingAdditionsChange = useCallback((assetIds: number[]) => {
    setPendingAssetIds(assetIds);
  }, []);

  const submitForm = useCallback(
    async (values: AdIntegrationCampaignDetailsFormValues) => {
      const changedFields: AdIntegrationCampaignDetailsChangedFields = {
        adsCategory: Boolean(dirtyFields.adsCategory),
        advertiserName: Boolean(dirtyFields.advertiserName),
        campaignName: Boolean(dirtyFields.campaignName),
        endDate: Boolean(dirtyFields.endDate),
        endTime: Boolean(dirtyFields.endTime),
        experience: Boolean(dirtyFields.experience),
        hasRewardedPlacements: Boolean(dirtyFields.hasRewardedPlacements),
        startDate: Boolean(dirtyFields.startDate),
        startTime: Boolean(dirtyFields.startTime),
        termsAndAdsStandardsAcknowledgement: Boolean(
          dirtyFields.termsAndAdsStandardsAcknowledgement,
        ),
      };

      try {
        await onSubmit(
          values,
          changedFields,
          mode === 'create' && pendingAssetIds.length > 0 ? pendingAssetIds : undefined,
        );
      } catch (error) {
        CaptureException(error, { context: 'AdIntegrationCampaignDetailsForm submit' });
        const amaError = await parseResponseErrorToAMAError(error);
        openErrorDialog(amaError);
      }
    },
    [dirtyFields, mode, onSubmit, pendingAssetIds],
  );

  const handleFormSubmit = useCallback(
    async (values: AdIntegrationCampaignDetailsFormValues) => {
      const originalEndTimestampMs = toTimestampMs(defaultValues.endDate, defaultValues.endTime);
      const newEndTimestampMs = toTimestampMs(values.endDate, values.endTime);
      const isDurationIncreased =
        originalEndTimestampMs !== undefined &&
        newEndTimestampMs !== undefined &&
        newEndTimestampMs > originalEndTimestampMs;

      if (isRevenueShareEstimateEnabled && isLiveCampaign && isDurationIncreased) {
        openAdIntegrationRevenueShareIncreaseDialog(() => submitForm(values));
        return;
      }

      await submitForm(values);
    },
    [
      defaultValues.endDate,
      defaultValues.endTime,
      isLiveCampaign,
      isRevenueShareEstimateEnabled,
      submitForm,
      toTimestampMs,
    ],
  );

  const revenueShareTile = isRevenueShareEstimateEnabled ? (
    <RevenueShareEstimateTile
      avgDailyVisits={avgDailyVisits}
      billableDays={billableDays}
      isError={isRevenueShareEstimateError}
      maxRevenueShareMicroUsd={maxRevenueShareMicroUsd}
      weightedCptvMicroUsd={weightedCptvMicroUsd}
    />
  ) : null;

  return (
    <>
      <Typography variant='h1'>{translateMisc('Heading.Registration')}</Typography>
      <div className={layout}>
        <div className={container}>
          <div>
            <div className={sectionHeader}>
              <Typography variant='h5'>{translateAccount('Heading.IntegrationDetails')}</Typography>
              <Typography color='secondary' variant='body1'>
                {translateAccount('Description.IntegrationDetailsBody')}
              </Typography>
            </div>

            <form className={formColumn} onSubmit={handleSubmit(handleFormSubmit)}>
              <AdIntegrationExperienceSection
                control={control}
                errorMessage={errors.experience?.message}
                mode={mode}
                universes={universes}
              />

              <Controller
                control={control}
                name={AdIntegrationFormField.AdvertiserName}
                render={({ field }) => (
                  <TextField
                    {...field}
                    disabled={campaignInProgress || disableEditing}
                    error={Boolean(errors.advertiserName)}
                    helperText={
                      errors.advertiserName?.message ??
                      `${(advertiserName?.length ?? 0).toString()}/${MaxAdvertiserNameLength.toString()}`
                    }
                    id={AdIntegrationFormField.AdvertiserName}
                    label={translateAccount('Label.AdvertiserName')}
                  />
                )}
              />

              <Controller
                control={control}
                name={AdIntegrationFormField.AdsCategory}
                render={({ field, fieldState: { error } }) => (
                  <div className={fieldSection}>
                    <Select
                      disabled={mode === 'edit'}
                      error={!!error}
                      FormHelperTextProps={FORM_HELPER_TEXT_PROPS}
                      fullWidth
                      helperText={error?.message}
                      InputLabelProps={INPUT_LABEL_PROPS}
                      label={translate('Label.AdsCategory')}
                      onBlur={field.onBlur}
                      onChange={field.onChange}
                      ref={field.ref}
                      renderValue={(selected) => {
                        const option = AdsCategoryOptions.find((opt) => opt.value === selected);
                        return option ? getAdsCategoryOptionLabel(option) : (selected as ReactNode);
                      }}
                      value={field.value}>
                      {AdsCategoryOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {getAdsCategoryOptionLabel(option)}
                        </MenuItem>
                      ))}
                    </Select>
                    <Typography className={mutedText} variant='body2'>
                      {translateHTML('Description.AdsCategoryInfo', [
                        {
                          closing: 'linkEnd',
                          content: (chunks) => (
                            <Link
                              href={AdCategoryInfoDocsUrl}
                              isExternal={false}
                              rel='noopener noreferrer'
                              target='_blank'
                              underline='always'>
                              {chunks}
                            </Link>
                          ),
                          opening: 'linkStart',
                        },
                      ])}
                    </Typography>
                  </div>
                )}
              />

              <PickersUtilsProvider adapterLocale={dateFnsLocale}>
                <div className={dateTimeRow}>
                  <div className={cx(halfWidth, startDateRangeErrorMessage && datePickerError)}>
                    <Controller
                      control={control}
                      name={AdIntegrationFormField.StartDate}
                      render={({ field, fieldState: { error } }) => (
                        <DatePicker
                          disabled={campaignInProgress || disableEditing}
                          disablePast
                          format='MMM dd, yyyy'
                          label={translate('Label.CampaignStartDate')}
                          minDate={minimumAllowedStartDateMoment?.toDate()}
                          onChange={(date) => {
                            field.onChange(
                              date ? moment.tz(date, timezoneDbName).format(DateFormat) : '',
                            );
                            trigger([
                              AdIntegrationFormField.StartTime,
                              AdIntegrationFormField.EndDate,
                            ]);
                          }}
                          onClose={() => setStartDatePickerOpen(false)}
                          open={startDatePickerOpen}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              error={!!error || isStartDateRangeError || !!params.error}
                              FormHelperTextProps={FORM_HELPER_TEXT_PROPS}
                              fullWidth
                              helperText={
                                isStartDateRangeError
                                  ? undefined
                                  : error?.message || params.helperText
                              }
                              id='start-date'
                              InputLabelProps={INPUT_LABEL_PROPS}
                              label={translate('Label.CampaignStartDate')}
                              onBlur={field.onBlur}
                              onClick={
                                campaignInProgress || disableEditing
                                  ? undefined
                                  : () => setStartDatePickerOpen(true)
                              }
                              ref={field.ref}
                              variant='outlined'
                            />
                          )}
                          value={startDate ? moment(startDate, DateFormat).toDate() : null}
                        />
                      )}
                    />
                  </div>
                  <Controller
                    control={control}
                    name={AdIntegrationFormField.StartTime}
                    render={({ field, fieldState: { error } }) => (
                      <Select
                        className={halfWidth}
                        disabled={campaignInProgress || disableEditing || !startDate}
                        error={!!error}
                        FormHelperTextProps={FORM_HELPER_TEXT_PROPS}
                        fullWidth
                        helperText={error?.message || startTimeHelperText}
                        InputLabelProps={INPUT_LABEL_PROPS}
                        label={translate('Label.StartTime')}
                        onBlur={field.onBlur}
                        onChange={(event: ChangeEvent<{ value: string }>) => {
                          field.onChange(event);
                          trigger([
                            AdIntegrationFormField.StartDate,
                            AdIntegrationFormField.EndDate,
                          ]);
                        }}
                        ref={field.ref}
                        renderValue={(selected) =>
                          startTimeOptions.find((option) => option.value === selected)?.label ??
                          (selected as ReactNode) ??
                          translate('Label.SelectTime')
                        }
                        SelectProps={{
                          MenuProps: {
                            style: {
                              maxHeight: 236,
                            },
                          },
                        }}
                        value={startTime}>
                        {startTimeOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </div>
                {startDateRangeErrorMessage && (
                  <FormLabel className={rowError} error>
                    {startDateRangeErrorMessage}
                  </FormLabel>
                )}

                <div className={dateTimeRow}>
                  <div className={cx(halfWidth, endDateRangeErrorMessage && datePickerError)}>
                    <Controller
                      control={control}
                      name={AdIntegrationFormField.EndDate}
                      render={({ field, fieldState: { error } }) => (
                        <DatePicker
                          disabled={disableEditing}
                          disablePast
                          format='MMM dd, yyyy'
                          label={translate('Label.EndDate')}
                          minDate={minimumAllowedEndDateMoment?.toDate()}
                          onChange={(date) => {
                            field.onChange(
                              date ? moment.tz(date, timezoneDbName).format(DateFormat) : '',
                            );
                            trigger(AdIntegrationFormField.EndTime);
                          }}
                          onClose={() => setEndDatePickerOpen(false)}
                          open={endDatePickerOpen}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              error={!!error || !!endDateRangeErrorMessage}
                              FormHelperTextProps={FORM_HELPER_TEXT_PROPS}
                              fullWidth
                              helperText={isEndDateRangeError ? undefined : error?.message}
                              id='end-date'
                              InputLabelProps={INPUT_LABEL_PROPS}
                              label={translate('Label.EndDate')}
                              onBlur={field.onBlur}
                              onClick={
                                disableEditing ? undefined : () => setEndDatePickerOpen(true)
                              }
                              ref={field.ref}
                              variant='outlined'
                            />
                          )}
                          value={endDate ? moment(endDate, DateFormat).toDate() : null}
                        />
                      )}
                    />
                  </div>
                  <Controller
                    control={control}
                    name={AdIntegrationFormField.EndTime}
                    render={({ field, fieldState: { error } }) => (
                      <Select
                        className={halfWidth}
                        disabled={disableEditing || !endDate}
                        error={!!error || !!endDateRangeErrorMessage}
                        FormHelperTextProps={FORM_HELPER_TEXT_PROPS}
                        fullWidth
                        helperText={error?.message || endTimeHelperText}
                        InputLabelProps={INPUT_LABEL_PROPS}
                        label={translate('Label.EndTime')}
                        onBlur={field.onBlur}
                        onChange={(event: ChangeEvent<{ value: string }>) => {
                          field.onChange(event);
                          trigger(AdIntegrationFormField.EndDate);
                        }}
                        ref={field.ref}
                        renderValue={(selected) =>
                          endTimeOptions.find((option) => option.value === selected)?.label ??
                          (selected as ReactNode) ??
                          translate('Label.SelectTime')
                        }
                        SelectProps={{
                          MenuProps: {
                            style: {
                              maxHeight: 236,
                            },
                          },
                        }}
                        value={endTime}>
                        {endTimeOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </div>
                {endDateRangeErrorMessage && (
                  <FormLabel className={rowError} error>
                    {endDateRangeErrorMessage}
                  </FormLabel>
                )}
              </PickersUtilsProvider>

              {revenueShareTile && <div className={inlineTile}>{revenueShareTile}</div>}

              <Controller
                control={control}
                name={AdIntegrationFormField.CampaignName}
                render={({ field }) => (
                  <TextField
                    {...field}
                    disabled={disableEditing}
                    error={Boolean(errors.campaignName)}
                    helperText={
                      errors.campaignName?.message ??
                      `${(campaignName?.length ?? 0).toString()}/${MaxCampaignNameLength.toString()}`
                    }
                    id={AdIntegrationFormField.CampaignName}
                    label={translate('Label.CampaignName')}
                  />
                )}
              />

              {isAdIntegrationRewardedPlacementsEnabled && (
                <div className={checkboxSection}>
                  <Controller
                    control={control}
                    name={AdIntegrationFormField.HasRewardedPlacements}
                    render={({ field }) => (
                      <div className='flex items-start gap-small'>
                        <Checkbox
                          aria-labelledby={rewardedPlacementsLabelId}
                          id={rewardedPlacementsCheckboxId}
                          isChecked={field.value === true}
                          isDisabled={campaignInProgress || disableEditing}
                          onCheckedChange={(checked) => {
                            field.onChange(checked === true);
                          }}
                          placement='Start'
                          size='Small'
                        />
                        <Typography
                          className={
                            campaignInProgress || disableEditing ? undefined : 'cursor-pointer'
                          }
                          component='label'
                          htmlFor={rewardedPlacementsCheckboxId}
                          id={rewardedPlacementsLabelId}
                          variant='body2'>
                          {translateAccountHTML(rewardedPlacementsLabelKey, [
                            {
                              closing: 'linkEnd',
                              content: (chunks) => (
                                <Link
                                  href='https://en.help.roblox.com/hc/en-us/articles/13722260778260-Advertising-Standards'
                                  isExternal={false}
                                  rel='noopener noreferrer'
                                  target='_blank'
                                  underline='always'>
                                  {chunks}
                                </Link>
                              ),
                              opening: 'linkStart',
                            },
                          ])}
                        </Typography>
                      </div>
                    )}
                  />
                </div>
              )}

              <div className={subSection}>
                <Typography variant='h5'>{translateAccount('Heading.Assets')}</Typography>
                <Typography color='secondary' variant='body1'>
                  {translateAccountHTML('Description.AdIntegrationAssetsBody', [
                    {
                      closing: 'linkEnd',
                      content: (chunks) => (
                        <Link
                          href={AdIntegrationsDocsUrl}
                          isExternal={false}
                          rel='noopener noreferrer'
                          target='_blank'
                          underline='always'>
                          {chunks}
                        </Link>
                      ),
                      opening: 'linkStart',
                    },
                  ])}
                </Typography>
                <div className={assetsActionRow}>
                  <Button
                    onClick={() => setAssetsDrawerOpen(true)}
                    size='Medium'
                    variant='Standard'>
                    {translateAccount('Action.ManageAssets')}
                  </Button>
                </div>
                <AdIntegrationAssetsDrawer
                  campaignId={campaignId}
                  campaignStartTimestampMs={campaignStartTimestampMs}
                  disableSave={disableEditing}
                  mode={mode}
                  onClose={() => setAssetsDrawerOpen(false)}
                  onPendingAdditionsChange={
                    mode === 'create' ? handlePendingAdditionsChange : undefined
                  }
                  onSavePlacements={onSavePlacements}
                  open={assetsDrawerOpen}
                  placements={placements}
                  universeId={selectedExperience || undefined}
                  userId={userId}
                />
              </div>

              <div className={subSection}>
                <div className={checkboxSection}>
                  <Controller
                    control={control}
                    name={AdIntegrationFormField.TermsAndAdsStandardsAcknowledgement}
                    render={({ field }) => (
                      <>
                        <div className='flex items-start gap-small'>
                          <Checkbox
                            aria-labelledby={termsAcknowledgementLabelId}
                            id={termsAcknowledgementCheckboxId}
                            isChecked={field.value === true}
                            isDisabled={mode === 'edit'}
                            onCheckedChange={(checked) => {
                              field.onChange(checked === true);
                            }}
                            placement='Start'
                            size='Small'
                          />
                          <Typography
                            className={mode === 'edit' ? undefined : 'cursor-pointer'}
                            component='label'
                            htmlFor={termsAcknowledgementCheckboxId}
                            id={termsAcknowledgementLabelId}
                            variant='body2'>
                            {translateAccountHTML(
                              'Label.AdIntegrationTermsAndAdsStandardsAcknowledgement',
                              [
                                {
                                  closing: 'tosLinkEnd',
                                  content: (chunks) => (
                                    <Link
                                      href='https://en.help.roblox.com/hc/en-us/articles/115004647846-Roblox-Terms-of-Use'
                                      isExternal={false}
                                      rel='noopener noreferrer'
                                      target='_blank'
                                      underline='always'>
                                      {chunks}
                                    </Link>
                                  ),
                                  opening: 'tosLinkStart',
                                },
                                {
                                  closing: 'adsStandardsLinkEnd',
                                  content: (chunks) => (
                                    <Link
                                      href='https://en.help.roblox.com/hc/en-us/articles/13722260778260-Advertising-Standards'
                                      isExternal={false}
                                      rel='noopener noreferrer'
                                      target='_blank'
                                      underline='always'>
                                      {chunks}
                                    </Link>
                                  ),
                                  opening: 'adsStandardsLinkStart',
                                },
                              ],
                            )}
                          </Typography>
                        </div>
                        {errors.termsAndAdsStandardsAcknowledgement && (
                          <FormLabel className={checkboxError} error>
                            {errors.termsAndAdsStandardsAcknowledgement.message}
                          </FormLabel>
                        )}
                      </>
                    )}
                  />
                </div>
              </div>

              <Typography className={buttonRow} component='div'>
                <Button
                  isDisabled={disableEditing || !isValid || isSubmitting}
                  isLoading={isSubmitting}
                  size='Medium'
                  type='submit'
                  variant='Emphasis'>
                  {mode === 'edit'
                    ? translateMisc('Action.Save')
                    : translateAccount('Action.RegisterAdIntegration')}
                </Button>
                <Button onClick={onCancel} size='Medium' variant='Standard'>
                  {translateMisc('Action.Cancel')}
                </Button>
              </Typography>
            </form>
          </div>
        </div>
        {revenueShareTile && <aside className={sidebar}>{revenueShareTile}</aside>}
      </div>
    </>
  );
};

export default AdIntegrationCampaignDetailsForm;
