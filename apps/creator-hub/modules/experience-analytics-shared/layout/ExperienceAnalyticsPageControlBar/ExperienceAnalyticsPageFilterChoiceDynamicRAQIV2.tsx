import React, { useMemo, useCallback, useEffect } from 'react';
import {
  BlankHandlingType,
  FilterDrawerEnumChoice,
  FilterStringChoice,
} from '@modules/charts-generic';
import { DynamicEnumFilterDimensionConfigV2 } from '../../constants/FilterDimensionConfig';
import legacyFiltersToRAQIV2 from '../../adapters/legacyFiltersToRAQIV2';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import useCurrentAnalyticsPageContextMetrics from '../../hooks/useCurrentAnalyticsPageContextMetrics';
import filterPositionOnPageByDimension from '../../utils/filterPositionOnPageByDimension';
import ExperienceAnalyticsPageFilterChoiceProps from './ExperienceAnalyticsPageFilterChoiceProps';
import getDimensionRenderer from '../../components/getDimensionRenderer';
import useRAQIV2DimensionChoiceRenderBundle from '../../hooks/useRAQIV2DimensionChoiceRenderBundle';
import RAQIV2FilterRenderPosition from '../../types/RAQIV2FilterRenderPosition';

type ExperienceAnalyticsPageFilterChoiceDynamicRAQIV2Props =
  ExperienceAnalyticsPageFilterChoiceProps & {
    config: DynamicEnumFilterDimensionConfigV2;
  };

const ExperienceAnalyticsPageFilterChoiceDynamicRAQIV2 = ({
  resource,
  uiFilters,
  onUIFilterValueChange,
  filterBarDimension,
  config: { raqiDimension, singular },
}: ExperienceAnalyticsPageFilterChoiceDynamicRAQIV2Props) => {
  const filter = useMemo(() => {
    const filtersV2 = legacyFiltersToRAQIV2(uiFilters);
    return filtersV2.find((f) => f.dimension === raqiDimension);
  }, [uiFilters, raqiDimension]);
  const onChangeSubmit = useCallback(
    (value: Array<string>) => onUIFilterValueChange(value, filterBarDimension),
    [filterBarDimension, onUIFilterValueChange],
  );
  const {
    name: dimensionNameKey,
    getBreakdownDescription,
    renderEmpty,
    getEmptyFilterValuesTooltip,
  } = getDimensionRenderer(raqiDimension);
  const translationDependencies = useRAQIV2TranslationDependencies();
  const name = useMemo(() => {
    const { translate } = translationDependencies;
    return translate(dimensionNameKey);
  }, [dimensionNameKey, translationDependencies]);
  const description = useMemo(() => {
    return getBreakdownDescription?.(translationDependencies);
  }, [getBreakdownDescription, translationDependencies]);

  const contextMetrics = useCurrentAnalyticsPageContextMetrics();
  if (!contextMetrics) {
    throw new Error(
      `Cannot use dynamic filter on ${raqiDimension} until ChartsByPage are defined...`,
    );
  }

  const { enumOptions, isDataLoading, formatOption } = useRAQIV2DimensionChoiceRenderBundle(
    resource,
    raqiDimension,
    contextMetrics,
  );

  const blankValue = useMemo(() => {
    return renderEmpty && renderEmpty(translationDependencies);
  }, [renderEmpty, translationDependencies]);

  const blankHandling = useMemo(
    () => (blankValue ? { type: BlankHandlingType.Value as const, value: blankValue } : undefined),
    [blankValue],
  );

  const values = useMemo(() => filter?.values ?? [], [filter?.values]);

  useEffect(() => {
    if (singular && values.length === 0 && enumOptions.length > 0) {
      onChangeSubmit([enumOptions[0]]);
    }
  }, [enumOptions, onChangeSubmit, singular, values.length]);

  const position = filterPositionOnPageByDimension(filterBarDimension);
  switch (position) {
    case RAQIV2FilterRenderPosition.FilterDrawer:
      return (
        <FilterDrawerEnumChoice
          key={filterBarDimension}
          name={name}
          description={description}
          enumOptions={enumOptions}
          initial={values}
          formatOption={formatOption}
          onChangeSubmit={onChangeSubmit}
          isLoading={isDataLoading}
          overrideSignal={values}
          multiple
        />
      );
    case RAQIV2FilterRenderPosition.PreControl:
    case RAQIV2FilterRenderPosition.Controls:
    case RAQIV2FilterRenderPosition.ControlsRight:
      /**
       * We never show checkboxes in the control bar,
       * so we shouldn't use EnumChoice which can become either a dropdown or checkboxes.
       */
      return (
        <FilterStringChoice
          key={filterBarDimension}
          label={name}
          onChange={onChangeSubmit}
          selectedOptions={values}
          options={enumOptions}
          formatOption={formatOption}
          isLoading={isDataLoading}
          blankHandling={blankHandling}
          tooltipOnDisabled={
            !enumOptions.length ? getEmptyFilterValuesTooltip?.(translationDependencies) : undefined
          }
        />
      );
    default: {
      const exhaustiveCheck: never = position;
      throw new Error(`Unhandled filter position ${exhaustiveCheck}`);
    }
  }
};

export default ExperienceAnalyticsPageFilterChoiceDynamicRAQIV2;
