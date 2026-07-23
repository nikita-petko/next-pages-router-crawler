import {
  DateRangePreset,
  PopoverDateRangeControl,
  PopoverDateRangeControlProps,
} from '@rbx/date-range-picker';
import { FormControl, FormHelperText } from '@rbx/ui';
import { useMemo, useState } from 'react';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import GenericSnackBar from '@components/common/GenericSnackBar';
import useDateQuickPickStyles from '@components/reporting/DateQuickPick.styles';
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

// Custom preset is gated on `isCustomDateRangeEnabled` metadata. The store,
// backend, and summary/timeseries APIs still need caller-supplied start/end
// date support before Custom can actually be wired through - the flag lets us
// dark-launch the UI without exposing a broken flow.
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

// Bounds are effectively unconstrained today because Custom is disabled.
// Once Custom lands, replace with the ad account's real min/max window.
const MIN_START_DATE = new Date(2020, 0, 1);
const MAX_END_DATE_OFFSET_MS = 24 * 60 * 60 * 1000;

const DateQuickPick = () => {
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const {
    classes: { dateQuickPickContainer },
  } = useDateQuickPickStyles();

  const [customComingSoonOpen, setCustomComingSoonOpen] = useState<boolean>(false);

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
    DateRangePreset.Last30Days;

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
    handleDateSelectionChange(backendValue);
    logNativeClickEvent(EventName.DateFilteringOptionClicked, {
      dateFilteringOption: ConvertDateFilteringEnumToString(backendValue),
    });
  };

  const handleCustomConfirmed = () => {
    if (isDisabled) {
      return;
    }
    // TODO(ADS-11144 follow-up): wire Custom start/end through the new-flow
    // store and summary/timeseries APIs. Toast + log for now so we can surface
    // dark-launch traffic while the flag is on.
    logNativeClickEvent(EventName.DateFilteringOptionClicked, {
      dateFilteringOption: 'CustomComingSoon',
    });
    setCustomComingSoonOpen(true);
  };

  // TODO(ADS-11144 follow-up): `PopoverDateRangeControl` does not expose an
  // `isDisabled` prop yet. Once it does, drop the wrapper below and pass it
  // through directly.
  const { maxEndDate, now } = useMemo(() => {
    const currentTime = new Date();
    return {
      maxEndDate: new Date(currentTime.getTime() + MAX_END_DATE_OFFSET_MS),
      now: currentTime,
    };
  }, []);

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
          endDate={now}
          label={translateReport('Label.DateRange')}
          maxEndDate={maxEndDate}
          minStartDate={MIN_START_DATE}
          onChangeRangeType={handleChange}
          onCustomDateRangeChangeConfirmed={handleCustomConfirmed}
          pickerLabels={pickerLabels}
          presetLabels={presetLabels}
          presetOptions={WACAM_DATE_RANGE_PRESETS}
          startDate={now}
        />
      </div>
      {dateSelectionState.isError && (
        <FormHelperText data-testid='datePickerErrorHelperText'>
          {translateCampaign('Description.FailedToFetch')}
        </FormHelperText>
      )}
      {customComingSoonOpen && (
        <GenericSnackBar
          message={translateReport('Description.CustomDateRangeComingSoon')}
          onClose={() => setCustomComingSoonOpen(false)}
          severity='warning'
        />
      )}
    </FormControl>
  );
};

export default DateQuickPick;
