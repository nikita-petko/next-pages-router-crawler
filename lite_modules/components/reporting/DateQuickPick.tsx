import {
  DateRangePreset,
  PopoverDateRangeControl,
  PopoverDateRangeControlProps,
} from '@rbx/date-range-picker';
import { IconButton } from '@rbx/foundation-ui';
import { FormControl, FormHelperText } from '@rbx/ui';
import moment from 'moment-timezone';
import { useMemo, useRef } from 'react';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import useDateQuickPickStyles from '@components/reporting/DateQuickPick.styles';
import DateFilteringTimePeriod from '@constants/dateFilteringTimePeriod';
import {
  dateFilteringTimePeriodToPreset,
  dateRangePresetToBackend,
  WACAM_DATE_RANGE_PRESETS,
} from '@constants/dateRangePresetMapping';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { NewFlowStoreType, useNewFlowStore } from '@stores/newFlowStoreProvider';
import { ConvertDateFilteringEnumToString } from '@utils/enumToString';
import { CaptureException } from '@utils/error';

const PRESET_LABEL_KEYS: Partial<Record<DateRangePreset, string>> = {
  [DateRangePreset.Last30Days]: 'Label.Last30Days',
  [DateRangePreset.Last7Days]: 'Label.Last7Days',
  [DateRangePreset.LastMonth]: 'Label.LastMonth',
  [DateRangePreset.PreviousYear]: 'Label.PreviousYear',
  [DateRangePreset.ThisMonth]: 'Label.ThisMonth',
  [DateRangePreset.Today]: 'Label.Today',
  [DateRangePreset.YearToDate]: 'Label.YearToDate',
  [DateRangePreset.Yesterday]: 'Label.Yesterday',
};

// AMA caps custom ranges at 731 days (~2 years, sized to span a leap year); derive the
// picker's minimum start date from the max end date so the UI can't produce a range the
// API will reject.
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_END_DATE_OFFSET_MS = DAY_MS;
const MAX_RANGE_MS = 731 * DAY_MS;

// The picker treats `startDate` / `endDate` via the browser's local Date
// components (mirroring `toUtcCalendarDate`, which populates `now` /
// `maxEndDate` such that local YMD equals the intended calendar day). Both
// parse and format must therefore use local components so the roundtrip
// picker → store → picker preserves the user's chosen day.
const CUSTOM_DATE_FORMAT = 'YYYY-MM-DD';
const formatCustomDate = (date: Date): string => moment(date).format(CUSTOM_DATE_FORMAT);
const parseCustomDate = (value: string | undefined): Date | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = moment(value, CUSTOM_DATE_FORMAT, true);
  return parsed.isValid() ? parsed.toDate() : undefined;
};

export const toUtcCalendarDate = (date: Date): Date =>
  new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds(),
  );

const DateQuickPick = () => {
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const {
    classes: { dateQuickPickContainer },
  } = useDateQuickPickStyles();

  const dateSelectionState = useNewFlowStore((state: NewFlowStoreType) => state.dateSelectionState);
  const campaignsIsLoading = useNewFlowStore(
    (state: NewFlowStoreType) => state.campaignsState.isLoading,
  );
  const summaryStatsIsLoading = useNewFlowStore(
    (state: NewFlowStoreType) => state.summaryStatsState.isLoading,
  );
  const handleDateSelectionChange = useNewFlowStore(
    (state: NewFlowStoreType) => state.handleDateSelectionChange,
  );
  const isCustomDateRangeEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState.data?.isCustomDateRangeEnabled ?? false,
  );

  const isDisabled = campaignsIsLoading || summaryStatsIsLoading;

  const currentPreset =
    dateFilteringTimePeriodToPreset(dateSelectionState.currentSelection) ??
    DateRangePreset.Last7Days;
  const lastRequestedDateSelection = useRef<{
    customEndDate?: string;
    customStartDate?: string;
    selection: DateFilteringTimePeriod;
  }>({
    customEndDate: dateSelectionState.customEndDate,
    customStartDate: dateSelectionState.customStartDate,
    selection: dateSelectionState.currentSelection,
  });

  const presetLabels = useMemo<PopoverDateRangeControlProps['presetLabels']>(() => {
    const entries = WACAM_DATE_RANGE_PRESETS.map(
      (preset) => [preset, PRESET_LABEL_KEYS[preset]] as const,
    )
      .filter((entry): entry is [DateRangePreset, string] => entry[1] !== undefined)
      .map(([preset, key]) => [preset, translateReport(key)] as const);
    return Object.fromEntries(entries);
  }, [translateReport]);

  const pickerLabels = useMemo<PopoverDateRangeControlProps['pickerLabels']>(
    () => ({
      apply: translateReport('Action.Apply'),
      cancel: translateReport('Action.Cancel'),
      nextMonth: translateReport('Label.NextMonth'),
      previousMonth: translateReport('Label.PreviousMonth'),
      resetAll: translateReport('Action.ResetAll'),
    }),
    [translateReport],
  );

  const customLabel = useMemo(
    () => (isCustomDateRangeEnabled ? translateMisc('Label.Custom') : undefined),
    [isCustomDateRangeEnabled, translateMisc],
  );

  const handleChange = (next: DateRangePreset) => {
    if (isDisabled) {
      return;
    }
    const backendValue = dateRangePresetToBackend(next);
    if (backendValue === null) {
      CaptureException(`invalid DateRangePreset selection: ${next}`);
      return;
    }
    // The Custom preset never flows through here - the picker fires
    // onCustomDateRangeChangeConfirmed instead, which carries the dates.
    if (backendValue === DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM) {
      return;
    }
    lastRequestedDateSelection.current = { selection: backendValue };
    handleDateSelectionChange(backendValue);
    logNativeClickEvent(EventName.DateFilteringOptionClicked, {
      dateFilteringOption: ConvertDateFilteringEnumToString(backendValue),
    });
  };

  const handleCustomConfirmed = (startDate: Date, endDate: Date) => {
    if (isDisabled) {
      return;
    }
    const customStartDate = formatCustomDate(startDate);
    const customEndDate = formatCustomDate(endDate);
    lastRequestedDateSelection.current = {
      customEndDate,
      customStartDate,
      selection: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM,
    };
    handleDateSelectionChange(
      DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM,
      customStartDate,
      customEndDate,
    );
    logNativeClickEvent(EventName.DateFilteringOptionClicked, {
      dateFilteringOption: ConvertDateFilteringEnumToString(
        DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM,
      ),
    });
  };

  // TODO(ADS-11144 follow-up): `PopoverDateRangeControl` does not expose an
  // `isDisabled` prop yet. Once it does, drop the wrapper below and pass it
  // through directly.
  const { maxEndDate, minStartDate, now } = useMemo(() => {
    const currentTime = new Date();
    const maxEndTime = currentTime.getTime() + MAX_END_DATE_OFFSET_MS;
    return {
      maxEndDate: toUtcCalendarDate(new Date(maxEndTime)),
      minStartDate: toUtcCalendarDate(new Date(maxEndTime - MAX_RANGE_MS)),
      now: toUtcCalendarDate(currentTime),
    };
  }, []);

  const { customEndDate, customStartDate } = dateSelectionState;
  const displayStartDate = parseCustomDate(customStartDate) ?? now;
  const displayEndDate = parseCustomDate(customEndDate) ?? now;

  return (
    <FormControl
      className={dateQuickPickContainer}
      error={dateSelectionState.isError}
      variant='outlined'>
      <div
        aria-disabled={isDisabled}
        className={isDisabled ? 'pointer-events-none opacity-60' : undefined}>
        <PopoverDateRangeControl
          customLabel={customLabel}
          dateRangeType={currentPreset}
          endDate={displayEndDate}
          label={translateReport('Label.DateRange')}
          maxEndDate={maxEndDate}
          minStartDate={minStartDate}
          onChangeRangeType={handleChange}
          onCustomDateRangeChangeConfirmed={handleCustomConfirmed}
          pickerLabels={pickerLabels}
          presetLabels={presetLabels}
          presetOptions={WACAM_DATE_RANGE_PRESETS}
          startDate={displayStartDate}
        />
      </div>
      {dateSelectionState.isError && (
        <FormHelperText
          className='flex items-center gap-xsmall'
          data-testid='datePickerErrorHelperText'>
          {translateCampaign('Description.FailedToFetch')}
          <IconButton
            ariaLabel={translateMisc('Action.Retry')}
            icon='icon-regular-arrow-spin-clockwise'
            isCircular
            isDisabled={isDisabled}
            onClick={() => {
              logNativeClickEvent(EventName.ReportingRetryClicked, {
                retryTarget: 'dateSelection',
              });
              const {
                customEndDate: requestedCustomEndDate,
                customStartDate: requestedCustomStartDate,
                selection,
              } = lastRequestedDateSelection.current;
              handleDateSelectionChange(
                selection,
                requestedCustomStartDate,
                requestedCustomEndDate,
              );
            }}
            size='XSmall'
            variant='Utility'
          />
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default DateQuickPick;
