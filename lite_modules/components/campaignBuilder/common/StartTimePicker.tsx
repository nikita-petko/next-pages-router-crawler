import { useLocalization } from '@rbx/intl';
import { DatePicker, MenuItem, PickersUtilsProvider, Select, TextField, Tooltip } from '@rbx/ui';
import moment from 'moment-timezone';
import { ChangeEvent, ReactNode, useMemo, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import useFormLayoutStyles from '@components/campaignBuilder/common/FormLayout.styles';
import { defaultTimeZone } from '@constants/app';
import {
  DateFormat,
  FlowTypes,
  FORM_HELPER_TEXT_PROPS,
  FormField,
  INPUT_LABEL_PROPS,
} from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useDateFnsLocale from '@hooks/useDateFnsLocale';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { TimeOption } from '@type/campaignBuilder';
import {
  GenerateTimeOptions,
  GetEditCampaignDisabledTooltipText,
  IsEditCampaignDisabled,
} from '@utils/campaignBuilder';
import { getSelectedTimeConversion } from '@utils/scheduleTimeConversion';
import {
  getLocalizedTimezoneTitle,
  GetTimezoneObjFromEnum,
  GetValidatedTimezoneDbName,
} from '@utils/timezone';

const StartTimePicker = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  // Timezone city labels (Label.TimezoneCity.*) are defined in the Timezone
  // namespace, so resolve them separately from the Campaign copy.
  const { translate: translateTimezone } = useNamespacedTranslation(TranslationNamespace.Timezone);
  const { locale } = useLocalization();
  const dateFnsLocale = useDateFnsLocale();
  const { control, getValues, trigger } = useFormContext<FormType>();
  const startDate = useWatch<FormType, typeof FormField.START_DATE>({
    name: FormField.START_DATE,
  });
  const startTime = useWatch<FormType, typeof FormField.START_TIME>({
    name: FormField.START_TIME,
  });
  const isExtendToOffPlatformEnabled = useWatch<
    FormType,
    typeof FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED
  >({
    name: FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED,
  });
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const { offPlatformRequestMinimumDaysFromStartDate } = useAppStore(
    (state) => state.appMetadataState.data,
  );
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
  const timezoneTitle = useMemo(
    () =>
      locale && rawTimezoneDbName
        ? getLocalizedTimezoneTitle(timezoneDbName, cityKey, locale, translateTimezone)
        : staticTimezoneTitle,
    [timezoneDbName, cityKey, rawTimezoneDbName, staticTimezoneTitle, locale, translateTimezone],
  );
  const simplifiedCampaignStartTime = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.start_timestamp_ms,
  );
  const flowType = useCampaignBuilderStore((state) => state.flowType);
  const editMode = flowType === FlowTypes.EDIT;
  const campaignStatus = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.display_status,
  );

  const {
    classes: { formRow, fullWidth, halfWidth },
    cx,
  } = useFormLayoutStyles();

  const isToday = useMemo<boolean>(
    () =>
      moment.tz(startDate, DateFormat, timezoneDbName).isSame(moment().tz(timezoneDbName), 'day'),
    [startDate, timezoneDbName],
  );

  const timeOptions = useMemo<TimeOption[]>(
    () => GenerateTimeOptions(isToday, timezoneDbName, locale),
    [isToday, timezoneDbName, locale],
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
  const startTimeHelperText = startTimeConversionText || timezoneTitle;

  const isEditingStartedCampaign = Boolean(
    editMode && simplifiedCampaignStartTime && simplifiedCampaignStartTime < Date.now(),
  );

  const isEditingOffPlatformCampaign = isExtendToOffPlatformEnabled && editMode;

  const GetTooltipText = () => {
    const editCampaignDisabledTooltip = GetEditCampaignDisabledTooltipText(
      flowType,
      campaignStatus,
    );
    if (isEditingOffPlatformCampaign) {
      return translate('Description.OffPlatformStartDisabled');
    }
    if (editCampaignDisabledTooltip) {
      return translate(editCampaignDisabledTooltip);
    }
    if (isEditingStartedCampaign) {
      return translate('Description.EditDisabledStarted');
    }
    return '';
  };

  const isDisabled =
    isEditingStartedCampaign ||
    isEditingOffPlatformCampaign ||
    IsEditCampaignDisabled(flowType, campaignStatus);
  const startDateHelperText = useMemo<string>(() => {
    if (editMode) {
      return '';
    }
    if (isExtendToOffPlatformEnabled) {
      return translate('Description.OffPlatformMinDays', {
        days: String(offPlatformRequestMinimumDaysFromStartDate),
      });
    }
    return '';
  }, [
    editMode,
    isExtendToOffPlatformEnabled,
    offPlatformRequestMinimumDaysFromStartDate,
    translate,
  ]);

  return (
    <PickersUtilsProvider adapterLocale={dateFnsLocale}>
      <div className={`text-body-large ${cx(formRow, fullWidth)}`}>
        <span className={`text-body-large ${halfWidth}`}>
          <Controller
            control={control}
            name={FormField.START_DATE}
            render={({ field, fieldState: { error } }) => (
              <DatePicker
                className={fullWidth}
                disabled={isDisabled}
                disablePast
                format='MMM dd, yyyy'
                label={translate('Label.CampaignStartDate')}
                minDate={
                  getValues(FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED)
                    ? moment().add(offPlatformRequestMinimumDaysFromStartDate, 'days').toDate()
                    : undefined
                }
                onChange={(date) => {
                  logNativeClickEvent(EventName.StartDateChanged, {
                    flowType,
                    previousValue: field.value.toString(),
                    value: date?.toString(),
                  });
                  field.onChange(moment.tz(date, timezoneDbName).format(DateFormat));
                  trigger(FormField.START_TIME);
                }}
                onClose={() => setIsOpen(false)}
                open={isOpen}
                renderInput={(params) => (
                  <Tooltip placement='top-start' title={GetTooltipText()}>
                    <div>
                      <TextField
                        {...params}
                        error={!!error}
                        FormHelperTextProps={FORM_HELPER_TEXT_PROPS}
                        helperText={error?.message || startDateHelperText}
                        id='start-date'
                        InputLabelProps={INPUT_LABEL_PROPS}
                        label={translate('Label.CampaignStartDate')}
                        onBlur={field.onBlur}
                        onClick={isDisabled ? undefined : () => setIsOpen(true)}
                        ref={field.ref}
                        variant='outlined'
                      />
                    </div>
                  </Tooltip>
                )}
                value={moment(startDate).toDate()}
              />
            )}
          />
        </span>

        <Controller
          control={control}
          name={FormField.START_TIME}
          render={({ field, fieldState: { error } }) => (
            <div className={halfWidth}>
              <Tooltip placement='top-start' title={GetTooltipText()}>
                <Select
                  className={fullWidth}
                  disabled={isDisabled || !startDate}
                  error={!!error}
                  FormHelperTextProps={{
                    sx: {
                      zIndex: 0,
                    },
                  }}
                  fullWidth
                  helperText={error?.message || startTimeHelperText}
                  InputLabelProps={{
                    sx: {
                      zIndex: 0,
                    },
                  }}
                  label={translate('Label.CampaignStartTime')}
                  onBlur={field.onBlur}
                  onChange={(event: ChangeEvent<{ value: string }>) => {
                    const newTime = event.target.value;
                    field.onChange(event);
                    logNativeClickEvent(EventName.StartTimeChanged, {
                      flowType,
                      previousValue: field.value.toString(),
                      value: newTime,
                    });
                  }}
                  ref={field.ref}
                  renderValue={(selected) =>
                    timeOptions.find((option) => option.value === selected)?.label ??
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
                  {timeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </Tooltip>
              {error && startTimeConversionText && (
                <span className='text-body-medium content-default'>{startTimeConversionText}</span>
              )}
            </div>
          )}
        />
      </div>
    </PickersUtilsProvider>
  );
};

export default StartTimePicker;
