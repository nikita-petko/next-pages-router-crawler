import { useMemo, useCallback, useEffect } from 'react';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { RAQIV2Dimension, RAQIV2DimensionDisplayConfig } from '@rbx/creator-hub-analytics-config';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import FilterDrawerEnumChoice from '@modules/charts-generic/components/FilterDrawer/FilterDrawerEnumChoice';
import FilterStringChoice, {
  BlankHandlingType,
} from '@modules/charts-generic/components/FilterStringChoice';
import MultiComboboxTypeahead from '@modules/charts-generic/components/MultiComboboxTypeahead';
import type { RAQIV2APIQueryFilter } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import legacyFiltersToRAQIV2 from '../../adapters/legacyFiltersToRAQIV2';
import getDimensionRenderer from '../../components/getDimensionRenderer';
import OnboardingTipsCarousel from '../../components/OnboardingTips/OnboardingTipsCarousel';
import type { DynamicEnumFilterDimensionConfigV2 } from '../../constants/FilterDimensionConfig';
import { OnboardingFeatureKey, OnboardingStepKey } from '../../constants/onboardingTipsConfigs';
import useCurrentAnalyticsPageContextMetrics from '../../hooks/useCurrentAnalyticsPageContextMetrics';
import useRAQIV2DimensionChoiceRenderBundle from '../../hooks/useRAQIV2DimensionChoiceRenderBundle';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import RAQIV2FilterRenderPosition from '../../types/RAQIV2FilterRenderPosition';
import filterPositionOnPageByDimension, {
  SearchableControlsFilterBarDimensions,
} from '../../utils/filterPositionOnPageByDimension';
import sortPlaceVersionFilterOptionsDescending from '../../utils/sortPlaceVersionFilterOptionsDescending';
import type ExperienceAnalyticsPageFilterChoiceProps from './ExperienceAnalyticsPageFilterChoiceProps';

const REQUIRED_PREREQUISITE_DIMENSIONS: Partial<
  Record<TRAQIV2Dimension, readonly TRAQIV2Dimension[]>
> = {
  [RAQIV2Dimension.PlaceVersion]: [RAQIV2Dimension.Place],
  [RAQIV2Dimension.FirstSeenPlaceVersion]: [RAQIV2Dimension.Place],
};

/**
 * Typed `Object.entries` for `Partial<Record<K, V>>` source objects whose key
 * type is statically known. Encapsulates the unavoidable cast in a single
 * trusted helper (TS's `Object.entries` always widens keys to `string`).
 */
const partialRecordEntries = <K extends string, V>(
  obj: Partial<Record<K, V>>,
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- documented contract
): Array<[K, V]> => Object.entries(obj) as Array<[K, V]>;

// Exclude child filters from the scoping set when looking up parent options
const SCOPING_FILTER_EXCLUSIONS: Partial<Record<TRAQIV2Dimension, readonly TRAQIV2Dimension[]>> =
  (() => {
    const result: Partial<Record<TRAQIV2Dimension, TRAQIV2Dimension[]>> = {};
    partialRecordEntries(REQUIRED_PREREQUISITE_DIMENSIONS).forEach(([child, parents]) => {
      parents.forEach((parent) => {
        const list = result[parent] ?? [];
        list.push(child);
        result[parent] = list;
      });
    });
    return result;
  })();

// Dimensions whose selections should never narrow another dimension's option lookup.
const NON_SCOPING_DIMENSIONS: ReadonlySet<TRAQIV2Dimension> = new Set<TRAQIV2Dimension>([
  RAQIV2Dimension.Keyword,
]);

/**
 * Type guard for a filter dimension being one of the known
 * (base + pseudo) dimensions advertised in `RAQIV2DimensionDisplayConfig`.
 * Narrows `string` to `TRAQIV2Dimension` so downstream calls don't need
 * inline `as TRAQIV2Dimension` casts.
 */
const isKnownDimension = (dimension: string): dimension is TRAQIV2Dimension =>
  dimension in RAQIV2DimensionDisplayConfig;

const ErrorReportNewErrorsSinceOnboardingAnchor = () => (
  <OnboardingTipsCarousel
    featureKey={OnboardingFeatureKey.CreatorHubAnalyticsErrorReportRules}
    stepKey={OnboardingStepKey.ErrorReportNewErrorsSinceFilter}
  />
);

type ExperienceAnalyticsPageFilterChoiceDynamicRAQIV2Props =
  ExperienceAnalyticsPageFilterChoiceProps & {
    config: DynamicEnumFilterDimensionConfigV2;
  };

export const getDynamicFilterMultipleSelectConfig = (
  raqiDimension: DynamicEnumFilterDimensionConfigV2['raqiDimension'],
  effectiveSingular: boolean,
) => ({
  controlBarMultipleSelect: raqiDimension === RAQIV2Dimension.PlaceVersion,
  filterDrawerMultipleSelect: !effectiveSingular,
});

const ExperienceAnalyticsPageFilterChoiceDynamicRAQIV2 = ({
  resource,
  uiFilters,
  onUIFilterValueChange,
  filterBarDimension,
  config: { raqiDimension, singular },
  className,
}: ExperienceAnalyticsPageFilterChoiceDynamicRAQIV2Props) => {
  const skipSingularAutoSelect =
    raqiDimension === RAQIV2Dimension.PlaceVersion ||
    raqiDimension === RAQIV2Dimension.FirstSeenPlaceVersion;
  const effectiveSingular = skipSingularAutoSelect ? false : Boolean(singular);
  const { controlBarMultipleSelect, filterDrawerMultipleSelect } =
    getDynamicFilterMultipleSelectConfig(raqiDimension, effectiveSingular);

  const filtersV2 = useMemo(() => legacyFiltersToRAQIV2(uiFilters), [uiFilters]);
  const filter = useMemo(
    () => filtersV2.find((f) => f.dimension === raqiDimension),
    [filtersV2, raqiDimension],
  );

  // Build the scoping filter set forwarded to the dimension-values request so
  // dependent dimensions can be narrowed by the user's other selections (e.g.
  // PlaceVersion options scoped to the currently selected Place
  const scopingFilters = useMemo<RAQIV2APIQueryFilter[]>(() => {
    const excludedDimensions = SCOPING_FILTER_EXCLUSIONS[raqiDimension] ?? [];
    return filtersV2.filter((f): f is RAQIV2APIQueryFilter => {
      if (f.dimension === raqiDimension) {
        return false;
      }
      if (!isKnownDimension(f.dimension)) {
        return false;
      }
      if (excludedDimensions.includes(f.dimension)) {
        return false;
      }
      if (NON_SCOPING_DIMENSIONS.has(f.dimension)) {
        return false;
      }
      return Array.isArray(f.values) && f.values.length > 0;
    });
  }, [filtersV2, raqiDimension]);
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
  const { translate } = translationDependencies;
  const name = translate(dimensionNameKey);
  const searchPlaceholder = translate(
    translationKey('Placeholder.SearchByDimension', TranslationNamespace.Analytics),
    { dimensionName: name },
  );
  const description = getBreakdownDescription?.(translationDependencies);

  // `useCurrentAnalyticsPageContextMetrics` returns `null` until the page
  // surface context resolves (e.g. mid-mount on the explore page in computed
  // metric mode, or while the metric URL param is being parsed). Treat that
  // window as "still loading the metric context" rather than crashing — the
  // hook will re-run once metrics arrive, and the empty-metrics branch in
  // `useRAQIV2DimensionValuesRequest` short-circuits the network call so we
  // don't fire a request without a metric to scope option values to.
  const contextMetrics = useCurrentAnalyticsPageContextMetrics();
  const safeContextMetrics = useMemo(() => contextMetrics ?? [], [contextMetrics]);
  const isContextMetricsUnresolved = contextMetrics === null || contextMetrics.length === 0;

  const arePrerequisitesSatisfied = useMemo(() => {
    const required = REQUIRED_PREREQUISITE_DIMENSIONS[raqiDimension];
    if (!required || required.length === 0) {
      return true;
    }
    return required.every((reqDim) =>
      scopingFilters.some((f) => f.dimension === reqDim && f.values.length > 0),
    );
  }, [raqiDimension, scopingFilters]);
  const metricsForDimensionRequest = useMemo(
    () => (arePrerequisitesSatisfied ? safeContextMetrics : []),
    [arePrerequisitesSatisfied, safeContextMetrics],
  );

  const {
    enumOptions: rawEnumOptions,
    isDataLoading,
    formatOption,
  } = useRAQIV2DimensionChoiceRenderBundle(
    resource,
    raqiDimension,
    metricsForDimensionRequest,
    undefined,
    { onlyFilterSupportedValues: true, filter: scopingFilters },
  );

  const enumOptions = useMemo(() => {
    if (
      raqiDimension === RAQIV2Dimension.PlaceVersion ||
      raqiDimension === RAQIV2Dimension.FirstSeenPlaceVersion
    ) {
      return sortPlaceVersionFilterOptionsDescending(rawEnumOptions);
    }
    if (raqiDimension === RAQIV2Dimension.JourneyVersion) {
      return [...rawEnumOptions].sort((a, b) => Number(b) - Number(a));
    }
    return rawEnumOptions;
  }, [raqiDimension, rawEnumOptions]);

  const effectiveIsLoading =
    arePrerequisitesSatisfied && (isDataLoading || isContextMetricsUnresolved);

  // A single-place experience has exactly one Place option. In that case we
  // auto-select it and hide the blank "Experience" (all places) choice, since
  // there's nothing to aggregate across.
  const isSinglePlaceExperience =
    raqiDimension === RAQIV2Dimension.Place && enumOptions.length === 1;
  const blankValue = renderEmpty && renderEmpty(translationDependencies);

  const blankHandling =
    blankValue && !isSinglePlaceExperience
      ? { type: BlankHandlingType.Value as const, value: blankValue }
      : undefined;

  const values = useMemo(() => filter?.values ?? [], [filter?.values]);

  useEffect(() => {
    if (
      (effectiveSingular || isSinglePlaceExperience) &&
      values.length === 0 &&
      enumOptions.length > 0
    ) {
      onChangeSubmit([enumOptions[0]]);
    }
  }, [effectiveSingular, enumOptions, isSinglePlaceExperience, onChangeSubmit, values.length]);

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
          isLoading={effectiveIsLoading}
          overrideSignal={values}
          multiple={filterDrawerMultipleSelect}
        />
      );
    case RAQIV2FilterRenderPosition.PreControl:
    case RAQIV2FilterRenderPosition.Controls:
    case RAQIV2FilterRenderPosition.ControlsRight:
    case RAQIV2FilterRenderPosition.ControlsRow2:
      if (raqiDimension === RAQIV2Dimension.FirstSeenPlaceVersion) {
        return (
          <div className='flex items-center gap-xsmall'>
            <FilterStringChoice
              key={filterBarDimension}
              label={name}
              multiple={controlBarMultipleSelect}
              onChange={onChangeSubmit}
              selectedOptions={values}
              options={enumOptions}
              formatOption={formatOption}
              isLoading={effectiveIsLoading}
              blankHandling={blankHandling}
              className={className}
              tooltipOnDisabled={
                !enumOptions.length && !effectiveIsLoading
                  ? getEmptyFilterValuesTooltip?.(translationDependencies)
                  : undefined
              }
            />
            <ErrorReportNewErrorsSinceOnboardingAnchor />
          </div>
        );
      }
      if (SearchableControlsFilterBarDimensions.has(filterBarDimension)) {
        return (
          <MultiComboboxTypeahead
            key={filterBarDimension}
            options={enumOptions}
            value={values}
            setValue={onChangeSubmit}
            getOptionLabel={formatOption}
            label={name}
            placeholder={searchPlaceholder}
            isLoading={effectiveIsLoading}
            size='Medium'
            className={className}
          />
        );
      }
      /**
       * We never show checkboxes in the control bar,
       * so we shouldn't use EnumChoice which can become either a dropdown or checkboxes.
       */
      return (
        <FilterStringChoice
          key={filterBarDimension}
          label={name}
          multiple={controlBarMultipleSelect}
          onChange={onChangeSubmit}
          selectedOptions={values}
          options={enumOptions}
          formatOption={formatOption}
          isLoading={effectiveIsLoading}
          blankHandling={blankHandling}
          className={className}
          showOptionIdAsDescription={raqiDimension === RAQIV2Dimension.Place}
          tooltipOnDisabled={
            !enumOptions.length && !effectiveIsLoading
              ? getEmptyFilterValuesTooltip?.(translationDependencies)
              : undefined
          }
        />
      );
    default: {
      const exhaustiveCheck: never = position;
      throw new Error(`Unhandled filter position ${String(exhaustiveCheck)}`);
    }
  }
};

export default ExperienceAnalyticsPageFilterChoiceDynamicRAQIV2;
