import {
  DateRangePreset,
  PopoverDateRangeControl,
  PopoverDateRangeControlProps,
} from '@rbx/date-range-picker';
import { IconButton } from '@rbx/foundation-ui';
import { FormControl, FormHelperText } from '@rbx/ui';
import moment from 'moment-timezone';
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import useSyncedDateRangePickerStyles from '@components/reporting/SyncedDateRangePicker.styles';
import DateFilteringTimePeriod from '@constants/dateFilteringTimePeriod';
import { DATE_RANGE_PRESETS } from '@constants/dateRangePresetMapping';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { NewFlowStoreType, useNewFlowStore } from '@stores/newFlowStoreProvider';
import {
  derivePresetFromBounds,
  parseDateSelectionFromQuery,
  resolveDefaultTreatmentSelection,
  resolveLastNDaysInReportingTz,
  writeDateSelectionToUrl,
} from '@utils/dateSelectionUrl';
import { ConvertDateFilteringEnumToString } from '@utils/enumToString';
import { CaptureException } from '@utils/error';

const PRESET_LABEL_KEYS: Partial<Record<DateRangePreset, string>> = {
  [DateRangePreset.Last28Days]: 'Label.Last28Days',
  [DateRangePreset.Last56Days]: 'Label.Last56Days',
  [DateRangePreset.Last7Days]: 'Label.Last7Days',
  [DateRangePreset.Last90Days]: 'Label.Last90Days',
};

// AMA caps custom ranges at 731 days (~2 years, sized to span a leap year); derive the
// picker's minimum start date from the max end date so the UI can't produce a range the
// API will reject.
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_END_DATE_OFFSET_MS = DAY_MS;
const MAX_RANGE_MS = 731 * DAY_MS;

const CUSTOM_DATE_FORMAT = 'YYYY-MM-DD';

const formatCustomDate = (date: Date): string => moment(date).format(CUSTOM_DATE_FORMAT);
const parseCustomDate = (value: string | undefined): Date | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = moment(value, CUSTOM_DATE_FORMAT, true);
  return parsed.isValid() ? parsed.toDate() : undefined;
};

const toUtcCalendarDate = (date: Date): Date =>
  new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds(),
  );

type SyncedDateRangePickerProps = {
  /** Disables the picker and dims it. */
  isDisabled?: boolean;
  /** Overrides the default `data-testid` on the trigger button. */
  testId?: string;
};

/**
 * URL-driven date-range picker used under the `isCustomDateRangeEnabled`
 * treatment arm. The URL (`?rangeType=...&minTime=...&maxTime=...`) is the
 * source of truth; selection changes write the URL and call
 * `refetchForDateSelection` (fetches only, no store write). Two instances
 * on the same screen stay in sync automatically via the shared router
 * query. Control-arm behavior lives in the legacy `DateQuickPick`.
 */
const SyncedDateRangePicker = ({ isDisabled = false, testId }: SyncedDateRangePickerProps) => {
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const {
    classes: { syncedDateRangePickerContainer },
  } = useSyncedDateRangePickerStyles();
  const router = useRouter();

  const refetchForDateSelection = useNewFlowStore(
    (state: NewFlowStoreType) => state.refetchForDateSelection,
  );
  const commitDateSelection = useNewFlowStore(
    (state: NewFlowStoreType) => state.commitDateSelection,
  );
  const campaignsIsError = useNewFlowStore(
    (state: NewFlowStoreType) => state.campaignsState.isError,
  );
  const summaryStatsIsError = useNewFlowStore(
    (state: NewFlowStoreType) => state.summaryStatsState.isError,
  );
  const fetchIsError = campaignsIsError || summaryStatsIsError;

  // URL is the source of truth; fall back to the default preset when empty.
  // The SEVEN_DAYS fallback is defensive — hit only if the default preset
  // becomes unresolvable (see `resolveDefaultTreatmentSelection`).
  const dateSelectionState = useMemo(
    () =>
      parseDateSelectionFromQuery(router.query) ??
      resolveDefaultTreatmentSelection() ?? {
        currentSelection: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_SEVEN_DAYS,
        customEndDate: undefined,
        customStartDate: undefined,
      },
    [router.query],
  );
  const { currentSelection, customEndDate, customStartDate } = dateSelectionState;

  // Mirror the URL-derived selection into the store so every downstream
  // reader (drawer fetches, retries, reporting-view changes, Zustand
  // subscribers) stays in lockstep with the URL — including back/forward
  // navigation, which re-runs the `router.query` memo above.
  useEffect(() => {
    commitDateSelection(currentSelection, customStartDate, customEndDate, false);
  }, [commitDateSelection, currentSelection, customEndDate, customStartDate]);

  // Match the trigger label to the URL's bounds *shape* (inclusive day count),
  // not the URL's `rangeType` string — the writer computes them from bounds
  // too, so both paths stay in lockstep and stale bookmarks label correctly.
  const currentPreset = useMemo(
    () =>
      customStartDate && customEndDate
        ? (derivePresetFromBounds(customStartDate, customEndDate) ?? DateRangePreset.Custom)
        : DateRangePreset.Custom,
    [customEndDate, customStartDate],
  );

  const presetLabels = useMemo<PopoverDateRangeControlProps['presetLabels']>(
    () =>
      Object.fromEntries(
        DATE_RANGE_PRESETS.map((preset) => {
          // Fall back to the raw preset name when a new preset is added to
          // the menu without a matching `PRESET_LABEL_KEYS` entry — better
          // to surface an ugly label than to crash / render "undefined".
          const key = PRESET_LABEL_KEYS[preset];
          return [preset, key !== undefined ? translateReport(key) : preset] as const;
        }),
      ),
    [translateReport],
  );

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

  const customLabel = useMemo(() => translateReport('Label.Custom'), [translateReport]);

  const { maxEndDate, minStartDate, now } = useMemo(() => {
    const currentTime = new Date();
    const maxEndTime = currentTime.getTime() + MAX_END_DATE_OFFSET_MS;
    return {
      maxEndDate: toUtcCalendarDate(new Date(maxEndTime)),
      minStartDate: toUtcCalendarDate(new Date(maxEndTime - MAX_RANGE_MS)),
      now: toUtcCalendarDate(currentTime),
    };
  }, []);

  const displayStartDate = parseCustomDate(customStartDate) ?? now;
  const displayEndDate = parseCustomDate(customEndDate) ?? now;

  // Idempotent write + refetch. Clicking the currently-active selection is
  // a no-op so we don't re-issue an identical HTTP request.
  const dispatchSelection = (nextStart: string, nextEnd: string, loggedOption: string) => {
    if (customStartDate === nextStart && customEndDate === nextEnd) {
      return;
    }
    writeDateSelectionToUrl(router, nextStart, nextEnd);
    refetchForDateSelection(
      DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM,
      nextStart,
      nextEnd,
    );
    logNativeClickEvent(EventName.DateFilteringOptionClicked, {
      dateFilteringOption: loggedOption,
    });
  };

  // `Custom` arrives via `onCustomDateRangeChangeConfirmed` (with bounds),
  // not here — so ignore it defensively.
  const handleChange = (next: DateRangePreset) => {
    if (isDisabled || next === DateRangePreset.Custom) {
      return;
    }
    const resolved = resolveLastNDaysInReportingTz(next);
    if (!resolved) {
      CaptureException(`unsupported preset for menu: ${next}`);
      return;
    }
    dispatchSelection(resolved.customStartDate, resolved.customEndDate, next);
  };

  const handleCustomConfirmed = (startDate: Date, endDate: Date) => {
    if (isDisabled) {
      return;
    }
    dispatchSelection(
      formatCustomDate(startDate),
      formatCustomDate(endDate),
      ConvertDateFilteringEnumToString(DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM),
    );
  };

  return (
    <FormControl className={syncedDateRangePickerContainer} error={fetchIsError} variant='outlined'>
      {/* TODO(ADS-11144 follow-up): `PopoverDateRangeControl` does not
          expose an `isDisabled` prop yet. Once it does, drop this wrapper
          and pass `isDisabled` through directly. */}
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
          presetOptions={DATE_RANGE_PRESETS}
          startDate={displayStartDate}
          testId={testId}
        />
      </div>
      {fetchIsError && (
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
              refetchForDateSelection(
                dateSelectionState.currentSelection,
                customStartDate,
                customEndDate,
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

export default SyncedDateRangePicker;
