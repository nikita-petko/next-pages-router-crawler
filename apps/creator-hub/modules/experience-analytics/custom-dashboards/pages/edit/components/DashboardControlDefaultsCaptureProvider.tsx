import { type FC, type ReactNode, useCallback, useContext, useMemo } from 'react';
import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import AnalyticsQueryDateRangeBundleContext, {
  useAnalyticsCurrentDateRangeBundle,
} from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import type { AnnotationType } from '@modules/clients/analytics/annotations/annotations';
import { getAnnotationTypesFromAnnotationOptions } from '@modules/experience-analytics-shared/constants/annotationConfig';
import { AnalyticsCurrentBreakdownContext } from '@modules/experience-analytics-shared/context/AnalyticsCurrentBreakdownBundleProvider';
import { AnalyticsCurrentFilterBundleContext } from '@modules/experience-analytics-shared/context/AnalyticsCurrentFilterBundleProvider';
import { AnalyticsCurrentGranularityBundleContext } from '@modules/experience-analytics-shared/context/AnalyticsCurrentGranularityProvider';
import { ExperienceAnalyticsCurrentAnnotationsBundleContext } from '@modules/experience-analytics-shared/context/ExperienceAnalyticsCurrentAnnotationsBundleProvider';
import type { UIFilterChangeOptions } from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/filterUtils';
import type { CreatorAnalyticsUntabbedPageConfig } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { resolveCustomDashboardSupportedAnnotationTypes } from '../../../constants/customDashboardSurfaceAnnotationOptions';
import {
  getChartRows,
  getDashboardSurface,
  withChartRows,
  withDashboardSurface,
} from '../../../layout/dashboardLayout';
import { isMetricSpecificTileFilter } from '../../../synthesis/tileSpecBuilders';
import type {
  ChartTileConfig,
  CustomDashboardConfig,
  DashboardDateRangeDefault,
  DashboardSurfaceControls,
  TileFilter,
} from '../../../types';
import {
  CUSTOM_DASHBOARD_SAVED_DATE_RANGE_LIMIT_DAYS,
  constrainCustomDashboardEditorDateRange,
  isSupportedCustomDashboardSavedDateRangeType,
} from '../../../utils/savedDateRange';

type DashboardControlDefaultsCaptureProviderProps = {
  readonly config: CustomDashboardConfig;
  readonly pageConfig: CreatorAnalyticsUntabbedPageConfig;
  readonly onConfigChange: (
    nextConfig: CustomDashboardConfig,
    options?: UIFilterChangeOptions,
  ) => void;
  readonly children: ReactNode;
};

function areDefaultDateRangesEqual(
  left: DashboardDateRangeDefault | undefined,
  right: DashboardDateRangeDefault | undefined,
): boolean {
  if (left === right) {
    return true;
  }
  if (!left || !right || left.type !== right.type) {
    return false;
  }
  if (left.type === 'Relative') {
    return right.type === 'Relative' && left.rangeType === right.rangeType;
  }
  return (
    right.type === 'Custom' &&
    left.startTimeMs === right.startTimeMs &&
    left.endTimeMs === right.endTimeMs
  );
}

const areStringArraysEqual = (
  left: ReadonlyArray<string> | undefined,
  right: ReadonlyArray<string> | undefined,
): boolean => {
  const normalizedLeft = left ?? [];
  const normalizedRight = right ?? [];
  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((value, index) => value === normalizedRight[index])
  );
};

const areTileFiltersEqual = (
  left: ReadonlyArray<TileFilter> | undefined,
  right: ReadonlyArray<TileFilter> | undefined,
): boolean => {
  const normalizedLeft = left ?? [];
  const normalizedRight = right ?? [];
  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((filter, index) => {
      const other = normalizedRight[index];
      return (
        other !== undefined &&
        filter.dimension === other.dimension &&
        areStringArraysEqual(filter.values, other.values)
      );
    })
  );
};

export function syncMetricScopedFiltersToTiles(
  config: CustomDashboardConfig,
  filters: ReadonlyArray<TileFilter>,
): CustomDashboardConfig {
  const rows = getChartRows(config);
  let didChange = false;
  const nextRows = rows.map((row) => ({
    ...row,
    tiles: row.tiles.map((tile): ChartTileConfig => {
      const metricKey = tile.dataSpec.metrics[0]?.metric.metricKey;
      if (!metricKey) {
        return tile;
      }
      const metricScopedFilters = filters.filter((filter) =>
        isMetricSpecificTileFilter(metricKey, filter),
      );
      const preservedFilters = tile.dataSpec.filters.filter(
        (filter) => !isMetricSpecificTileFilter(metricKey, filter),
      );
      const nextFilters = [...preservedFilters, ...metricScopedFilters];
      if (areTileFiltersEqual(tile.dataSpec.filters, nextFilters)) {
        return tile;
      }
      didChange = true;
      return {
        ...tile,
        dataSpec: {
          ...tile.dataSpec,
          filters: nextFilters,
        },
      };
    }),
  }));

  return didChange ? withChartRows(config, nextRows) : config;
}

const DashboardControlDefaultsCaptureProvider: FC<DashboardControlDefaultsCaptureProviderProps> = ({
  config,
  pageConfig,
  onConfigChange,
  children,
}) => {
  const controls = getDashboardSurface(config).controls;
  const defaultDateRange =
    controls.timeRangeOptions?.type === 'DateRange'
      ? controls.timeRangeOptions.defaultSelection
      : undefined;
  const bundle = useAnalyticsCurrentDateRangeBundle();
  const filterBundle = useContext(AnalyticsCurrentFilterBundleContext);
  const breakdownBundle = useContext(AnalyticsCurrentBreakdownContext);
  const granularityBundle = useContext(AnalyticsCurrentGranularityBundleContext);
  const annotationBundle = useContext(ExperienceAnalyticsCurrentAnnotationsBundleContext);

  const persistConfigDefaults = useCallback(
    (
      defaults: Partial<DashboardSurfaceControls>,
      nextConfig = config,
      options?: UIFilterChangeOptions,
    ) => {
      const surface = getDashboardSurface(nextConfig);
      onConfigChange(
        withDashboardSurface(nextConfig, {
          ...surface,
          controls: {
            ...surface.controls,
            ...defaults,
          },
        }),
        options,
      );
    },
    [config, onConfigChange],
  );

  const captureDefaultDateRange = useCallback(
    (nextDefaultDateRange: DashboardDateRangeDefault) => {
      if (areDefaultDateRangesEqual(defaultDateRange, nextDefaultDateRange)) {
        return;
      }
      persistConfigDefaults({
        timeRangeOptions: {
          ...(controls.timeRangeOptions?.type === 'DateRange'
            ? controls.timeRangeOptions
            : { type: 'DateRange' as const }),
          defaultSelection: nextDefaultDateRange,
        },
      });
    },
    [controls.timeRangeOptions, defaultDateRange, persistConfigDefaults],
  );

  const dateRangeContextValue = useMemo(
    () => ({
      ...bundle,
      maxRangeDays: CUSTOM_DASHBOARD_SAVED_DATE_RANGE_LIMIT_DAYS,
      onChangeRangeType: (rangeType: RAQIV2DateRangeType) => {
        if (!isSupportedCustomDashboardSavedDateRangeType(rangeType)) {
          return;
        }
        bundle.onChangeRangeType(rangeType);
        if (rangeType !== RAQIV2DateRangeType.Custom) {
          captureDefaultDateRange({ type: 'Relative', rangeType });
        }
      },
      onChangeDateRangeParams: (
        minDate: Date | null,
        maxDate: Date | null,
        rangeType: RAQIV2DateRangeType,
      ) => {
        if (rangeType === RAQIV2DateRangeType.Custom && minDate && maxDate) {
          const constrainedRange = constrainCustomDashboardEditorDateRange(minDate, maxDate);
          bundle.onChangeDateRangeParams(
            constrainedRange.startDate,
            constrainedRange.endDate,
            rangeType,
          );
          captureDefaultDateRange({
            type: 'Custom',
            startTimeMs: constrainedRange.startDate.getTime(),
            endTimeMs: constrainedRange.endDate.getTime(),
          });
          return;
        }
        if (!isSupportedCustomDashboardSavedDateRangeType(rangeType)) {
          return;
        }
        bundle.onChangeDateRangeParams(minDate, maxDate, rangeType);
        if (rangeType !== RAQIV2DateRangeType.Custom) {
          captureDefaultDateRange({ type: 'Relative', rangeType });
        }
      },
    }),
    [bundle, captureDefaultDateRange],
  );

  const filterContextValue = useMemo(
    () => ({
      ...filterBundle,
      onKnownFiltersChange: (
        filters: Parameters<typeof filterBundle.onKnownFiltersChange>[0],
        knownDimensions: Parameters<typeof filterBundle.onKnownFiltersChange>[1],
        options?: UIFilterChangeOptions,
      ) => {
        // Preserve the live bundle exactly as emitted. Hydrate also writes the
        // working copy so the next explicit Save persists the coerced Place.
        // The editor rebases its dirty baseline when `options.hydrate` is set.
        filterBundle.onKnownFiltersChange(filters, knownDimensions, options);
        const nextDefaultFilters = filters
          .filter((filter) => knownDimensions.includes(filter.dimension))
          .filter(
            (filter) =>
              !pageConfig.body.some((component) => {
                if (
                  typeof component !== 'object' ||
                  component === null ||
                  // The page config's component enum and app enum are separate declarations.
                  // oxlint-disable-next-line typescript/no-unsafe-enum-comparison
                  component.type !== 'Chart' ||
                  !('metric' in component)
                ) {
                  return false;
                }
                return isMetricSpecificTileFilter(component.metric, filter);
              }),
          )
          .map((filter) => ({
            dimension: filter.dimension,
            values: [...filter.values],
          }));
        const configWithMetricFilters = syncMetricScopedFiltersToTiles(config, filters);
        if (
          areTileFiltersEqual(controls.defaultFilters, nextDefaultFilters) &&
          configWithMetricFilters === config
        ) {
          return;
        }
        persistConfigDefaults(
          { defaultFilters: nextDefaultFilters },
          configWithMetricFilters,
          options,
        );
      },
    }),
    [config, controls.defaultFilters, filterBundle, pageConfig.body, persistConfigDefaults],
  );

  const breakdownContextValue = useMemo(
    () => ({
      ...breakdownBundle,
      setBreakdown: (breakdown: Parameters<typeof breakdownBundle.setBreakdown>[0]) => {
        breakdownBundle.setBreakdown(breakdown);
        const nextDefaultBreakdown = breakdown.filter((dimension) =>
          pageConfig.breakdownDimensions.includes(dimension),
        );
        if (areStringArraysEqual(controls.defaultBreakdown, nextDefaultBreakdown)) {
          return;
        }
        persistConfigDefaults({ defaultBreakdown: nextDefaultBreakdown });
      },
    }),
    [
      breakdownBundle,
      controls.defaultBreakdown,
      pageConfig.breakdownDimensions,
      persistConfigDefaults,
    ],
  );

  const annotationContextValue = useMemo(
    () => ({
      ...annotationBundle,
      onAnnotationOptionsChange: (
        options: Parameters<typeof annotationBundle.onAnnotationOptionsChange>[0],
      ) => {
        annotationBundle.onAnnotationOptionsChange(options);
        const nextDefaultAnnotationTypes = options
          ? getAnnotationTypesFromAnnotationOptions(options).filter(
              (annotationType): annotationType is AnnotationType => annotationType !== 'None',
            )
          : [];
        if (
          areStringArraysEqual(
            controls.annotationOptions?.defaultAnnotationTypes,
            nextDefaultAnnotationTypes,
          )
        ) {
          return;
        }
        persistConfigDefaults({
          annotationOptions: {
            supportedAnnotationTypes: resolveCustomDashboardSupportedAnnotationTypes(
              nextDefaultAnnotationTypes,
            ),
            showAnnotationsControl: controls.annotationOptions?.showAnnotationsControl ?? true,
            defaultAnnotationTypes: nextDefaultAnnotationTypes,
          },
        });
      },
    }),
    [annotationBundle, controls.annotationOptions, persistConfigDefaults],
  );

  return (
    <AnalyticsQueryDateRangeBundleContext.Provider value={dateRangeContextValue}>
      <AnalyticsCurrentGranularityBundleContext.Provider value={granularityBundle}>
        <AnalyticsCurrentBreakdownContext.Provider value={breakdownContextValue}>
          <AnalyticsCurrentFilterBundleContext.Provider value={filterContextValue}>
            <ExperienceAnalyticsCurrentAnnotationsBundleContext.Provider
              value={annotationContextValue}>
              {children}
            </ExperienceAnalyticsCurrentAnnotationsBundleContext.Provider>
          </AnalyticsCurrentFilterBundleContext.Provider>
        </AnalyticsCurrentBreakdownContext.Provider>
      </AnalyticsCurrentGranularityBundleContext.Provider>
    </AnalyticsQueryDateRangeBundleContext.Provider>
  );
};

export default DashboardControlDefaultsCaptureProvider;
