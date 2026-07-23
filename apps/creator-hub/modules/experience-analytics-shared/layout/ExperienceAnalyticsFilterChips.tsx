import React, { useMemo } from 'react';
import { Grid } from '@rbx/ui';
import { FilterChip, RAQIMetricFilter } from '@modules/charts-generic';
import { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import { useAnalyticsCurrentFilterBundle } from '../context/AnalyticsCurrentFilterBundleProvider';
import {
  FilterDimensionConfigV2,
  getRAQIOrLegacyFilterConfig,
  OptionType,
  raqiSupportedFilterBarDimensions,
  TNonRAQISupportedFilterBarDimensions,
  TRAQISupportedFilterBarDimensions,
  TSupportedFilterBarDimensions,
} from '../constants/FilterDimensionConfig';
import {
  UIFilterDimension,
  updateFilterValues,
} from './ExperienceAnalyticsPageControlBar/filterUtils';
import useRAQIV2TranslationDependencies from '../hooks/useRAQIV2TranslationDependencies';
import getDimensionRenderer from '../components/getDimensionRenderer';

interface ExperienceAnalyticsFilterChipsProps {
  dimensions: readonly TSupportedFilterBarDimensions[];
  knownRAQIDimensionsShownElsewhere?: readonly TRAQIV2Dimension[];
}

function shouldHideDueToBlankFilterChip<TEnum extends string>(
  filter: RAQIMetricFilter<UIFilterDimension>,
  config: FilterDimensionConfigV2<TEnum>,
): boolean {
  if (config.optionType !== OptionType.RAQIV2StaticEnum) {
    // no hiding for non-enum filters. not expecting to ever have blankOption there.
    return false;
  }
  const { blankOption } = config;
  if (blankOption === undefined) {
    // not hidden if there is no blank option defined at all, or if we should show the blank option
    return false;
  }
  const isBlankOption = filter.values.length === 1 && filter.values[0] === blankOption;
  return isBlankOption;
}

function ExperienceAnalyticsFilterChips({
  dimensions,
  knownRAQIDimensionsShownElsewhere,
}: ExperienceAnalyticsFilterChipsProps) {
  const { raqi: supportedRAQIDimensions, nonRaqi: nonRAQIDimensions } = useMemo(() => {
    const raqi: Array<TRAQISupportedFilterBarDimensions> = [];
    const nonRaqi: Array<TNonRAQISupportedFilterBarDimensions> = [];
    dimensions.forEach((dim) => {
      if (isValidArrayEnumValue(raqiSupportedFilterBarDimensions, dim)) {
        raqi.push(dim);
      } else {
        nonRaqi.push(dim);
      }
    });
    return { raqi, nonRaqi };
  }, [dimensions]);

  const { onFiltersChange, raqiFilters, filters, onUnsupportedDimensionFilterDelete } =
    // eslint-disable-next-line deprecation/deprecation -- need to support both types of dimensions in the filter chip bar
    useAnalyticsCurrentFilterBundle(nonRAQIDimensions, supportedRAQIDimensions);
  const { translate } = useRAQIV2TranslationDependencies();
  const translationDependencies = useRAQIV2TranslationDependencies();

  const unsupportedRAQIFilters = useMemo(() => {
    return raqiFilters.filter(
      ({ dimension }) =>
        isValidArrayEnumValue(raqiSupportedFilterBarDimensions, dimension) &&
        !supportedRAQIDimensions.includes(dimension) &&
        !knownRAQIDimensionsShownElsewhere?.includes(dimension),
    );
  }, [knownRAQIDimensionsShownElsewhere, raqiFilters, supportedRAQIDimensions]);

  const chips = useMemo(() => {
    const result = dimensions.reduce((components: React.ReactNode[], dimension) => {
      const filter = filters.find((f) => f.dimension === dimension);
      if (!filter) return components;

      const config = getRAQIOrLegacyFilterConfig(dimension);
      const { optionType } = config;

      switch (optionType) {
        case OptionType.RAQIV2DynamicEnum:
        case OptionType.RAQIV2StaticEnum: {
          if (shouldHideDueToBlankFilterChip(filter, config)) {
            return components;
          }
          const { raqiDimension } = config;
          const { name: dimensionNameKey, getBreakdownValueName } =
            getDimensionRenderer(raqiDimension);
          const value = filter.values.map((v) =>
            getBreakdownValueName({ value: v }, translationDependencies),
          );
          const name = translate(dimensionNameKey);

          components.push(
            <Grid item key={dimension}>
              <FilterChip
                label={`${name}: ${value.join(', ')}`}
                onDelete={() => {
                  const newFilters = updateFilterValues(filters, dimension, null);
                  onFiltersChange(newFilters);
                }}
              />
            </Grid>,
          );
          return components;
        }
        case OptionType.Legacy: {
          const value = filter.values.join(', ');
          const key = translate(config.dimensionNameKey);

          components.push(
            <Grid item key={dimension}>
              <FilterChip
                label={`${key}: ${value}`}
                onDelete={() => {
                  const newFilters = updateFilterValues(filters, dimension, null);
                  onFiltersChange(newFilters);
                }}
              />
            </Grid>,
          );
          return components;
        }
        default: {
          const exhaustiveCheck: never = optionType;
          throw new Error(`Unhandled option type ${exhaustiveCheck}`);
        }
      }
    }, []);

    unsupportedRAQIFilters.forEach(({ dimension, values }) => {
      const { name: nameKey, getBreakdownValueName } = getDimensionRenderer(dimension);
      const name = translate(nameKey);
      const value = values.map((v) => getBreakdownValueName({ value: v }, translationDependencies));
      result.push(
        <Grid item key={dimension}>
          <FilterChip
            disabled
            label={`${name}: ${value.join(', ')}`}
            onDelete={() => onUnsupportedDimensionFilterDelete(dimension)}
          />
        </Grid>,
      );
    });

    return result;
  }, [
    dimensions,
    filters,
    onFiltersChange,
    onUnsupportedDimensionFilterDelete,
    translate,
    translationDependencies,
    unsupportedRAQIFilters,
  ]);

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

export default ExperienceAnalyticsFilterChips;
