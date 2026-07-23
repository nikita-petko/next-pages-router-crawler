import React, { useCallback, useEffect, useMemo } from 'react';
import { AutocompleteChoiceControl } from '@modules/charts-generic';
import { FormattedText } from '@modules/analytics-translations';
import { RAQIV2DimensionDisplayConfig } from '@rbx/creator-hub-analytics-config';
import { useRAQIV2ConfigurablePageSurfaceContext } from '../../components/RAQIV2/layout/RAQIV2ConfigurablePageContext';
import { DynamicEnumFilterDimensionConfigV2 } from '../../constants/FilterDimensionConfig';
import useRAQIV2DimensionChoiceRenderBundle from '../../hooks/useRAQIV2DimensionChoiceRenderBundle';
import legacyFiltersToRAQIV2 from '../../adapters/legacyFiltersToRAQIV2';
import type TTimeRangeSpec from '../../types/TimeRangeSpec';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import ExperienceAnalyticsPageFilterChoiceProps from './ExperienceAnalyticsPageFilterChoiceProps';

type ExperienceAnalyticsPageFilterAutocompleteDynamicRAQIV2Props =
  ExperienceAnalyticsPageFilterChoiceProps & {
    config: DynamicEnumFilterDimensionConfigV2;
    filterSelectorLabel?: FormattedText;
    timeRangeSpec?: TTimeRangeSpec;
  };

const ExperienceAnalyticsPageFilterAutocompleteDynamicRAQIV2 = ({
  resource,
  uiFilters,
  onUIFilterValueChange,
  filterBarDimension,
  config: { raqiDimension, singular },
  filterSelectorLabel,
  timeRangeSpec,
}: ExperienceAnalyticsPageFilterAutocompleteDynamicRAQIV2Props) => {
  const filter = useMemo(() => {
    const filtersV2 = legacyFiltersToRAQIV2(uiFilters);
    return filtersV2.find((f) => f.dimension === raqiDimension);
  }, [uiFilters, raqiDimension]);

  const currentValue = useMemo(() => filter?.values[0] ?? null, [filter]);

  const setValue = useCallback(
    (value: string | null) => {
      onUIFilterValueChange(value ? [value] : [], filterBarDimension);
    },
    [filterBarDimension, onUIFilterValueChange],
  );

  const { pageVisibleMetrics } = useRAQIV2ConfigurablePageSurfaceContext();

  const { enumOptions, formatOption } = useRAQIV2DimensionChoiceRenderBundle(
    resource,
    raqiDimension,
    pageVisibleMetrics,
    timeRangeSpec,
  );

  useEffect(() => {
    if (singular && currentValue === null && enumOptions.length > 0) {
      setValue(enumOptions[0]);
    }
  }, [currentValue, enumOptions, setValue, singular]);

  const { translate } = useRAQIV2TranslationDependencies();

  const dimensionName = RAQIV2DimensionDisplayConfig[raqiDimension].name;
  const selectorLabel =
    filterSelectorLabel ??
    (dimensionName ? translate(dimensionName) : (raqiDimension as FormattedText));

  return (
    <AutocompleteChoiceControl
      options={enumOptions}
      value={currentValue}
      setValue={setValue}
      getOptionFormattedLabel={formatOption}
      selectorLabel={selectorLabel}
    />
  );
};

export default ExperienceAnalyticsPageFilterAutocompleteDynamicRAQIV2;
