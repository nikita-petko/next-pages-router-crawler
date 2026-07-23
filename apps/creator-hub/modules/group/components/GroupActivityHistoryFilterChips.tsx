import React, { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import FilterChip from '@modules/charts-generic/components/FilterChip';
import type {
  FilterDrawerChoicesType,
  GroupActivityHistoryFilterCategories,
} from '../constants/groupConstants';
import {
  GroupActivityHistoryFilterDimensions,
  GroupActivityHistoryFilterOptionsToTranslationKey,
} from '../constants/groupConstants';

type GroupActivityHistoryFilterChipsProps = {
  filters: FilterDrawerChoicesType;
  onFilterChange: (
    key: GroupActivityHistoryFilterDimensions,
    newValue: GroupActivityHistoryFilterCategories[],
  ) => void;
  usernames: string[];
  setUsernames: (selected: string[]) => void;
};

function GroupActivityHistoryFilterChips({
  filters,
  onFilterChange,
  usernames,
  setUsernames,
}: GroupActivityHistoryFilterChipsProps) {
  const { translate } = useTranslation();

  const chips = useMemo(() => {
    const result = (
      Object.entries(filters) as [
        GroupActivityHistoryFilterDimensions,
        GroupActivityHistoryFilterCategories[],
      ][]
    ).reduce(
      (
        components: React.ReactNode[],
        [key, options]: [
          GroupActivityHistoryFilterDimensions,
          GroupActivityHistoryFilterCategories[],
        ],
      ) => {
        const keyLabel = translate(GroupActivityHistoryFilterOptionsToTranslationKey[key]);
        if (key === GroupActivityHistoryFilterDimensions.Creator && usernames.length > 0) {
          components.push(
            <Grid item key={key}>
              <FilterChip
                label={`${keyLabel}: ${usernames.join(', ')}`}
                onDelete={() => {
                  setUsernames([]);
                }}
              />
            </Grid>,
          );
        }
        if (options.length > 0) {
          const optionsLabel = options.map((option) =>
            translate(GroupActivityHistoryFilterOptionsToTranslationKey[option]),
          );
          components.push(
            <Grid item key={key}>
              <FilterChip
                label={`${keyLabel}: ${optionsLabel.join(', ')}`}
                onDelete={() => {
                  onFilterChange(key, []);
                }}
              />
            </Grid>,
          );
        }
        return components;
      },
      [],
    );
    return result;
  }, [filters, onFilterChange, setUsernames, translate, usernames]);

  return chips.length ? (
    <Grid
      container
      justifyContent='flex-start'
      direction='row'
      alignItems='center'
      paddingBottom={2}
      gap={1}>
      {chips}
    </Grid>
  ) : null;
}

export default GroupActivityHistoryFilterChips;
