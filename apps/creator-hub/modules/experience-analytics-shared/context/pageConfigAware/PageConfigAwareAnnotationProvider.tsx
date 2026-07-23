/**
 * Layer 2: Page Config Aware Annotation Provider
 *
 * This provider consumes raw query params from Layer 1 and applies page-config-based defaults
 * for annotation types. It provides to the EXISTING annotation bundle contexts so that existing
 * hooks continue to work unchanged:
 * - For Universe resource types: ExperienceAnalyticsCurrentAnnotationsBundleContext
 * - For Group/User resource types: CreatorAnalyticsCurrentAnnotationsBundleContext
 *
 * This uses explicit page config rather than URL-based inference.
 */

import React, { FC, useMemo, useCallback, useState } from 'react';
import { ChartResourceType, useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic';
import {
  AnnotationType,
  isAnnotationAlertType,
  RAQIV2ChartResourceType,
} from '@modules/clients/analytics';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { useRawAnalyticsQueryParams } from '../rawQueryParams';
import { CreatorAnalyticsPageSurfaceConfig } from '../../types/RAQIV2PageConfig';
import { AnalyticsCurrentAnnotationsBundleContextType } from '../../types/AnalyticsCurrentAnnotationsBundleContext';
import { CreatorAnalyticsCurrentAnnotationsBundleContext } from '../CreatorAnalyticsCurrentAnnotationsBundleProvider';
import { ExperienceAnalyticsCurrentAnnotationsBundleContext } from '../ExperienceAnalyticsCurrentAnnotationsBundleProvider';
import {
  AnnotationOptions,
  getAnnotationOptionsFromAnnotationTypes,
  getAnnotationTypesFromAnnotationOptions,
} from '../../constants/annotationConfig';
import useTimeSeriesAnnotations from '../../hooks/useTimeSeriesAnnotations';
import { useBestSupportedChartResourceOfTypes } from '../../hooks/useChartResourceProvider';
import { useRAQIAnalyticsCurrentFilterBundle } from '../AnalyticsCurrentFilterBundleProvider';

// Default resource types to try if none are specified in the config.
// Include all resource types to support both universe pages (via UniverseResourceProvider)
// and creator pages (via CreatorResourceProvider which handles Group/User).
const DEFAULT_RESOURCE_TYPES: ChartResourceType[] = [
  ChartResourceType.Universe,
  ChartResourceType.Group,
  ChartResourceType.User,
];

/**
 * Convert RAQIV2ChartResourceType to ChartResourceType used by the resource hooks.
 */
function toChartResourceType(raqiType: RAQIV2ChartResourceType): ChartResourceType {
  switch (raqiType) {
    case RAQIV2ChartResourceType.Universe:
      return ChartResourceType.Universe;
    case RAQIV2ChartResourceType.Group:
      return ChartResourceType.Group;
    case RAQIV2ChartResourceType.User:
      return ChartResourceType.User;
    default: {
      const exhaustiveCheck: never = raqiType;
      throw new Error(`Unknown RAQIV2ChartResourceType: ${exhaustiveCheck}`);
    }
  }
}

type AnnotationTypeOrNone = AnnotationType | 'None';

type PageConfigAwareAnnotationProviderProps = {
  children: React.ReactNode;
  config: CreatorAnalyticsPageSurfaceConfig;
};

const dimensionDependencies = [RAQIV2Dimension.Place];

export const PageConfigAwareAnnotationProvider: FC<PageConfigAwareAnnotationProviderProps> = ({
  children,
  config,
}) => {
  const rawParams = useRawAnalyticsQueryParams();
  const { startDate, endDate } = useAnalyticsCurrentDateRangeBundle();
  const { isEngineReleaseAnnotationEnabled } = useFeatureFlagsForNamespace(
    'isEngineReleaseAnnotationEnabled',
    FeatureFlagNamespace.Analytics,
  );
  const [hasAppliedDefaults, setHasAppliedDefaults] = useState(false);

  // Get resource types from config
  const resourceTypes = useMemo(() => {
    if (config?.resourceTypes && config.resourceTypes.length > 0) {
      return config.resourceTypes.map(toChartResourceType);
    }
    return DEFAULT_RESOURCE_TYPES;
  }, [config?.resourceTypes]);

  const resource = useBestSupportedChartResourceOfTypes(resourceTypes);

  // Determine if this is a universe resource type (for choosing the right context provider)
  const isUniverseResourceType = resource.type === ChartResourceType.Universe;

  // Get supported and default annotation types, applying feature flag filtering
  const { supportedAnnotationTypes, defaultAnnotationTypes } = useMemo(() => {
    let supported = config.surfaceAnnotationOptions.supportedAnnotationTypes;
    let defaults = config.surfaceAnnotationOptions.defaultAnnotationTypes;

    // Filter out engine release if not enabled
    if (!isEngineReleaseAnnotationEnabled) {
      supported = supported.filter((type) => type !== AnnotationType.EngineRelease);
      defaults = defaults.filter((type) => type !== AnnotationType.EngineRelease);
    }

    return {
      supportedAnnotationTypes: supported,
      defaultAnnotationTypes: defaults,
    };
  }, [config.surfaceAnnotationOptions, isEngineReleaseAnnotationEnabled]);

  // Check if the URL params should trigger default application:
  // - No annotation params
  const shouldApplyDefaults = !rawParams.annotations?.length;

  // Get the effective annotation types with defaulting logic
  const queriedAnnotationTypes = useMemo<AnnotationTypeOrNone[]>(() => {
    const rawAnnotations = rawParams.annotations ?? [];
    const defaultAlertAnnotations = defaultAnnotationTypes.filter(isAnnotationAlertType);

    // Apply defaults if no annotation params
    if (shouldApplyDefaults) {
      if (defaultAnnotationTypes.length > 0 && !hasAppliedDefaults) {
        // Defer setting to avoid render-during-render
        setTimeout(() => {
          rawParams.setAnnotations([...defaultAnnotationTypes]);
          setHasAppliedDefaults(true);
        }, 0);
        return [...defaultAnnotationTypes];
      }
      return [];
    }

    // Filter to only supported types
    const userSelectedTypes = rawAnnotations.filter(
      (type) => type === 'None' || supportedAnnotationTypes.includes(type),
    );

    if (userSelectedTypes.length === 1 && userSelectedTypes[0] === 'None') {
      return defaultAlertAnnotations.length > 0 ? defaultAlertAnnotations : ['None'];
    }

    // Merge with alert annotations (alerts are always shown)
    const merged = [...userSelectedTypes];
    defaultAlertAnnotations.forEach((alertType) => {
      if (!merged.includes(alertType)) {
        merged.push(alertType);
      }
    });

    return merged;
  }, [
    rawParams,
    supportedAnnotationTypes,
    defaultAnnotationTypes,
    hasAppliedDefaults,
    shouldApplyDefaults,
  ]);

  // Types to request from the backend (excluding 'None')
  const requestAnnotationTypes = useMemo(() => {
    return queriedAnnotationTypes.filter((value) => value !== 'None');
  }, [queriedAnnotationTypes]);

  // For display purposes, filter out alert types
  const queriedAnnotationWithoutAlertType = useMemo(() => {
    return queriedAnnotationTypes.filter((type) => type === 'None' || !isAnnotationAlertType(type));
  }, [queriedAnnotationTypes]);

  const { gameDetails } = useCurrentGame();
  const { filters: placeFilters } = useRAQIAnalyticsCurrentFilterBundle(dimensionDependencies);
  const placeId = useMemo(() => {
    // place filters must only have one ID, so pick the first one
    // if there is no current place filter, we use the game's root place ID
    const strNum = placeFilters[0]?.values[0] || gameDetails?.rootPlaceId;
    return strNum ? Number(strNum) : undefined;
  }, [gameDetails?.rootPlaceId, placeFilters]);

  // Fetch time series annotations
  const {
    timeSeriesAnnotations,
    getCurrentSupportedAnnotations,
    updateTimeSeriesAnnotationsGivenChartContext,
  } = useTimeSeriesAnnotations({
    resource,
    annotationTypes: requestAnnotationTypes,
    startUtc: startDate,
    endUtc: endDate,
    rootPlaceId: gameDetails?.rootPlaceId,
    placeId,
  });

  const onAnnotationOptionsChange = useCallback(
    (options: AnnotationOptions[] | null) => {
      if (options) {
        const annotationTypes = getAnnotationTypesFromAnnotationOptions(options);
        rawParams.setAnnotations(annotationTypes);
      }
    },
    [rawParams],
  );

  const contextValue = useMemo<AnalyticsCurrentAnnotationsBundleContextType>(
    () => ({
      supportedAnnotationTypes,
      defaultAnnotationTypes,
      selectedAnnotationOptions: getAnnotationOptionsFromAnnotationTypes(
        queriedAnnotationWithoutAlertType,
      ),
      timeSeriesAnnotations: timeSeriesAnnotations ?? undefined,
      getCurrentSupportedAnnotations,
      onAnnotationOptionsChange,
      updateTimeSeriesAnnotationsGivenChartContext,
    }),
    [
      supportedAnnotationTypes,
      defaultAnnotationTypes,
      queriedAnnotationWithoutAlertType,
      timeSeriesAnnotations,
      getCurrentSupportedAnnotations,
      onAnnotationOptionsChange,
      updateTimeSeriesAnnotationsGivenChartContext,
    ],
  );

  // Select the correct context provider depending on the resource type.
  // TODO(DSA-5283): Merge ExperienceAnalyticsCurrentAnnotationsBundleContext and
  // CreatorAnalyticsCurrentAnnotationsBundleContext into a single provider.
  const ContextProvider = isUniverseResourceType
    ? ExperienceAnalyticsCurrentAnnotationsBundleContext.Provider
    : CreatorAnalyticsCurrentAnnotationsBundleContext.Provider;

  return <ContextProvider value={contextValue}>{children}</ContextProvider>;
};

export default PageConfigAwareAnnotationProvider;
