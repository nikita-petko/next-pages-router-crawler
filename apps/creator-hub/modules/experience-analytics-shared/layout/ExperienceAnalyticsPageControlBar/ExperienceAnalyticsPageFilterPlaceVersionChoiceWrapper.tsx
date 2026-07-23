import { memo, useCallback, useMemo } from 'react';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import FilterDrawerStringChoice from '@modules/charts-generic/components/FilterDrawer/FilterDrawerStringChoice';
import FilterStringChoice, {
  BlankHandlingType,
} from '@modules/charts-generic/components/FilterStringChoice';
import { useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import { useAnnotationsClient } from '@modules/charts-generic/context/AnnotationsClientProvider';
import ChartResourceType from '@modules/charts-generic/enums/ChartResourceType';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import type { RAQIMetricFilter } from '@modules/clients/analytics';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { LegacyFilterDimensionConfigs, OptionType } from '../../constants/FilterDimensionConfig';
import { useRAQIAnalyticsCurrentFilterBundle } from '../../context/AnalyticsCurrentFilterBundleProvider';
import { useExperienceAnalyticsGameDetails } from '../../context/ExperienceAnalyticsGameDetailsProvider';
import useApiRequest from '../../hooks/useApiRequest';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import type { UIFilterDimension } from './filterUtils';
import { NonRAQIUIDimension } from './filterUtils';

const dimensionDipendencies = [RAQIV2Dimension.Place];
/**
 * A wrapper component of FilterDrawerStringChoice for Place Version dimension
 */
function FilterPlaceVersionChoiceWrapper({
  filter,
  onChangeSubmit,
  renderFilterInDrawer,
  className,
}: {
  filter?: RAQIMetricFilter<UIFilterDimension>;
  onChangeSubmit: (newValue: string[]) => void;
  renderFilterInDrawer: boolean;
  className?: string;
}) {
  const config = LegacyFilterDimensionConfigs[NonRAQIUIDimension.Version];

  const { annotationsClient } = useAnnotationsClient(ChartResourceType.Universe);
  const { translate } = useRAQIV2TranslationDependencies();
  const name = translate(config.dimensionNameKey);

  const { rootPlaceId, universeId } = useExperienceAnalyticsGameDetails();
  const { filters: placeFilters } = useRAQIAnalyticsCurrentFilterBundle(dimensionDipendencies);
  const { startDate, endDate } = useAnalyticsCurrentDateRangeBundle();
  const placeId = useMemo(() => {
    const placeValue = placeFilters.find((f) => f.dimension === RAQIV2Dimension.Place)?.values[0];
    // if no place selected, use root place id
    return placeValue ? Number(placeValue) : rootPlaceId;
  }, [placeFilters, rootPlaceId]);

  const getPlaceVersions = useCallback(async () => {
    if (universeId === uninitializedUniverseId) {
      return null;
    }

    const dynamicFetcher = config.fetchDynamicOptions;
    if (dynamicFetcher?.type !== 'annotations') {
      logAnalyticsError(`annotations dynamic fetcher needed to get place versions from universe`);
      return null;
    }

    return (
      dynamicFetcher?.fetch(annotationsClient, universeId, placeId, startDate, endDate) ?? null
    );
  }, [annotationsClient, config, endDate, placeId, startDate, universeId]);

  const { data, isDataLoading } = useApiRequest(getPlaceVersions);

  const options = useMemo(() => {
    if (isDataLoading) {
      return [];
    }
    return data ?? [];
  }, [data, isDataLoading]);

  const initial = useMemo(() => {
    if (isDataLoading) {
      return [];
    }
    return filter?.values.length ? filter.values : [];
  }, [filter, isDataLoading]);

  const blankHandling = useMemo(
    () => ({
      type: BlankHandlingType.Value as const,
      value: translate(translationKey('Label.SelectVersion', TranslationNamespace.Analytics)),
    }),
    [translate],
  );

  const formatOption = useMemo(() => config.renderOptionFn(translate), [config, translate]);

  if (config.optionType !== OptionType.Legacy) {
    return null;
  }

  const helperText =
    !options.length && !isDataLoading
      ? translate(translationKey('Label.NoVersionAvailable', TranslationNamespace.Analytics))
      : '';

  return renderFilterInDrawer ? (
    <FilterDrawerStringChoice
      name={name}
      isLoading={isDataLoading}
      initial={initial}
      formatOption={formatOption}
      options={options}
      onChangeSubmit={onChangeSubmit}
      multiple
      blankHandling={blankHandling}
      helperText={helperText}
      overrideSignal={initial}
    />
  ) : (
    <FilterStringChoice
      label={name}
      isLoading={isDataLoading}
      formatOption={formatOption}
      options={options}
      selectedOptions={initial}
      onChange={onChangeSubmit}
      blankHandling={blankHandling}
      tooltipOnDisabled={helperText}
      className={className}
      multiple
    />
  );
}

export default memo(FilterPlaceVersionChoiceWrapper);
