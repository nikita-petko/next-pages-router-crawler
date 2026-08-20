import { AdIntegrationPlacement } from '@rbx/client-ads-management-api/v1';
import {
  Button,
  Checkbox,
  Dropdown,
  Link,
  Menu,
  MenuItem,
  MenuSection,
  TextInput,
} from '@rbx/foundation-ui';
import { useLocalization } from '@rbx/intl';
import { FormLabel } from '@rbx/ui';
import moment from 'moment-timezone';
import { useCallback, useId, useMemo, useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';

import AdIntegrationAssetsDrawer from '@components/adIntegrations/assetsDrawer/AdIntegrationAssetsDrawer';
import useAdIntegrationCampaignDetailsFormStyles from '@components/adIntegrations/campaignDetails/AdIntegrationCampaignDetailsForm.styles';
import AdIntegrationExperienceSection from '@components/adIntegrations/campaignDetails/AdIntegrationExperienceSection';
import RevenueShareEstimateTile from '@components/adIntegrations/campaignDetails/RevenueShareEstimateTile';
import { openAdIntegrationRevenueShareIncreaseDialog } from '@components/adIntegrations/dialogs/AdIntegrationRevenueShareIncreaseDialog';
import { openRevenueShareBreakdownDialog } from '@components/adIntegrations/dialogs/RevenueShareBreakdownDialog';
import { openErrorDialog } from '@components/common/dialog/errorDialog';
import DateField from '@components/common/form/DateField';
import {
  AdIntegrationFormField,
  MaxAdvertiserNameLength,
  MaxCampaignNameLength,
} from '@constants/adIntegrations';
import { AdIntegrationsDocsUrl } from '@constants/adIntegrationsUrls';
import { defaultTimeZone } from '@constants/app';
import { DateFormat, TimeFormat } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import useAdIntegrationCampaignDetailsForm, {
  getIsCampaignEnded,
  getIsCampaignInProgress,
} from '@hooks/adIntegrations/useAdIntegrationCampaignDetailsForm';
import useMultiRevenueShareEstimatePreview from '@hooks/adIntegrations/useMultiRevenueShareEstimatePreview';
import useRevenueShareEstimatePreview from '@hooks/adIntegrations/useRevenueShareEstimatePreview';
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
  // Persisted revenue share snapshots keyed by universe. Undefined in create
  // mode and for campaigns created before revenue-share forecasting.
  savedRevenueShareSignals?: RevenueShareEstimatePreview[];
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
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { translate: translateAccount, translateHTML: translateAccountHTML } =
    useNamespacedTranslation(TranslationNamespace.Account);
  // Timezone city labels (Label.TimezoneCity.*) are defined in the Timezone
  // namespace, so resolve them separately from the Campaign copy.
  const { translate: translateTimezone } = useNamespacedTranslation(TranslationNamespace.Timezone);
  // The calendar navigation labels (Label.NextMonth / Label.PreviousMonth) only
  // exist in the Report namespace, and the repo forbids duplicating a string
  // across namespaces, so resolve them from there.
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);
  const { locale } = useLocalization();
  const [assetsDrawerOpen, setAssetsDrawerOpen] = useState<boolean>(false);
  const [pendingAssetIds, setPendingAssetIds] = useState<number[]>([]);

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
  const isMultiExperienceEnabled = useAppStore(
    (state) => state.appMetadataState?.data?.isMultiUniverseAdIntegrationsEnabled ?? false,
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

  const campaignInProgress = getIsCampaignInProgress(
    mode,
    defaultValues.startDate,
    defaultValues.startTime,
    timezoneDbName,
  );
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
      formColumn,
      halfWidth,
      inlineTile,
      layout,
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
  const selectedExperienceIds = useWatch({
    control,
    name: AdIntegrationFormField.ExperienceIds,
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
  // A saved time can fall outside the generated window (e.g. an in-progress
  // campaign whose start slot has already passed today). Keep it in the list so
  // the collapsed dropdown still shows the selected time instead of going blank.
  const startTimeMenuOptions = useMemo<TimeOption[]>(
    () =>
      !startTime || startTimeOptions.some(({ value }) => value === startTime)
        ? startTimeOptions
        : [{ label: startTime, value: startTime }, ...startTimeOptions],
    [startTime, startTimeOptions],
  );
  const endTimeMenuOptions = useMemo<TimeOption[]>(
    () =>
      !endTime || endTimeOptions.some(({ value }) => value === endTime)
        ? endTimeOptions
        : [{ label: endTime, value: endTime }, ...endTimeOptions],
    [endTime, endTimeOptions],
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
  const selectedUniverseId = selectedExperienceIds[0];
  const singleRevenueSharePreview = useRevenueShareEstimatePreview({
    endTimestampMs,
    savedSignals: isMultiExperienceEnabled
      ? undefined
      : savedRevenueShareSignals?.find((signal) => signal.universeId === selectedUniverseId),
    startTimestampMs,
    universeId:
      isRevenueShareEstimateEnabled && !isMultiExperienceEnabled ? selectedUniverseId : undefined,
  });
  const multiRevenueSharePreview = useMultiRevenueShareEstimatePreview({
    endTimestampMs,
    savedSignals: isMultiExperienceEnabled ? savedRevenueShareSignals : undefined,
    startTimestampMs,
    universeIds:
      isRevenueShareEstimateEnabled && isMultiExperienceEnabled ? selectedExperienceIds : undefined,
  });
  const billableDays = isMultiExperienceEnabled
    ? multiRevenueSharePreview.billableDays
    : singleRevenueSharePreview.billableDays;
  const isRevenueShareEstimateError = isMultiExperienceEnabled
    ? multiRevenueSharePreview.isError
    : singleRevenueSharePreview.isError;
  const isRevenueShareEstimateLoading = isMultiExperienceEnabled
    ? multiRevenueSharePreview.isLoading
    : singleRevenueSharePreview.isLoading;
  const avgDailyVisits = isMultiExperienceEnabled
    ? multiRevenueSharePreview.totalAvgDailyVisits
    : singleRevenueSharePreview.avgDailyVisits;
  const maxRevenueShareMicroUsd = isMultiExperienceEnabled
    ? multiRevenueSharePreview.totalMaxRevenueShareMicroUsd
    : singleRevenueSharePreview.maxRevenueShareMicroUsd;
  const weightedCptvMicroUsd = isMultiExperienceEnabled
    ? multiRevenueSharePreview.totalWeightedCptvMicroUsd
    : singleRevenueSharePreview.weightedCptvMicroUsd;
  const universeNameById = useMemo(
    () =>
      Object.fromEntries(
        universes.map((universe) => [universe.universe_id, universe.universe_name]),
      ) as Record<number, string>,
    [universes],
  );

  const rewardedPlacementsLabelKey = 'Label.AdIntegrationNoRewardedPlacements';

  const handlePendingAdditionsChange = useCallback((assetIds: number[]) => {
    setPendingAssetIds(assetIds);
  }, []);

  const submitForm = useCallback(
    async (values: AdIntegrationCampaignDetailsFormValues) => {
      const changedFields: AdIntegrationCampaignDetailsChangedFields = {
        advertiserName: Boolean(dirtyFields.advertiserName),
        campaignName: Boolean(dirtyFields.campaignName),
        endDate: Boolean(dirtyFields.endDate),
        endTime: Boolean(dirtyFields.endTime),
        experienceIds: Boolean(dirtyFields.experienceIds),
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
      isBreakdownLoading={isRevenueShareEstimateLoading}
      isError={isRevenueShareEstimateError}
      maxRevenueShareMicroUsd={maxRevenueShareMicroUsd}
      // Only offered once every selected game has an estimate: the aggregate
      // total is undefined while the batch request is in flight, after a
      // failure, and when any universe is missing signals, so gating on it
      // keeps the breakdown from contradicting the total shown in the tile.
      onViewBreakdown={
        isMultiExperienceEnabled &&
        !isRevenueShareEstimateLoading &&
        !isRevenueShareEstimateError &&
        multiRevenueSharePreview.perUniverse.length > 0 &&
        billableDays !== undefined &&
        maxRevenueShareMicroUsd !== undefined
          ? () =>
              openRevenueShareBreakdownDialog({
                billableDays,
                estimates: multiRevenueSharePreview.perUniverse,
                totalAvgDailyVisits: multiRevenueSharePreview.totalAvgDailyVisits,
                totalMaxRevenueShareMicroUsd: multiRevenueSharePreview.totalMaxRevenueShareMicroUsd,
                totalWeightedCptvMicroUsd: multiRevenueSharePreview.totalWeightedCptvMicroUsd,
                universeNameById,
              })
          : undefined
      }
      showBreakdownButton={isMultiExperienceEnabled}
      weightedCptvMicroUsd={weightedCptvMicroUsd}
    />
  ) : null;

  return (
    <>
      <span className='text-heading-large'>{translateMisc('Heading.Registration')}</span>
      <div className={layout}>
        <div className={container}>
          <div>
            <div className={sectionHeader}>
              <span className='text-heading-small'>
                {translateAccount('Heading.IntegrationDetails')}
              </span>
              <span className='text-body-large content-default'>
                {translateAccount('Description.IntegrationDetailsBody')}
              </span>
            </div>

            <form className={formColumn} onSubmit={handleSubmit(handleFormSubmit)}>
              <AdIntegrationExperienceSection
                control={control}
                disabled={campaignInProgress || disableEditing}
                errorMessage={errors.experienceIds?.message}
                isCampaignInProgress={campaignInProgress}
                isMultiExperienceEnabled={isMultiExperienceEnabled}
                mode={mode}
                universes={universes}
              />

              <Controller
                control={control}
                name={AdIntegrationFormField.AdvertiserName}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    // TextInput interpolates `className` into its wrapper without
                    // a guard, so omitting it renders a literal "undefined" class.
                    className=''
                    error={errors.advertiserName?.message}
                    hasError={Boolean(errors.advertiserName)}
                    helperText={translate('Label.CharCount', {
                      current: String(advertiserName?.length ?? 0),
                      max: String(MaxAdvertiserNameLength),
                    })}
                    id={AdIntegrationFormField.AdvertiserName}
                    isDisabled={campaignInProgress || disableEditing}
                    label={translateAccount('Label.AdvertiserName')}
                    size='Medium'
                  />
                )}
              />

              <div className={dateTimeRow}>
                <div className={cx(halfWidth, startDateRangeErrorMessage && datePickerError)}>
                  <Controller
                    control={control}
                    name={AdIntegrationFormField.StartDate}
                    render={({ field, fieldState: { error } }) => (
                      <DateField
                        direction='Future'
                        // A cross-field range error is already reported once
                        // below the row, so keep it out of the field helper text.
                        error={isStartDateRangeError ? undefined : error?.message}
                        id='start-date'
                        isDisabled={campaignInProgress || disableEditing}
                        label={translate('Label.CampaignStartDate')}
                        locale={locale}
                        minDate={minimumAllowedStartDateMoment?.toDate()}
                        nextMonthLabel={translateReport('Label.NextMonth')}
                        onChange={(date) => {
                          field.onChange(
                            date ? moment.tz(date, timezoneDbName).format(DateFormat) : '',
                          );
                          trigger([
                            AdIntegrationFormField.StartTime,
                            AdIntegrationFormField.EndDate,
                          ]);
                        }}
                        previousMonthLabel={translateReport('Label.PreviousMonth')}
                        value={startDate ? moment(startDate, DateFormat).toDate() : null}
                      />
                    )}
                  />
                </div>
                <Controller
                  control={control}
                  name={AdIntegrationFormField.StartTime}
                  render={({ field, fieldState: { error } }) => (
                    <Dropdown
                      className={halfWidth}
                      hasError={!!error}
                      hint={error?.message || startTimeHelperText}
                      isDisabled={campaignInProgress || disableEditing || !startDate}
                      label={translate('Label.StartTime')}
                      onValueChange={(newTime) => {
                        field.onChange(newTime);
                        trigger([AdIntegrationFormField.StartDate, AdIntegrationFormField.EndDate]);
                      }}
                      placeholder={translate('Label.SelectTime')}
                      ref={field.ref}
                      size='Medium'
                      value={startTime}>
                      <Menu>
                        <MenuSection>
                          {startTimeMenuOptions.map((option) => (
                            <MenuItem
                              key={option.value}
                              title={option.label}
                              value={option.value}
                            />
                          ))}
                        </MenuSection>
                      </Menu>
                    </Dropdown>
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
                      <DateField
                        direction='Future'
                        // A cross-field range error is already reported once
                        // below the row, so keep it out of the field helper text.
                        error={isEndDateRangeError ? undefined : error?.message}
                        id='end-date'
                        isDisabled={disableEditing}
                        label={translate('Label.EndDate')}
                        locale={locale}
                        minDate={minimumAllowedEndDateMoment?.toDate()}
                        nextMonthLabel={translateReport('Label.NextMonth')}
                        onChange={(date) => {
                          field.onChange(
                            date ? moment.tz(date, timezoneDbName).format(DateFormat) : '',
                          );
                          trigger(AdIntegrationFormField.EndTime);
                        }}
                        previousMonthLabel={translateReport('Label.PreviousMonth')}
                        value={endDate ? moment(endDate, DateFormat).toDate() : null}
                      />
                    )}
                  />
                </div>
                <Controller
                  control={control}
                  name={AdIntegrationFormField.EndTime}
                  render={({ field, fieldState: { error } }) => (
                    <Dropdown
                      className={halfWidth}
                      hasError={!!error || !!endDateRangeErrorMessage}
                      hint={error?.message || endTimeHelperText}
                      isDisabled={disableEditing || !endDate}
                      label={translate('Label.EndTime')}
                      onValueChange={(newTime) => {
                        field.onChange(newTime);
                        trigger(AdIntegrationFormField.EndDate);
                      }}
                      placeholder={translate('Label.SelectTime')}
                      ref={field.ref}
                      size='Medium'
                      value={endTime}>
                      <Menu>
                        <MenuSection>
                          {endTimeMenuOptions.map((option) => (
                            <MenuItem
                              key={option.value}
                              title={option.label}
                              value={option.value}
                            />
                          ))}
                        </MenuSection>
                      </Menu>
                    </Dropdown>
                  )}
                />
              </div>
              {endDateRangeErrorMessage && (
                <FormLabel className={rowError} error>
                  {endDateRangeErrorMessage}
                </FormLabel>
              )}

              {revenueShareTile && <div className={inlineTile}>{revenueShareTile}</div>}

              <Controller
                control={control}
                name={AdIntegrationFormField.CampaignName}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    // TextInput interpolates `className` into its wrapper without
                    // a guard, so omitting it renders a literal "undefined" class.
                    className=''
                    error={errors.campaignName?.message}
                    hasError={Boolean(errors.campaignName)}
                    helperText={translate('Label.CharCount', {
                      current: String(campaignName?.length ?? 0),
                      max: String(MaxCampaignNameLength),
                    })}
                    id={AdIntegrationFormField.CampaignName}
                    isDisabled={disableEditing}
                    label={translate('Label.CampaignName')}
                    size='Medium'
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
                        <label
                          className={`text-body-medium ${campaignInProgress || disableEditing ? '' : 'cursor-pointer'}`}
                          htmlFor={rewardedPlacementsCheckboxId}
                          id={rewardedPlacementsLabelId}>
                          {translateAccountHTML(rewardedPlacementsLabelKey, [
                            {
                              closing: 'linkEnd',
                              content: (chunks) => (
                                <Link
                                  href='https://en.help.roblox.com/hc/en-us/articles/13722260778260-Advertising-Standards'
                                  rel='noopener noreferrer'
                                  target='_blank'
                                  underline='always'>
                                  {chunks}
                                </Link>
                              ),
                              opening: 'linkStart',
                            },
                          ])}
                        </label>
                      </div>
                    )}
                  />
                </div>
              )}

              <div className={subSection}>
                <span className='text-heading-small'>{translateAccount('Heading.Assets')}</span>
                <span className='text-body-large content-default'>
                  {translateAccountHTML('Description.AdIntegrationAssetsBody', [
                    {
                      closing: 'linkEnd',
                      content: (chunks) => (
                        <Link
                          href={AdIntegrationsDocsUrl}
                          rel='noopener noreferrer'
                          target='_blank'
                          underline='always'>
                          {chunks}
                        </Link>
                      ),
                      opening: 'linkStart',
                    },
                  ])}
                </span>
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
                  universeId={isMultiExperienceEnabled ? undefined : selectedExperienceIds[0]}
                  universeIds={isMultiExperienceEnabled ? selectedExperienceIds : undefined}
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
                          <label
                            className={`text-body-medium ${mode === 'edit' ? '' : 'cursor-pointer'}`}
                            htmlFor={termsAcknowledgementCheckboxId}
                            id={termsAcknowledgementLabelId}>
                            {translateAccountHTML(
                              'Label.AdIntegrationTermsAndAdsStandardsAcknowledgement',
                              [
                                {
                                  closing: 'tosLinkEnd',
                                  content: (chunks) => (
                                    <Link
                                      href='https://en.help.roblox.com/hc/en-us/articles/115004647846-Roblox-Terms-of-Use'
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
                          </label>
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

              <div className={`text-body-large ${buttonRow}`}>
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
              </div>
            </form>
          </div>
        </div>
        {revenueShareTile && <aside className={sidebar}>{revenueShareTile}</aside>}
      </div>
    </>
  );
};

export default AdIntegrationCampaignDetailsForm;
