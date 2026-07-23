import React, { useMemo } from 'react';
import { Grid } from '@rbx/ui';
import { FilterChip } from '@modules/charts-generic';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  PlayerFeedbackFilterDimension,
  PlayerFeedbackFilterState,
  PLAYER_FEEDBACK_FILTER_CONFIGS,
} from './types/PlayerFeedbackFilters';

interface PlayerFeedbackFilterChipsProps {
  filterState: PlayerFeedbackFilterState;
  onFilterChange: (
    dimension: PlayerFeedbackFilterDimension,
    values: string[] | boolean | null,
  ) => void;
}

const PlayerFeedbackFilterChips: React.FC<PlayerFeedbackFilterChipsProps> = ({
  filterState,
  onFilterChange,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();

  const chips = useMemo(() => {
    const result: React.ReactNode[] = [];

    Object.entries(filterState).forEach(([dimension, values]) => {
      const filterConfig = PLAYER_FEEDBACK_FILTER_CONFIGS.find(
        (config) => config.dimension === dimension,
      );

      if (!filterConfig) return;

      if (Array.isArray(values) && values.length > 0) {
        const optionsLabel = values
          .map((value) => {
            const option = filterConfig.options.find((opt) => opt.value === value);
            return option?.label || value;
          })
          .join(', ');

        result.push(
          <Grid item key={dimension}>
            <FilterChip
              label={`${translate(translationKey(filterConfig.label, TranslationNamespace.Analytics))}: ${optionsLabel}`}
              onDelete={() => onFilterChange(dimension as PlayerFeedbackFilterDimension, [])}
            />
          </Grid>,
        );
      }
    });

    return result;
  }, [filterState, onFilterChange, translate]);

  if (chips.length === 0) {
    return null;
  }

  return (
    <Grid container direction='row' alignItems='center' spacing={1} sx={{ mb: 2 }}>
      {chips}
    </Grid>
  );
};

export default PlayerFeedbackFilterChips;
