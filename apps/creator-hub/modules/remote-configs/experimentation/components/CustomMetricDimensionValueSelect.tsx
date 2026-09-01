import type { FC } from 'react';
import { RAQIV2DateRangeType, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { RAQIV2Dimension, TRAQIV2APIMetric } from '@rbx/creator-hub-analytics-config';
import { Dropdown, Menu, MenuItem } from '@rbx/foundation-ui';
import { FoundationLikeMultiSelect } from '@modules/charts-generic/components/FoundationLikeMultiSelect/FoundationLikeMultiSelect';
import {
  Menu as MultiSelectMenu,
  MenuItem as MultiSelectMenuItem,
} from '@modules/charts-generic/components/FoundationLikeMultiSelect/FoundationLikeMultiSelectMenu';
import type { RAQIV2APIQueryFilter, RAQIV2ChartResource } from '@modules/clients/analytics';
import useRAQIV2DimensionChoiceRenderBundle from '@modules/experience-analytics-shared/hooks/useRAQIV2DimensionChoiceRenderBundle';
import type TDateRangeSelection from '@modules/experience-analytics-shared/types/DateRangeSelection';
import { DateRangeSelectionType } from '@modules/experience-analytics-shared/types/DateRangeSelection';

// Fixed window for the dimension-value lookup. The value list only needs to be
// broad enough to surface the experience's events/currencies/funnels the
// creator can pick from, so we use a wide, stable range instead of wiring this
// drawer to a date-range picker (matching the 90-day default the economy /
// funnel analytics pages use for their breakdowns).
const VALUE_LOOKUP_DATE_RANGE: TDateRangeSelection = {
  type: DateRangeSelectionType.Preset,
  rangeType: RAQIV2DateRangeType.Last90Days,
  granularity: RAQIV2MetricGranularity.None,
};

export type CustomMetricDimensionValueSelectProps = {
  resource: RAQIV2ChartResource;
  dimension: RAQIV2Dimension;
  contextMetrics: TRAQIV2APIMetric[];
  // Optional scoping filters forwarded to the gateway so a dependent dimension's
  // values (and display names) are narrowed by another selection — e.g. funnel
  // step values scoped to the chosen funnel.
  scopingFilter?: readonly RAQIV2APIQueryFilter[];
  // Multi-select (filter values) vs. single-select (the primary "Event type").
  multiple: boolean;
  value: string[];
  onChange: (next: string[]) => void;
  onBlur?: () => void;
  placeholder: string;
  isDisabled?: boolean;
  hasError?: boolean;
  hint?: string;
};

/**
 * Dimension-value dropdown backed by the analytics query gateway — the same
 * source the analytics filter drawer uses. Fetches the available values for
 * `dimension` (scoped by `contextMetrics`) via
 * {@link useRAQIV2DimensionChoiceRenderBundle} and renders them as a multi- or
 * single-select. Callers must ensure a real `dimension` is passed (guard the
 * "no dimension chosen yet" state upstream) so the value-fetch hook runs
 * unconditionally, per the Rules of Hooks.
 */
const CustomMetricDimensionValueSelect: FC<CustomMetricDimensionValueSelectProps> = ({
  resource,
  dimension,
  contextMetrics,
  scopingFilter,
  multiple,
  value,
  onChange,
  onBlur,
  placeholder,
  isDisabled = false,
  hasError = false,
  hint,
}) => {
  const { enumOptions, isDataLoading, formatOption } = useRAQIV2DimensionChoiceRenderBundle(
    resource,
    dimension,
    contextMetrics,
    VALUE_LOOKUP_DATE_RANGE,
    { onlyFilterSupportedValues: true, filter: scopingFilter },
  );

  const isChoiceDisabled = isDisabled || isDataLoading || enumOptions.length === 0;

  if (multiple) {
    const formatValue = (selected: string[]) =>
      selected.length === 0 ? '' : selected.map((option) => formatOption(option)).join(', ');

    return (
      <FoundationLikeMultiSelect
        size='Medium'
        placeholder={placeholder}
        value={value}
        onValueChange={onChange}
        onOpenChange={(open) => {
          if (!open) {
            onBlur?.();
          }
        }}
        isDisabled={isChoiceDisabled}
        hasError={hasError}
        hint={hint}
        formatValue={formatValue}>
        <MultiSelectMenu>
          {enumOptions.map((option) => (
            <MultiSelectMenuItem key={option} value={option} title={formatOption(option)} />
          ))}
        </MultiSelectMenu>
      </FoundationLikeMultiSelect>
    );
  }

  const singleValue = value[0];
  const dropdownValue = singleValue && enumOptions.includes(singleValue) ? singleValue : undefined;

  return (
    <Dropdown
      size='Medium'
      placeholder={placeholder}
      value={dropdownValue}
      isDisabled={isChoiceDisabled}
      hasError={hasError}
      hint={hint}
      onOpenChange={(open) => {
        if (!open) {
          onBlur?.();
        }
      }}
      onValueChange={(next) => {
        onChange([next]);
        onBlur?.();
      }}>
      <Menu>
        {enumOptions.map((option) => (
          <MenuItem key={option} value={option} title={String(formatOption(option))} />
        ))}
      </Menu>
    </Dropdown>
  );
};

export default CustomMetricDimensionValueSelect;
