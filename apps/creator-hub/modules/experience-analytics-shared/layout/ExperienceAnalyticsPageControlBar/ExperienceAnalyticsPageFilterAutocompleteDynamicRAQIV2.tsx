import { useCallback, useEffect, useMemo } from 'react';
import { RAQIV2DimensionDisplayConfig } from '@rbx/creator-hub-analytics-config';
import type { FormattedText } from '@modules/analytics-translations/types';
import AutocompleteChoiceControl from '@modules/charts-generic/components/AutocompleteChoiceControl';
import legacyFiltersToRAQIV2 from '../../adapters/legacyFiltersToRAQIV2';
import { useRAQIV2ConfigurablePageSurfaceContext } from '../../components/RAQIV2/layout/RAQIV2ConfigurablePageContext';
import type { DynamicEnumFilterDimensionConfigV2 } from '../../constants/FilterDimensionConfig';
import useRAQIV2DimensionChoiceRenderBundle from '../../hooks/useRAQIV2DimensionChoiceRenderBundle';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import type TDateRangeSelection from '../../types/DateRangeSelection';
import type ExperienceAnalyticsPageFilterChoiceProps from './ExperienceAnalyticsPageFilterChoiceProps';

type ExperienceAnalyticsPageFilterAutocompleteDynamicRAQIV2Props =
  ExperienceAnalyticsPageFilterChoiceProps & {
    config: DynamicEnumFilterDimensionConfigV2;
    filterSelectorLabel?: FormattedText;
    dateRangeSelection?: TDateRangeSelection;
  };

const ExperienceAnalyticsPageFilterAutocompleteDynamicRAQIV2 = ({
  resource,
  uiFilters,
  onUIFilterValueChange,
  filterBarDimension,
  config: { raqiDimension, singular },
  filterSelectorLabel,
  dateRangeSelection,
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
    dateRangeSelection,
    { onlyFilterSupportedValues: true },
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
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- RAQI dimension ids are valid translation fallback labels.
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
