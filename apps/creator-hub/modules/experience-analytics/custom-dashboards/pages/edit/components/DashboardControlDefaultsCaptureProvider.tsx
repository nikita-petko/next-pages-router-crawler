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
import type { CreatorAnalyticsUntabbedPageConfig } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { getDashboardSurface, withDashboardSurface } from '../../../layout/dashboardLayout';
import type {
  CustomDashboardConfig,
  DashboardDateRangeDefault,
  DashboardSurfaceControls,
  TileFilter,
} from '../../../types';

type DashboardControlDefaultsCaptureProviderProps = {
  readonly config: CustomDashboardConfig;
  readonly pageConfig: CreatorAnalyticsUntabbedPageConfig;
  readonly onConfigChange: (nextConfig: CustomDashboardConfig) => void;
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
    (defaults: Partial<DashboardSurfaceControls>) => {
      const surface = getDashboardSurface(config);
      onConfigChange(
        withDashboardSurface(config, {
          ...surface,
          controls: {
            ...surface.controls,
            ...defaults,
          },
        }),
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
      onChangeRangeType: (rangeType: RAQIV2DateRangeType) => {
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
        bundle.onChangeDateRangeParams(minDate, maxDate, rangeType);
        if (rangeType === RAQIV2DateRangeType.Custom && minDate && maxDate) {
          captureDefaultDateRange({
            type: 'Custom',
            startTimeMs: minDate.getTime(),
            endTimeMs: maxDate.getTime(),
          });
          return;
        }
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
      ) => {
        filterBundle.onKnownFiltersChange(filters, knownDimensions);
        const nextDefaultFilters = filters
          .filter((filter) => knownDimensions.includes(filter.dimension))
          .map((filter) => ({
            dimension: filter.dimension,
            values: [...filter.values],
          }));
        if (areTileFiltersEqual(controls.defaultFilters, nextDefaultFilters)) {
          return;
        }
        persistConfigDefaults({ defaultFilters: nextDefaultFilters });
      },
    }),
    [controls.defaultFilters, filterBundle, persistConfigDefaults],
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

  const granularityContextValue = useMemo(
    () => ({
      ...granularityBundle,
      onChangeGranularity: (
        granularity: Parameters<typeof granularityBundle.onChangeGranularity>[0],
      ) => {
        granularityBundle.onChangeGranularity(granularity);
        if (controls.defaultGranularity === granularity) {
          return;
        }
        persistConfigDefaults({ defaultGranularity: granularity });
      },
    }),
    [controls.defaultGranularity, granularityBundle, persistConfigDefaults],
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
            supportedAnnotationTypes:
              controls.annotationOptions?.supportedAnnotationTypes ??
              pageConfig.surfaceAnnotationOptions.supportedAnnotationTypes,
            showAnnotationsControl: controls.annotationOptions?.showAnnotationsControl ?? true,
            defaultAnnotationTypes: nextDefaultAnnotationTypes,
          },
        });
      },
    }),
    [
      annotationBundle,
      controls.annotationOptions,
      pageConfig.surfaceAnnotationOptions.supportedAnnotationTypes,
      persistConfigDefaults,
    ],
  );

  return (
    <AnalyticsQueryDateRangeBundleContext.Provider value={dateRangeContextValue}>
      <AnalyticsCurrentGranularityBundleContext.Provider value={granularityContextValue}>
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
