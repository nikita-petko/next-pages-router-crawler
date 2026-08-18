import { Dropdown, Menu, MenuItem, MenuSection } from '@rbx/foundation-ui';
import { useLocalization } from '@rbx/intl';
import moment from 'moment-timezone';
import { useMemo } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import useFormLayoutStyles from '@components/campaignBuilder/common/FormLayout.styles';
import AppTooltip from '@components/common/AppTooltip';
import DateField from '@components/common/form/DateField';
import { defaultTimeZone } from '@constants/app';
import { DateFormat, FlowTypes, FormField } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
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
  // Calendar navigation labels (Label.NextMonth / Label.PreviousMonth) only exist
  // in the Report namespace, and the localization rules require reusing an
  // existing key rather than duplicating the string into Campaign.
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);
  const { locale } = useLocalization();
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

  // Same `moment(startDate)` parse the MUI picker was handed, but an unparseable
  // stored value becomes `null` instead of an Invalid Date: the calendar formats
  // and serializes whatever it is given, so NaN would throw rather than render.
  const startDateValue = useMemo<Date | null>(() => {
    const parsedStartDate = moment(startDate);
    return parsedStartDate.isValid() ? parsedStartDate.toDate() : null;
  }, [startDate]);

  const timeOptions = useMemo<TimeOption[]>(
    () => GenerateTimeOptions(isToday, timezoneDbName, locale),
    [isToday, timezoneDbName, locale],
  );
  // The saved start time can fall outside the generated window (e.g. a campaign
  // that already started earlier today). Keep it in the list so the collapsed
  // dropdown still shows the selected time instead of going blank.
  const timeMenuOptions = useMemo<TimeOption[]>(
    () =>
      !startTime || timeOptions.some(({ value }) => value === startTime)
        ? timeOptions
        : [{ label: startTime, value: startTime }, ...timeOptions],
    [startTime, timeOptions],
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
    <div className={`text-body-large ${cx(formRow, fullWidth)}`}>
      <span className={`text-body-large ${halfWidth}`}>
        <Controller
          control={control}
          name={FormField.START_DATE}
          render={({ field, fieldState: { error } }) => (
            <AppTooltip title={GetTooltipText()}>
              <div className={fullWidth}>
                <DateField
                  direction='Future'
                  error={error?.message}
                  helperText={startDateHelperText}
                  id='start-date'
                  isDisabled={isDisabled}
                  label={translate('Label.CampaignStartDate')}
                  locale={locale}
                  minDate={
                    getValues(FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED)
                      ? moment().add(offPlatformRequestMinimumDaysFromStartDate, 'days').toDate()
                      : undefined
                  }
                  nextMonthLabel={translateReport('Label.NextMonth')}
                  onChange={(date) => {
                    logNativeClickEvent(EventName.StartDateChanged, {
                      flowType,
                      previousValue: field.value.toString(),
                      value: date?.toString(),
                    });
                    field.onChange(moment.tz(date, timezoneDbName).format(DateFormat));
                    trigger(FormField.START_TIME);
                  }}
                  previousMonthLabel={translateReport('Label.PreviousMonth')}
                  value={startDateValue}
                />
              </div>
            </AppTooltip>
          )}
        />
      </span>

      <Controller
        control={control}
        name={FormField.START_TIME}
        render={({ field, fieldState: { error } }) => (
          <div className={halfWidth}>
            <AppTooltip title={GetTooltipText()}>
              <div>
                <Dropdown
                  className={fullWidth}
                  hasError={!!error}
                  hint={error?.message || startTimeHelperText}
                  isDisabled={isDisabled || !startDate}
                  label={translate('Label.CampaignStartTime')}
                  onValueChange={(newTime) => {
                    logNativeClickEvent(EventName.StartTimeChanged, {
                      flowType,
                      previousValue: field.value?.toString() || '',
                      value: newTime,
                    });
                    field.onChange(newTime);
                  }}
                  placeholder={translate('Label.SelectTime')}
                  ref={field.ref}
                  size='Medium'
                  value={startTime}>
                  <Menu>
                    <MenuSection>
                      {timeMenuOptions.map((option) => (
                        <MenuItem key={option.value} title={option.label} value={option.value} />
                      ))}
                    </MenuSection>
                  </Menu>
                </Dropdown>
              </div>
            </AppTooltip>
            {error && startTimeConversionText && (
              <span className='text-body-medium content-default'>{startTimeConversionText}</span>
            )}
          </div>
        )}
      />
    </div>
  );
};

export default StartTimePicker;
