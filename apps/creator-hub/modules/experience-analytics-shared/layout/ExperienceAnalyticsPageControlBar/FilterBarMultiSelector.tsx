import React, { useCallback } from 'react';

import { Select, MenuItem, Checkbox } from '@rbx/ui';
import useAnalyticsPageControlBarStyles from './ExperienceAnalyticsPageControlBar.styles';
import {
  UIFilters,
  updateFilterValues,
  getCurrentDimensionValues,
  getNewFilterValues,
} from './filterUtils';
import { MultipleChoiceConfig } from './ExperienceAnalyticsPageFilterBarConfig';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';

// NOTE(gperkins@20230323): Copied from @modules/creations/socialLinks/components/FormItem.tsx
//  (presumably copied in turn from https://stackoverflow.com/a/52551100)
export const showMenuBelowSelector: Partial<React.ComponentProps<typeof Select>['SelectProps']> = {
  MenuProps: {
    anchorOrigin: {
      vertical: 'bottom',
      horizontal: 'center',
    },
    transformOrigin: {
      vertical: 'top',
      horizontal: 'center',
    },
  },
};

type FilterBarMultiSelectorProps<T> = Exclude<MultipleChoiceConfig<T>, 'type'> & {
  filters: UIFilters;
  onFiltersChange: (filters: UIFilters) => void;
};

const FilterBarMultiSelector = <T extends string>({
  dimension,
  dimensionNameKey,
  options,
  blankOption,
  filters,
  renderOption,
  defaultOptions,
  onFiltersChange,
}: FilterBarMultiSelectorProps<T>) => {
  const {
    classes: { filterBarFilterControl },
  } = useAnalyticsPageControlBarStyles();
  const { translate } = useRAQIV2TranslationDependencies();
  const current = getCurrentDimensionValues(filters, dimension, defaultOptions ?? [blankOption]);
  const items = options.map((opt) => {
    return (
      <MenuItem value={opt} key={opt}>
        <Checkbox checked={current.includes(opt)} />
        {renderOption(opt)}
      </MenuItem>
    );
  });
  const onChange = useCallback(
    (event: React.ChangeEvent<{ value: unknown }>) => {
      const given = event.target.value as string[];
      const newValues = getNewFilterValues(current, given, blankOption, defaultOptions);
      const newFilters = updateFilterValues(filters, dimension, newValues);
      onFiltersChange(newFilters);
    },
    [current, blankOption, dimension, filters, onFiltersChange, defaultOptions],
  );
  const dimensionName = translate(dimensionNameKey);
  return (
    <Select
      label={dimensionName}
      value={current}
      size='small'
      classes={{
        root: filterBarFilterControl,
      }}
      SelectProps={{
        ...showMenuBelowSelector,
        multiple: true,
        renderValue: () => current.map((opt) => renderOption(opt)).join(', '),
      }}
      onChange={onChange}>
      {items}
    </Select>
  );
};

export default FilterBarMultiSelector;
