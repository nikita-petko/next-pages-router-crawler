import { useCallback, useMemo } from 'react';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import type { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { isValidArrayEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type { TSupportedFilterBarDimensions } from '../../../constants/FilterDimensionConfig';
import {
  OptionType,
  getRAQIFilterConfig,
  raqiSupportedFilterBarDimensions,
} from '../../../constants/FilterDimensionConfig';
import { useRAQIAnalyticsCurrentFilterBundle } from '../../../context/AnalyticsCurrentFilterBundleProvider';
import { useBestSupportedChartResourceOfTypes } from '../../../hooks/useChartResourceProvider';
import ExperienceAnalyticsPageFilterAutocompleteDynamicRAQIV2 from '../../../layout/ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageFilterAutocompleteDynamicRAQIV2';
import { updateFilterValues } from '../../../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import type TDateRangeSelection from '../../../types/DateRangeSelection';
import RAQIV2FilterRenderPosition from '../../../types/RAQIV2FilterRenderPosition';
import filterPositionOnPageByDimension from '../../../utils/filterPositionOnPageByDimension';
import GenericAnalyticsLayoutItem from './GenericAnalyticsLayoutItem';

const useRAQIV2PredefinedPreControlFiltersBundle = (
  resourceTypes: RAQIV2ChartResourceType[],
  raqiDimensions: ReadonlyArray<TRAQIV2Dimension>,
  dateRangeSelection?: TDateRangeSelection,
) => {
  const resource = useBestSupportedChartResourceOfTypes(resourceTypes);

  const { filters, onFiltersChange } = useRAQIAnalyticsCurrentFilterBundle(raqiDimensions);
  const onFilterValueChange = useCallback(
    (newFilterValue: string[] | null, dimension: TSupportedFilterBarDimensions) => {
      const updatedFilters = updateFilterValues(filters, dimension, newFilterValue);
      onFiltersChange(updatedFilters);
    },
    [filters, onFiltersChange],
  );

  const preControlFilterDimensions = useMemo(() => {
    const dimensionsInPreControls: TSupportedFilterBarDimensions[] = [];
    raqiDimensions?.forEach((dim) => {
      if (!isValidArrayEnumValue(raqiSupportedFilterBarDimensions, dim)) {
        return;
      }

      const position = filterPositionOnPageByDimension(dim);
      if (position === RAQIV2FilterRenderPosition.PreControl) {
        dimensionsInPreControls.push(dim);
      }
    });
    return dimensionsInPreControls;
  }, [raqiDimensions]);

  const filterAutocompleteComponents = useMemo(() => {
    return preControlFilterDimensions.flatMap((dim) => {
      if (!isValidArrayEnumValue(raqiSupportedFilterBarDimensions, dim)) {
        logAnalyticsError(`Invalid dimension ${dim} in pre-control filter dimensions`);
        return [];
      }

      const filterConfig = getRAQIFilterConfig(dim);
      const { optionType } = filterConfig;
      switch (optionType) {
        case OptionType.RAQIV2DynamicEnum:
          return (
            <ExperienceAnalyticsPageFilterAutocompleteDynamicRAQIV2
              key={dim}
              resource={resource}
              filterBarDimension={dim}
              uiFilters={filters}
              onUIFilterValueChange={onFilterValueChange}
              config={filterConfig}
              dateRangeSelection={dateRangeSelection}
            />
          );
        // NOTE(shumingxu, 2024-08-08): Static enums are possible but not implemented with the dynamic raqi
        // component. We can add a new autocomplete component for static enums if needed.
        case OptionType.RAQIV2StaticEnum:
          throw new Error(`Unhandled option type ${optionType} in pre-control filter dimensions`);
        default: {
          const exhaustiveCheck: never = optionType;
          throw new Error(`Unhandled option type ${String(exhaustiveCheck)}`);
        }
      }
    });
  }, [dateRangeSelection, filters, onFilterValueChange, preControlFilterDimensions, resource]);

  const preControlFilters = useMemo(() => {
    if (!filterAutocompleteComponents.length) {
      return null;
    }
    return filterAutocompleteComponents.map((component) => (
      <GenericAnalyticsLayoutItem key={component.key}>{component}</GenericAnalyticsLayoutItem>
    ));
  }, [filterAutocompleteComponents]);

  const bundle = useMemo(() => ({ preControlFilters }), [preControlFilters]);

  return bundle;
};

export default useRAQIV2PredefinedPreControlFiltersBundle;
