import React, { useCallback } from 'react';

import { Select, MenuItem } from '@rbx/ui';
import useAnalyticsPageControlBarStyles from './ExperienceAnalyticsPageControlBar.styles';
import { UIFilters, getCurrentDimensionSingleValue, updateFilterSingleValue } from './filterUtils';
import { SingleChoiceConfig } from './ExperienceAnalyticsPageFilterBarConfig';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';

// NOTE(gperkins@20230323): Copied from @modules/creations/socialLinks/components/FormItem.tsx
//  (presumably copied in turn from https://stackoverflow.com/a/52551100)
const showMenuBelowSelector: Partial<React.ComponentProps<typeof Select>['SelectProps']> = {
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

type FilterBarSingleSelectorProps<T> = Exclude<SingleChoiceConfig<T>, 'type'> & {
  filters: UIFilters;
  onFiltersChange: (filters: UIFilters) => void;
};

// NOTE(gperkins@20230323): requires strings for MenuItem values and UIFilters interactions
const FilterBarSingleSelector = <T extends string>({
  dimension,
  dimensionNameKey,
  options,
  blankOption,
  filters,
  renderOption,
  onFiltersChange,
}: FilterBarSingleSelectorProps<T>) => {
  const {
    classes: { filterBarFilterControl },
  } = useAnalyticsPageControlBarStyles();
  const { translate } = useRAQIV2TranslationDependencies();
  const current = getCurrentDimensionSingleValue(filters, dimension, blankOption);
  const items = options.map((opt) => {
    return (
      <MenuItem value={opt} key={opt}>
        {renderOption(opt)}
      </MenuItem>
    );
  });
  const onChange = useCallback(
    (event: React.ChangeEvent<{ value: string }>) => {
      const given = event.target.value;
      const value = given === blankOption ? null : given;
      const newFilters = updateFilterSingleValue(filters, dimension, value);
      onFiltersChange(newFilters);
    },
    [blankOption, dimension, filters, onFiltersChange],
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
      SelectProps={{ ...showMenuBelowSelector }}
      onChange={onChange}>
      {items}
    </Select>
  );
};

export default FilterBarSingleSelector;
