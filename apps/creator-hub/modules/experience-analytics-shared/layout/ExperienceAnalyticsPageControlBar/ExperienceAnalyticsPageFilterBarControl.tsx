import type { FC } from 'react';
import React, { useMemo, useCallback } from 'react';
import { CircularProgress, Grid, MenuItem, Select } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import DebouncedTextField from '@modules/charts-generic/charts/DebouncedTextField';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import useAnalyticsPageControlBarStyles from './ExperienceAnalyticsPageControlBar.styles';
import type {
  FilterBarConfig,
  MultipleChoiceConfig,
  SingleChoiceConfig,
} from './ExperienceAnalyticsPageFilterBarConfig';
import FilterBarMultiSelector from './FilterBarMultiSelector';
import FilterBarSingleSelector from './FilterBarSingleSelector';
import type { UIFilters } from './filterUtils';
import { NonRAQIUIDimension } from './filterUtils';

export type FilterBarControlProps = {
  config: FilterBarConfig;
  filters: UIFilters;
  onFiltersChange: (filters: UIFilters) => void;
  showIconWithText?: boolean;
};
const ExperienceAnalyticsPageFilterBarControl: FC<FilterBarControlProps> = ({
  config,
  filters,
  onFiltersChange,
  showIconWithText = true,
}) => {
  const {
    classes: { filterBarShowText, filterBarFilterControl, searchTextFieldStyle, numericFieldStyle },
  } = useAnalyticsPageControlBarStyles();
  const { translate } = useRAQIV2TranslationDependencies();

  const iconWithText = useMemo(
    () => (
      <Grid item>
        <span className={filterBarShowText}>
          {translate(translationKey('Label.FilterBarShow', TranslationNamespace.Analytics))}
        </span>
      </Grid>
    ),
    [filterBarShowText, translate],
  );

  const textFieldOnChange = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      const otherFilters = filters.filter((f) => {
        return f.dimension !== NonRAQIUIDimension.Text;
      });
      onFiltersChange(
        trimmed
          ? [...otherFilters, { dimension: NonRAQIUIDimension.Text, values: [trimmed] }]
          : otherFilters,
      );
    },
    [filters, onFiltersChange],
  );

  const numericFieldOnChange = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      const otherFilters = filters.filter((f) => {
        return f.dimension !== NonRAQIUIDimension.UserId;
      });
      onFiltersChange(
        trimmed
          ? [...otherFilters, { dimension: NonRAQIUIDimension.UserId, values: [trimmed] }]
          : otherFilters,
      );
    },
    [filters, onFiltersChange],
  );

  const filterControls = useMemo(() => {
    return config.map((dimConfig) => {
      const { type, dimension, dimensionNameKey } = dimConfig;
      switch (type) {
        case 'loading': {
          const dimensionName = translate(dimensionNameKey);
          // TODO(gperkins@ 20230321): pinnacle of eng-driven design here
          //  So -- please get a designer to review before you use this :-)
          return (
            <Grid item key={dimension}>
              <Select
                key={dimension}
                label={dimensionName}
                variant='outlined'
                value='loading'
                size='small'
                classes={{
                  root: filterBarFilterControl,
                }}
                disabled>
                <MenuItem value='loading'>
                  <CircularProgress size={14} color='secondary' />
                </MenuItem>
              </Select>
            </Grid>
          );
        }
        case 'single': {
          // NOTE(gperkins@20230323): Assuming dimConfig is a SingleChoiceConfig<T extends string>
          const partialProps: SingleChoiceConfig<string> = dimConfig;
          return (
            <Grid item key={dimension}>
              <FilterBarSingleSelector
                key={dimension}
                filters={filters}
                onFiltersChange={onFiltersChange}
                {...partialProps}
              />
            </Grid>
          );
        }
        case 'multiple': {
          const partialProps: MultipleChoiceConfig<string> = dimConfig;
          return (
            <Grid item key={dimension}>
              <FilterBarMultiSelector
                key={dimension}
                filters={filters}
                onFiltersChange={onFiltersChange}
                {...partialProps}
              />
            </Grid>
          );
        }
        case 'text': {
          const dimensionName = translate(dimensionNameKey);
          return (
            <Grid item key={dimension}>
              <DebouncedTextField
                className={searchTextFieldStyle}
                id='keywordSearchFilter'
                debounceTime={300}
                label={dimensionName}
                size='small'
                value={filters.find((f) => f.dimension === dimension)?.values[0] ?? ''}
                onDebouncedChange={textFieldOnChange}
              />
            </Grid>
          );
        }
        case 'numeric-text': {
          const dimensionName = translate(dimensionNameKey);
          return (
            <Grid item key={dimension}>
              <DebouncedTextField
                className={numericFieldStyle}
                id='numericSearchFilter'
                debounceTime={300}
                label={dimensionName}
                size='small'
                value={filters.find((f) => f.dimension === dimension)?.values[0] ?? ''}
                onDebouncedChange={numericFieldOnChange}
                type='number'
              />
            </Grid>
          );
        }
        default: {
          const exhaustiveCheck: never = type;
          throw new Error(`Unhandled filter type ${String(exhaustiveCheck)}`);
        }
      }
    });
  }, [
    config,
    filterBarFilterControl,
    filters,
    numericFieldOnChange,
    numericFieldStyle,
    onFiltersChange,
    searchTextFieldStyle,
    textFieldOnChange,
    translate,
  ]);
  return (
    <>
      {showIconWithText && iconWithText}
      {filterControls}
    </>
  );
};

export default ExperienceAnalyticsPageFilterBarControl;
