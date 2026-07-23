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

const EndTimePicker = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  // Timezone city labels (Label.TimezoneCity.*) are defined in the Timezone
  // namespace, so resolve them separately from the Campaign copy.
  const { translate: translateTimezone } = useNamespacedTranslation(TranslationNamespace.Timezone);
  const { locale } = useLocalization();
  const dateFnsLocale = useDateFnsLocale();
  const { control, getValues, trigger } = useFormContext<FormType>();
  const endDate = useWatch<FormType, typeof FormField.END_DATE>({
    name: FormField.END_DATE,
  });
  const endTime = useWatch<FormType, typeof FormField.END_TIME>({
    name: FormField.END_TIME,
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
  const isOffPlatformCampaign = useCampaignBuilderStore(
    (state) => !!state.simplifiedCampaign?.data?.off_platform_request_id,
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
      endDate
        ? moment.tz(endDate, DateFormat, timezoneDbName).isSame(moment().tz(timezoneDbName), 'day')
        : false,
    [endDate, timezoneDbName],
  );

  const timeOptions = useMemo<TimeOption[]>(
    () => GenerateTimeOptions(isToday, timezoneDbName, locale),
    [isToday, timezoneDbName, locale],
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
  const endTimeHelperText = endTimeConversionText || timezoneTitle;

  const isEditingStartedCampaign = Boolean(
    editMode && simplifiedCampaignStartTime && simplifiedCampaignStartTime < Date.now(),
  );

  const GetTooltipText = () => {
    if (editMode && isOffPlatformCampaign) {
      return translate('Description.OffPlatformBudgetDisabled');
    }
    const editCampaignDisabledTooltip = GetEditCampaignDisabledTooltipText(
      flowType,
      campaignStatus,
    );
    if (editCampaignDisabledTooltip) {
      return translate(editCampaignDisabledTooltip);
    }
    if (isEditingStartedCampaign) {
      return translate('Description.EditDisabledStarted');
    }
    return '';
  };

  const isEditDisabled =
    isEditingStartedCampaign ||
    IsEditCampaignDisabled(flowType, campaignStatus) ||
    (editMode && isOffPlatformCampaign);

  return (
    <PickersUtilsProvider adapterLocale={dateFnsLocale}>
      <div className={`text-body-large ${cx(formRow, fullWidth)}`}>
        <span className={`text-body-large ${halfWidth}`}>
          <Controller
            control={control}
            name={FormField.END_DATE}
            render={({ field, fieldState: { error } }) => (
              <DatePicker
                className={fullWidth}
                disabled={isEditDisabled}
                disablePast
                format='MMM dd, yyyy'
                label={translate('Label.EndDate')}
                minDate={
                  getValues(FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED)
                    ? moment().add(offPlatformRequestMinimumDaysFromStartDate, 'days').toDate()
                    : undefined
                }
                onChange={(date) => {
                  logNativeClickEvent(EventName.EndDateChanged, {
                    flowType,
                    previousValue: field.value?.toString() || '',
                    value: date?.toString() || '',
                  });
                  field.onChange(moment.tz(date, timezoneDbName).format(DateFormat));
                  trigger(FormField.END_TIME);
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
                        helperText={error?.message}
                        id='end-date'
                        InputLabelProps={INPUT_LABEL_PROPS}
                        label={translate('Label.EndDate')}
                        onBlur={field.onBlur}
                        onClick={isEditDisabled ? undefined : () => setIsOpen(true)}
                        ref={field.ref}
                        variant='outlined'
                      />
                    </div>
                  </Tooltip>
                )}
                value={moment(endDate).toDate()}
              />
            )}
          />
        </span>

        <Controller
          control={control}
          name={FormField.END_TIME}
          render={({ field, fieldState: { error } }) => (
            <div className={halfWidth}>
              <Tooltip placement='top-start' title={GetTooltipText()}>
                <Select
                  className={fullWidth}
                  disabled={isEditDisabled || !endDate}
                  error={!!error}
                  FormHelperTextProps={{
                    sx: {
                      zIndex: 0,
                    },
                  }}
                  fullWidth
                  helperText={error?.message || endTimeHelperText}
                  InputLabelProps={{
                    sx: {
                      zIndex: 0,
                    },
                  }}
                  label={translate('Label.EndTime')}
                  onBlur={field.onBlur}
                  onChange={(event: ChangeEvent<{ value: string }>) => {
                    const newTime = event.target.value;
                    field.onChange(event);
                    logNativeClickEvent(EventName.EndTimeChanged, {
                      flowType,
                      previousValue: field.value?.toString() || '',
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
                  value={endTime}>
                  {timeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </Tooltip>
              {error && endTimeConversionText && (
                <span className='text-body-medium content-default'>{endTimeConversionText}</span>
              )}
            </div>
          )}
        />
      </div>
    </PickersUtilsProvider>
  );
};

export default EndTimePicker;
