import { FormattedText } from '@modules/analytics-translations';
import {
  usePendingDialogState,
  useFilterDrawerEventEmitterContext,
  FilterDrawerGroup,
} from '@modules/charts-generic';
import React, { Fragment, useMemo } from 'react';
import SingleValueInCategoryChoice from './SingleValueInCategoryChoice';

export interface EnumGroup<T extends string> {
  groupName: T;
  enumOptions: T[];
}

export type SearchFilterGroupProps<T extends string> = {
  enumGroups: EnumGroup<T>[];
  value: T;
  setValue: (newValue: T[]) => void;
  formatOption: (option: T) => FormattedText;
};
/**
 * SearchFilterGroups displays a group of filters (avatar or development items)
 */
const SearchFilterGroups = function SearchFilterGroups<T extends string>({
  enumGroups,
  setValue,
  formatOption,
  value,
}: SearchFilterGroupProps<T>): React.JSX.Element {
  const emitter = useFilterDrawerEventEmitterContext();
  const [current, setCurrent] = usePendingDialogState([value], emitter, setValue);
  const optionEls = useMemo(() => {
    if (enumGroups.length === 1) {
      return enumGroups.flatMap((group) =>
        group.enumOptions.map((option) => {
          return (
            <SingleValueInCategoryChoice
              key={option}
              {...{
                option,
                current,
                onChange: setCurrent,
                formatOption,
              }}
            />
          );
        }),
      );
    }
    return enumGroups.map((group) => {
      return (
        <FilterDrawerGroup
          name={formatOption(group.groupName) as FormattedText}
          key={group.groupName}
          isInitiallyCollapsed={!group.enumOptions.includes(value)}>
          {group.enumOptions.map((option) => {
            return (
              <SingleValueInCategoryChoice
                key={option}
                {...{
                  option,
                  current,
                  onChange: setCurrent,
                  formatOption,
                }}
              />
            );
          })}
        </FilterDrawerGroup>
      );
    });
  }, [current, enumGroups, setCurrent, formatOption, value]);

  return <Fragment>{optionEls}</Fragment>;
};

export default SearchFilterGroups;
