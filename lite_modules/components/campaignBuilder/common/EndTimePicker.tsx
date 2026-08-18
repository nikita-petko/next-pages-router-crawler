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

const EndTimePicker = () => {
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
  const endDate = useWatch<FormType, typeof FormField.END_DATE>({
    name: FormField.END_DATE,
  });
  const endTime = useWatch<FormType, typeof FormField.END_TIME>({
    name: FormField.END_TIME,
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

  // Same `moment(endDate)` parse the MUI picker was handed, but an unparseable
  // stored value becomes `null` instead of an Invalid Date: the calendar formats
  // and serializes whatever it is given, so NaN would throw rather than render.
  const endDateValue = useMemo<Date | null>(() => {
    const parsedEndDate = moment(endDate);
    return parsedEndDate.isValid() ? parsedEndDate.toDate() : null;
  }, [endDate]);

  const timeOptions = useMemo<TimeOption[]>(
    () => GenerateTimeOptions(isToday, timezoneDbName, locale),
    [isToday, timezoneDbName, locale],
  );
  // The saved end time can fall outside the generated window (e.g. a campaign
  // ending later today whose slot has already passed). Keep it in the list so the
  // collapsed dropdown still shows the selected time instead of going blank.
  const timeMenuOptions = useMemo<TimeOption[]>(
    () =>
      !endTime || timeOptions.some(({ value }) => value === endTime)
        ? timeOptions
        : [{ label: endTime, value: endTime }, ...timeOptions],
    [endTime, timeOptions],
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
    <div className={`text-body-large ${cx(formRow, fullWidth)}`}>
      <span className={`text-body-large ${halfWidth}`}>
        <Controller
          control={control}
          name={FormField.END_DATE}
          render={({ field, fieldState: { error } }) => (
            <AppTooltip title={GetTooltipText()}>
              <div className={fullWidth}>
                <DateField
                  direction='Future'
                  error={error?.message}
                  id='end-date'
                  isDisabled={isEditDisabled}
                  label={translate('Label.EndDate')}
                  locale={locale}
                  minDate={
                    getValues(FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED)
                      ? moment().add(offPlatformRequestMinimumDaysFromStartDate, 'days').toDate()
                      : undefined
                  }
                  nextMonthLabel={translateReport('Label.NextMonth')}
                  onChange={(date) => {
                    logNativeClickEvent(EventName.EndDateChanged, {
                      flowType,
                      previousValue: field.value?.toString() || '',
                      value: date?.toString() || '',
                    });
                    field.onChange(moment.tz(date, timezoneDbName).format(DateFormat));
                    trigger(FormField.END_TIME);
                  }}
                  previousMonthLabel={translateReport('Label.PreviousMonth')}
                  value={endDateValue}
                />
              </div>
            </AppTooltip>
          )}
        />
      </span>

      <Controller
        control={control}
        name={FormField.END_TIME}
        render={({ field, fieldState: { error } }) => (
          <div className={halfWidth}>
            <AppTooltip title={GetTooltipText()}>
              <div>
                <Dropdown
                  className={fullWidth}
                  hasError={!!error}
                  hint={error?.message || endTimeHelperText}
                  isDisabled={isEditDisabled || !endDate}
                  label={translate('Label.EndTime')}
                  onValueChange={(newTime) => {
                    logNativeClickEvent(EventName.EndTimeChanged, {
                      flowType,
                      previousValue: field.value?.toString() || '',
                      value: newTime,
                    });
                    field.onChange(newTime);
                  }}
                  placeholder={translate('Label.SelectTime')}
                  ref={field.ref}
                  size='Medium'
                  value={endTime}>
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
            {error && endTimeConversionText && (
              <span className='text-body-medium content-default'>{endTimeConversionText}</span>
            )}
          </div>
        )}
      />
    </div>
  );
};

export default EndTimePicker;
