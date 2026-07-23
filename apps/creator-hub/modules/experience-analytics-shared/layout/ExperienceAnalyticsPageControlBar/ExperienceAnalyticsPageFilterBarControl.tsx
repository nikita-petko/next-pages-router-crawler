import { DebouncedTextField } from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CircularProgress, Grid, MenuItem, Select } from '@rbx/ui';
import React, { FC, useMemo, useCallback } from 'react';
import {
  FilterBarConfig,
  MultipleChoiceConfig,
  SingleChoiceConfig,
} from './ExperienceAnalyticsPageFilterBarConfig';
import useAnalyticsPageControlBarStyles from './ExperienceAnalyticsPageControlBar.styles';
import { UIFilters, NonRAQIUIDimension } from './filterUtils';
import FilterBarSingleSelector from './FilterBarSingleSelector';
import FilterBarMultiSelector from './FilterBarMultiSelector';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';

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
      const otherFilters = filters.filter((f) => {
        return f.dimension !== NonRAQIUIDimension.Text;
      });
      onFiltersChange([...otherFilters, { dimension: NonRAQIUIDimension.Text, values: [value] }]);
    },
    [filters, onFiltersChange],
  );

  const numericFieldOnChange = useCallback(
    (value: string) => {
      const otherFilters = filters.filter((f) => {
        return f.dimension !== NonRAQIUIDimension.UserId;
      });
      onFiltersChange([...otherFilters, { dimension: NonRAQIUIDimension.UserId, values: [value] }]);
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
                value={filters.find((f) => f.dimension === dimension)?.values[0] || ''}
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
                value={filters.find((f) => f.dimension === dimension)?.values[0] || ''}
                onDebouncedChange={numericFieldOnChange}
                type='number'
              />
            </Grid>
          );
        }
        default: {
          const exhaustiveCheck: never = type;
          throw new Error(`Unhandled filter type ${exhaustiveCheck}`);
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
    <React.Fragment>
      {showIconWithText && iconWithText}
      {filterControls}
    </React.Fragment>
  );
};

export default ExperienceAnalyticsPageFilterBarControl;
