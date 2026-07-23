import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import {
  RAQIV2Dimension,
  RAQIV2UIPseudoDimension,
  type TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import { Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import { FoundationLikeMultiSelect } from '@modules/charts-generic/components/FoundationLikeMultiSelect/FoundationLikeMultiSelect';
import {
  Menu,
  MenuItem,
  MenuSection,
} from '@modules/charts-generic/components/FoundationLikeMultiSelect/FoundationLikeMultiSelectMenu';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';

/**
 * Hard cap on the number of breakdown dimensions a single explore-mode
 * surface can hold. Three is the row-density / legend-density ceiling the
 * design owners signed off on for tables, and we apply the same cap to
 * non-table chart types so the multi-select control behaves uniformly
 * regardless of the active chart. Exported so callers that need to
 * reason about the cap independently of this component (e.g. the page
 * container computing whether to show an "Add breakdown" affordance
 * elsewhere) reuse the same value.
 */
export const MAX_BREAKDOWNS = 3;

/**
 * Synthetic menu-item value used to represent the Timestamp column toggle
 * inside the dropdown. It lives alongside real `TRAQIV2Dimension`
 * values in the underlying multi-select's `value` array, and is filtered
 * out of any callback into `onBreakdownChange` — the timestamp side is
 * delivered through `onToggleTimestamp` instead so the page can drive
 * granularity rather than the breakdown list.
 *
 * The leading/trailing `$__` markers exist purely to keep this sentinel
 * from ever colliding with a real `TRAQIV2Dimension` string value.
 */
const TIMESTAMP_KEY = '$__TIMESTAMP__$';
const isSupportedDimension = (value: string): value is TRAQIV2Dimension =>
  isValidEnumValue(RAQIV2Dimension, value) || isValidEnumValue(RAQIV2UIPseudoDimension, value);

type ChartConfiguratorBreakdownControlProps = {
  label: FormattedText;
  placeholder: FormattedText;
  breakdown: readonly TRAQIV2Dimension[];
  breakdownDimensions: readonly TRAQIV2Dimension[];
  onBreakdownChange: (nextBreakdown: TRAQIV2Dimension[]) => void;
  getBreakdownLabel: (dimension: TRAQIV2Dimension) => FormattedText;
  /**
   * Upper bound on simultaneously-selected breakdowns. Defaults to
   * {@link MAX_BREAKDOWNS}. When set to `1`, the control behaves like a
   * radio: clicking an unselected dimension *replaces* the current one.
   * For `>1` it behaves like a checkbox group, disabling further
   * selections once the cap is hit.
   */
  maxBreakdowns?: number;
  disabled?: boolean;
  disabledTooltip?: FormattedText;
  /**
   * When true, the dropdown menu includes a "Timestamp" item. Selecting
   * or deselecting it does NOT change `breakdown`; instead it invokes
   * {@link onToggleTimestamp} so the caller can drive the underlying
   * granularity (the table view renders Timestamp as an implicit first
   * column whenever granularity is non-cumulative).
   */
  showTimestampOption?: boolean;
  isTimestampSelected?: boolean;
  timestampLabel?: FormattedText;
  onToggleTimestamp?: () => void;
  /**
   * Disables the Timestamp menu item without removing it. Used when the
   * caller can't honor a toggle in the current direction — e.g. when
   * cumulative isn't an allowed granularity for the metric so the user
   * can't deselect Timestamp, or when no non-cumulative granularity is
   * available so the user can't select it.
   */
  isTimestampToggleDisabled?: boolean;
};

const ChartConfiguratorBreakdownControl: FC<ChartConfiguratorBreakdownControlProps> = ({
  label,
  placeholder,
  breakdown,
  breakdownDimensions,
  onBreakdownChange,
  getBreakdownLabel,
  maxBreakdowns = MAX_BREAKDOWNS,
  disabled = false,
  disabledTooltip,
  showTimestampOption = false,
  isTimestampSelected = false,
  timestampLabel,
  onToggleTimestamp,
  isTimestampToggleDisabled = false,
}) => {
  // Build the controlled value list the underlying multi-select sees.
  // Timestamp lives at the head so the comma-joined trigger summary
  // matches the implicit table column order (Timestamp is always the
  // leftmost column when present).
  const selectedValues = useMemo<string[]>(() => {
    const next: string[] = [];
    if (showTimestampOption && isTimestampSelected) {
      next.push(TIMESTAMP_KEY);
    }
    next.push(...breakdown);
    return next;
  }, [breakdown, isTimestampSelected, showTimestampOption]);

  const handleValueChange = useCallback(
    (nextValues: string[]) => {
      const oldHasTimestamp = showTimestampOption && isTimestampSelected;
      const newHasTimestamp = showTimestampOption && nextValues.includes(TIMESTAMP_KEY);

      const oldDims = breakdown;

      // Resolve each non-Timestamp entry back to its typed dimension via
      // the generated-config `isSupportedDimension` type
      // guard, then filter against the known `breakdownDimensions` set.
      // This preserves the `TRAQIV2Dimension` type without an
      // unsafe `as` cast and naturally drops any sentinel / foreign
      // values the underlying multi-select might surface.
      let nextDims: TRAQIV2Dimension[] = [];
      for (const v of nextValues) {
        if (v === TIMESTAMP_KEY || !isSupportedDimension(v)) {
          continue;
        }
        if (breakdownDimensions.includes(v)) {
          nextDims.push(v);
        }
      }

      if (maxBreakdowns === 1 && nextDims.length > 1) {
        // Radio swap: when the user picks a second dimension while one is
        // already selected, keep only the newly added one. Falling back to
        // the last entry covers the (shouldn't-happen) case where the diff
        // contains no genuinely-new value.
        const added = nextDims.find((d) => !oldDims.includes(d));
        nextDims = added ? [added] : [nextDims[nextDims.length - 1]];
      } else if (nextDims.length > maxBreakdowns) {
        // Defensive clamp. The render path disables menu items once the
        // cap is hit (see `isDimensionDisabled` below), so users shouldn't
        // be able to exceed `maxBreakdowns` through the UI; this guards
        // against e.g. keyboard-driven edge cases.
        nextDims = nextDims.slice(0, maxBreakdowns);
      }

      if (newHasTimestamp !== oldHasTimestamp && onToggleTimestamp) {
        onToggleTimestamp();
      }

      const dimsChanged =
        nextDims.length !== oldDims.length || nextDims.some((d, i) => d !== oldDims[i]);
      if (dimsChanged) {
        onBreakdownChange(nextDims);
      }
    },
    [
      breakdown,
      breakdownDimensions,
      isTimestampSelected,
      maxBreakdowns,
      onBreakdownChange,
      onToggleTimestamp,
      showTimestampOption,
    ],
  );

  const formatValue = useCallback(
    (values: string[]): string => {
      if (values.length === 0) {
        return '';
      }
      // Same lookup trick as `handleValueChange`: narrow each string via
      // `isSupportedDimension` so `getBreakdownLabel` receives a
      // genuinely-typed `TRAQIV2Dimension` rather than a `string`
      // cast. Unknown values are skipped entirely so a stale sentinel
      // can't make its way into the trigger summary.
      const parts: string[] = [];
      for (const v of values) {
        if (v === TIMESTAMP_KEY) {
          parts.push(String(timestampLabel ?? ''));
          continue;
        }
        if (isSupportedDimension(v)) {
          parts.push(String(getBreakdownLabel(v)));
        }
      }
      return parts.filter((s) => s.length > 0).join(', ');
    },
    [getBreakdownLabel, timestampLabel],
  );

  if (breakdownDimensions.length < 1 && !showTimestampOption) {
    return null;
  }

  // Dimension-level disable only applies in true multi-select mode. For
  // `maxBreakdowns === 1` we WANT the user to be able to click another
  // dimension to swap; disabling unselected items there would lock the
  // user into their initial choice.
  const isAtCap = breakdown.length >= maxBreakdowns;
  const isDimensionDisabled = (d: TRAQIV2Dimension): boolean =>
    maxBreakdowns > 1 && isAtCap && !breakdown.includes(d);

  // The menu items are flattened into a single keyed array before being
  // handed to `MenuSection`. Mixing a conditional `<MenuItem />` with a
  // bare `.map(...)` as separate children would surface React's
  // "each child in a list should have a unique key" warning even when
  // every leaf already has a `key` — the unkeyed array returned by the
  // `.map(...)` becomes its own unkeyed sibling. Flattening at the call
  // site keeps every child a top-level keyed element.
  const menuItems = breakdownDimensions.map((d) => (
    <MenuItem
      key={d}
      value={d}
      title={String(getBreakdownLabel(d))}
      disabled={isDimensionDisabled(d)}
    />
  ));
  if (showTimestampOption) {
    menuItems.unshift(
      <MenuItem
        key={TIMESTAMP_KEY}
        value={TIMESTAMP_KEY}
        title={String(timestampLabel ?? '')}
        disabled={isTimestampToggleDisabled}
      />,
    );
  }

  const dropdown = (
    <FoundationLikeMultiSelect
      label={String(label)}
      size='Medium'
      placeholder={String(placeholder)}
      value={selectedValues}
      onValueChange={handleValueChange}
      isDisabled={disabled}
      formatValue={formatValue}>
      <Menu>
        <MenuSection>{menuItems}</MenuSection>
      </Menu>
    </FoundationLikeMultiSelect>
  );

  if (disabled && disabledTooltip) {
    return (
      <Tooltip title={String(disabledTooltip)} position='top-center'>
        <TooltipTrigger asChild>
          <span>{dropdown}</span>
        </TooltipTrigger>
      </Tooltip>
    );
  }

  return dropdown;
};

export default ChartConfiguratorBreakdownControl;
