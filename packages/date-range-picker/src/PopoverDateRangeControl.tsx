import type { FC, ReactNode } from 'react';
import React, { useCallback, useEffect, useMemo } from 'react';
import { DateTimePicker } from '@rbx/foundation-ui';
import type {
  TDateRangePresetOption,
  TDateTimePickerLabelsDualActions,
  TSupportedLocale,
} from '@rbx/foundation-ui';
import type { TDatePresetOption } from './DatePresetPopoverControl';
import DatePresetPopoverControl from './DatePresetPopoverControl';
import { DateRangePreset } from './DateRangePreset';
import { formatDateRange } from './formatDateRange';
import { isRangeWithinBounds } from './presets';

export type PopoverDateRangeControlProps = {
  /** Label rendered above the trigger and used as its accessible name. */
  label: string;
  /** Currently selected preset (or {@link DateRangePreset.Custom}). */
  dateRangeType: DateRangePreset;
  /**
   * Preset rows to show in the popover. Do not include
   * {@link DateRangePreset.Custom}; use {@link customLabel} to append it.
   */
  presetOptions: readonly DateRangePreset[];
  /** Fires when the user picks a preset row from the popover. */
  onChangeRangeType: (preset: DateRangePreset) => void;

  /** Current custom range. Also used to format the trigger label when Custom is selected. */
  startDate: Date;
  endDate: Date;
  /** Bounds for the custom-range picker. */
  minStartDate: Date;
  maxEndDate: Date;

  /**
   * When provided, a Custom row is appended after the presets that swaps the
   * popover to a full-calendar view. Omit to hide the Custom row entirely.
   */
  customLabel?: string;
  /** Fires when the user confirms a custom range via the picker's Apply action. */
  onCustomDateRangeChangeConfirmed?: (startDate: Date, endDate: Date) => void;
  /** Optional preset shortcuts rendered inside the Foundation `DateTimePicker`. */
  pickerPresets?: TDateRangePresetOption[];

  /**
   * Localized labels for each preset in {@link presetOptions}. Missing entries
   * log an error and cause the preset to be omitted from the popover (and the
   * trigger label to fall back to an empty string when that preset is active).
   */
  presetLabels: Partial<Record<DateRangePreset, ReactNode>>;
  /** Localized labels for the Foundation `DateTimePicker`. */
  pickerLabels: TDateTimePickerLabelsDualActions;

  /** Locale for the formatted trigger label + Foundation picker. */
  locale?: TSupportedLocale;
  /** Extra classes applied to the popover's outer wrapper. */
  className?: string;
  /**
   * Base `data-testid` forwarded to the underlying popover shell. Override
   * when rendering multiple popover controls on the same page.
   */
  testId?: string;
};

const resolveLabelText = (label: ReactNode): string => (typeof label === 'string' ? label : '');

const PopoverDateRangeControl: FC<PopoverDateRangeControlProps> = ({
  label,
  dateRangeType,
  presetOptions,
  onChangeRangeType,
  startDate,
  endDate,
  minStartDate,
  maxEndDate,
  customLabel,
  onCustomDateRangeChangeConfirmed,
  pickerPresets,
  presetLabels,
  pickerLabels,
  locale,
  className,
  testId,
}) => {
  useEffect(() => {
    if (customLabel !== undefined && onCustomDateRangeChangeConfirmed === undefined) {
      // oxlint-disable-next-line no-console -- surface misconfiguration for callers
      console.error(
        `[PopoverDateRangeControl] 'customLabel' is set but 'onCustomDateRangeChangeConfirmed' ` +
          `is missing. The Custom row will render, but clicking Apply in the picker will silently ` +
          `do nothing. Provide 'onCustomDateRangeChangeConfirmed' or omit 'customLabel'.`,
      );
    }
  }, [customLabel, onCustomDateRangeChangeConfirmed]);
  const filteredPresets = useMemo(
    () =>
      presetOptions.filter(
        (preset) =>
          preset !== DateRangePreset.Custom &&
          isRangeWithinBounds(preset, minStartDate, maxEndDate),
      ),
    [presetOptions, minStartDate, maxEndDate],
  );

  const resolveLabel = useCallback(
    (preset: DateRangePreset): ReactNode | undefined => {
      const value = presetLabels[preset];
      if (value === undefined) {
        // oxlint-disable-next-line no-console -- surface missing translations for callers
        console.error(
          `[PopoverDateRangeControl] Missing presetLabels entry for '${preset}'. ` +
            `Every preset in presetOptions must have a corresponding label.`,
        );
        return undefined;
      }
      return value;
    },
    [presetLabels],
  );

  const presets = useMemo<TDatePresetOption[]>(
    () =>
      filteredPresets.flatMap((preset) => {
        const presetLabel = resolveLabel(preset);
        if (presetLabel === undefined) {
          return [];
        }
        return [
          {
            key: preset,
            label: resolveLabelText(presetLabel),
            selected: dateRangeType === preset,
            onSelect: () => onChangeRangeType(preset),
          },
        ];
      }),
    [filteredPresets, resolveLabel, dateRangeType, onChangeRangeType],
  );

  const triggerLabel = useMemo(() => {
    if (dateRangeType === DateRangePreset.Custom) {
      return formatDateRange(startDate, endDate, { locale });
    }
    return resolveLabelText(resolveLabel(dateRangeType));
  }, [dateRangeType, startDate, endDate, locale, resolveLabel]);

  const handleApply = useCallback(
    (start: Date | null, end: Date | null): boolean => {
      if (!start || !end || !onCustomDateRangeChangeConfirmed) {
        return false;
      }
      onCustomDateRangeChangeConfirmed(start, end);
      return true;
    },
    [onCustomDateRangeChangeConfirmed],
  );

  const showCustomRow = customLabel !== undefined;

  return (
    <DatePresetPopoverControl
      label={label}
      triggerLabel={triggerLabel}
      presets={presets}
      customLabel={showCustomRow ? customLabel : undefined}
      customSelected={dateRangeType === DateRangePreset.Custom}
      className={className}
      testId={testId}
      renderPicker={({ closePopover, backToPresets }) => (
        <DateTimePicker
          variant='Dual'
          labels={pickerLabels}
          locale={locale}
          defaultDates={[startDate, endDate]}
          selectableDateRange={{ startDate: minStartDate, endDate: maxEndDate }}
          presets={pickerPresets}
          onChanged={(start, end) => {
            if (handleApply(start, end)) {
              closePopover();
            }
          }}
          onCancel={backToPresets}
        />
      )}
    />
  );
};

export default PopoverDateRangeControl;
