import type { FC, ReactNode } from 'react';
import React, { useCallback, useMemo } from 'react';
import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import {
  DateRangeControl as SharedDateRangeControl,
  DateRangePreset,
  isDateRangePreset,
} from '@rbx/date-range-picker';
import { useFlag } from '@rbx/flags';
import type { Select } from '@rbx/ui';
import { isComparisonRangePolicyEnabled as isComparisonRangePolicyEnabledFlag } from '@generated/flags/creatorAnalytics';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import dateRangeStrings from '@modules/charts-generic/constants/dateRangeStrings';
import useLocale from '@modules/charts-generic/context/useLocale';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import useRAQIV2TranslationDependencies from '../hooks/useRAQIV2TranslationDependencies';

/**
 * `RAQIV2DateRangeType` (from `@rbx/creator-hub-analytics-config`) is a
 * string enum whose values happen to exactly match `DateRangePreset` for the
 * subset creator-hub uses. This adapter maps between the two so the shared
 * package can stay decoupled from creator-hub's analytics config, while
 * existing callers of `DateRangeControl` keep the same API.
 */
const toSharedPreset = (value: RAQIV2DateRangeType): DateRangePreset | null => {
  return isDateRangePreset(value) ? value : null;
};

const toAnalyticsRangeType = (value: DateRangePreset): RAQIV2DateRangeType | null => {
  return isValidEnumValue(RAQIV2DateRangeType, value) ? value : null;
};

// Diagnostic dedupe for enum-drift warnings across all component instances.
// Module scope keeps this out of render (react-compiler rejects `ref.current`
// reads during render), and per-value dedupe prevents log spam.
const warnedDriftKeys = new Set<string>();
const warnDriftOnce = (key: string, message: string): void => {
  if (warnedDriftKeys.has(key)) {
    return;
  }
  warnedDriftKeys.add(key);
  console.warn(message);
};

type DateRangeControlProps = {
  dateRangeType: RAQIV2DateRangeType;
  startDate: Date;
  endDate: Date;
  minStartDate: Date;
  maxEndDate: Date;
  maxRangeDays?: number;
  onChangeRangeType: (newRangeType: RAQIV2DateRangeType) => void;
  onCustomDateRangeChangeConfirmed: (startDate: Date, endDate: Date) => void;
  dateRangeOptions?: Readonly<RAQIV2DateRangeType[]>;
  selectClassName?: string;
  size?: React.ComponentProps<typeof Select>['size'];
  fullWidth?: React.ComponentProps<typeof Select>['fullWidth'];
};

const DateRangeControl: FC<DateRangeControlProps> = ({
  dateRangeType,
  onChangeRangeType,
  dateRangeOptions,
  ...rest
}) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const locale = useLocale();
  const { value: isComparisonRangePolicyEnabled } = useFlag(isComparisonRangePolicyEnabledFlag);

  const presetLabels = useMemo(() => {
    const labels: Partial<Record<DateRangePreset, ReactNode>> & {
      [DateRangePreset.Custom]: ReactNode;
    } = {
      [DateRangePreset.Custom]: translate(dateRangeStrings[RAQIV2DateRangeType.Custom]),
    };
    for (const key of Object.values(RAQIV2DateRangeType)) {
      const preset = toSharedPreset(key);
      if (preset !== null) {
        labels[preset] = translate(dateRangeStrings[key]);
      }
    }
    return labels;
  }, [translate]);

  const sharedDateRangeOptions = useMemo(
    () =>
      dateRangeOptions
        ?.filter(
          (range) =>
            isComparisonRangePolicyEnabled !== true || range !== RAQIV2DateRangeType.Last365Days,
        )
        ?.map(toSharedPreset)
        .filter((preset): preset is DateRangePreset => preset !== null),
    [dateRangeOptions, isComparisonRangePolicyEnabled],
  );

  const mappedDateRangeType = toSharedPreset(dateRangeType);
  if (mappedDateRangeType === null) {
    warnDriftOnce(
      dateRangeType,
      `[DateRangeControl] RAQIV2DateRangeType '${dateRangeType}' has no matching DateRangePreset. ` +
        `Falling back to Custom. Add it to DateRangePreset in @rbx/date-range-picker or exclude it from callers.`,
    );
  }
  const sharedDateRangeType = mappedDateRangeType ?? DateRangePreset.Custom;

  const labels = useMemo(
    () => ({
      dateRangeLabel: translate(translationKey('Label.DateRange', TranslationNamespace.Analytics)),
      okLabel: translate(translationKey('Label.Ok', TranslationNamespace.Analytics)),
      startDateLabel: translate(translationKey('Label.StartDate', TranslationNamespace.Analytics)),
      endDateLabel: translate(translationKey('Label.EndDate', TranslationNamespace.Analytics)),
    }),
    [translate],
  );

  const handleChangeRangeType = useCallback(
    (next: DateRangePreset) => {
      const mapped = toAnalyticsRangeType(next);
      if (mapped === null) {
        // Unreachable while creator-hub callers only pass RAQIV2DateRangeType-compatible
        // presets in `dateRangeOptions`; warn if that assumption ever drifts.
        warnDriftOnce(next, `[DateRangeControl] Unmapped DateRangePreset: ${next}`);
        return;
      }
      onChangeRangeType(mapped);
    },
    [onChangeRangeType],
  );

  return (
    <SharedDateRangeControl
      {...rest}
      dateRangeType={sharedDateRangeType}
      onChangeRangeType={handleChangeRangeType}
      dateRangeOptions={sharedDateRangeOptions}
      presetLabels={presetLabels}
      labels={labels}
      locale={locale}
    />
  );
};

export default DateRangeControl;
