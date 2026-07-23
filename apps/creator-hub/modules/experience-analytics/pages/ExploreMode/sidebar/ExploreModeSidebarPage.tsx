import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnalyticsQueryParams, ChartType, DateRangeType } from '@modules/charts-generic';
import type { GenericCsvExporter } from '@modules/charts-generic';
import {
  FormattedText,
  translationKey,
  useTranslationWrapper,
  wellKnownAnalyticsTranslationNamespaces,
} from '@modules/analytics-translations';
import { ChartStyleMode } from '@rbx/analytics-ui';
import {
  UniversePerformanceRaqiClientProvider,
  useOnSelectChartRegion,
  useExperienceAnalyticsExploreModeContext,
  DefaultExploreModeDateRanges,
  getExploreModeDimensions,
  getIntersectedExploreModeDateRangesForMetrics,
  getSharedGranularityOptionsForMetrics,
  RAQIV2GenericChart,
  useCurrentChartContext,
  getExploreModeChartType,
  getTitleKeyFromPredefinedChart,
  getTooltipKeyFromPredefinedChart,
  GenericAnalyticsLayoutItem,
  RAQIV2SpecialLayoutType,
  useUniverseResource,
  computeRAQIV2SpecOverride,
  isExploreModeSupportedChartType,
  getAnalyticsMetricDisplayConfig,
  AnalyticsContextLayerInnerProvider,
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsPageSurfaceConfig,
  TExploreModeMetrics,
  TRAQIV2PredefinedChartKey,
  getExploreModeFilterOnlyDimensions,
  resolveExploreModeComputedMetricSources,
  useRAQIV2TranslationDependencies,
  useRAQIAnalyticsCurrentFilterBundle,
  getFilterBarDimensionForRAQIV2Dimension,
  isDynamicFilterDimension,
  getDimensionRenderer,
  useAnalyticsCurrentBreakdownBundle,
  useAvailableBenchmarkTypes,
  type BenchmarkOverlayType,
  type MetricLike,
  type ComputedMetric,
  type TRAQIV2NumericUIMetric,
  isComputedMetric,
  getOverlayAvailability,
  getChartTypeSupportForMetric,
  type ChartTypeMetricSupport,
  isDurationChartMetric,
  logGranularityChange,
  type ExploreModeChartType,
  type TUIGranularity,
  type ChartOverlays,
  type OverlayType,
  type OverlayDisabledReason,
  ChartOverlay,
  EXPLORE_MODE_TABLE,
  deserializeOverlayParam,
  serializeOverlayParam,
  deserializeBenchmarkType,
  serializeBenchmarkType,
  getFilterValueForDimension,
  getMetricForL7Smoothing,
} from '@modules/experience-analytics-shared';
// eslint-disable-next-line no-restricted-imports -- need direct access to query param conversion
import { uiGranularityToQueryGranularity } from '@modules/experience-analytics-shared/context/AnalyticsCurrentGranularityProvider';
import {
  AnnotationType,
  TRAQIV2BreakdownDimension,
  isSupportedBreakdownDimension,
  RAQIV2ChartResource,
} from '@modules/clients/analytics';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { urls } from '@modules/miscellaneous/common';
import { withTranslation, useTranslation } from '@rbx/intl';
import {
  RAQIV2Dimension,
  RAQIV2UIPseudoDimension,
  TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import { makeStyles, useMediaQuery } from '@rbx/ui';
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  MenuSection,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SheetRoot,
  SheetContent,
  SheetTitle,
  SheetBody,
  SheetActions,
} from '@rbx/foundation-ui';
// eslint-disable-next-line no-restricted-imports -- barrel files going away
import ExperienceAnalyticsFilterChips from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsFilterChips';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import ExploreModeSidebar from './ExploreModeSidebar';
import {
  useExploreModeSourceSelection,
  isCustomEventsQueryReady,
  customEventsMetric,
} from './useExploreModeSourceSelection';
import type { SourceFilterDimensionsByMetric } from './ExploreModeEquationBuilder';
import ExploreModeAnnotationsControl from './components/ExploreModeAnnotationsControl';
import ExploreModeChartEmptyState from './components/ExploreModeChartEmptyState';
import ExploreModeDateRangeControl from './components/ExploreModeDateRangeControl';
import ExplorePageFilterButton from './components/ExploreFilterButton';
import ExploreModeShareButton from './components/ExploreModeShareButton';
import { type OverlayOption } from './ExploreModeOverlaysControl';
import { type SmoothingOption } from './ExploreModeSmoothingControl';

const overlayDiscriminantToOption: Record<OverlayType, OverlayOption> = {
  benchmark: 'benchmarks',
  comparison: 'period-over-period',
  'trend-line': 'trend-line',
};

const overlayOptionToDiscriminant = Object.fromEntries(
  Object.entries(overlayDiscriminantToOption).map(([k, v]) => [v, k]),
) as Partial<Record<OverlayOption, OverlayType>>;

const useStyles = makeStyles()(() => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - var(--app-header-height, 56px))',
  },
  headerRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '12px',
  },
  headerActions: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  subtitle: {
    fontSize: '14px',
    lineHeight: '20px',
    color: 'var(--content-muted)',
    margin: 0,
    padding: 0,
  },
  layout: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  chartArea: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: '300px',
    overflow: 'auto',
  },
  topBar: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: '16px 24px',
    flexWrap: 'wrap',
    gap: '16px',
    borderBottom: '1px solid var(--stroke-default)',
  },
  topBarLeft: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: '16px',
  },
  topBarRight: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: '16px',
  },
  topBarDropdownWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    width: '220px',
  },
  filterChipsRow: {
    padding: '8px 24px 0',
  },
  chartBody: {
    flex: 1,
    padding: '0 24px 24px',
    minHeight: 0,
  },
  mobileChartArea: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    overflow: 'auto',
    width: '100%',
  },
  mobileSheet: {
    width: '100%',
    maxWidth: '100% !important',
  },
  sheetDoneButton: {
    width: '100%',
  },
}));

const exploreSurfaceAnnotationOptions: AnalyticsPageConfigAnnotationOptions = {
  supportedAnnotationTypes: [
    AnnotationType.PlaceIcon,
    AnnotationType.PlaceThumbnail,
    AnnotationType.PlaceVideo,
    AnnotationType.PlaceVersion,
    AnnotationType.Benchmark,
    AnnotationType.LiveEvent,
    AnnotationType.CustomMatchmaking,
    AnnotationType.RetentionCorhortDisclaimer,
    AnnotationType.ConfigVersion,
    AnnotationType.Announcement,
  ],
  defaultAnnotationTypes: [],
  showAnnotationsControl: true,
};

const chartTypeOrder: readonly ExploreModeChartType[] = [
  ChartType.Spline,
  ChartType.DurationSpline,
  ChartType.DurationArea,
  ChartType.Bar,
  ChartType.Column,
  ChartType.Pie,
  EXPLORE_MODE_TABLE,
];

const customEventSidebarDimensions: readonly TRAQIV2Dimension[] = [
  RAQIV2Dimension.CustomEventName,
  RAQIV2UIPseudoDimension.AggregationType,
];
export type SidebarPageContentProps = {
  metric: TExploreModeMetrics | null;
  setMetric: (metric: TExploreModeMetrics | null) => void;
  executionMetric: MetricLike<TRAQIV2NumericUIMetric> | null;
  computedMetric: ComputedMetric<TRAQIV2NumericUIMetric> | null;
  setComputedMetric: (cm: ComputedMetric<TRAQIV2NumericUIMetric> | null) => void;
  displayMetric: TExploreModeMetrics | null;
  displaySourceMetrics: readonly TExploreModeMetrics[];
  hasUnsupportedSourceMetrics: boolean;
  hasSharedDateRanges: boolean;
  preset: TRAQIV2PredefinedChartKey | null;
  dimensions: readonly TRAQIV2BreakdownDimension[];
  raqiDimensions: readonly TRAQIV2Dimension[];
  resource: RAQIV2ChartResource;
  dateRangeOptions: DateRangeType[];
  availableMetrics: TExploreModeMetrics[];
  sourceFilterDimensionsByMetric?: SourceFilterDimensionsByMetric;
  priorUri: string | null;
  l7SmoothingFromUrl?: boolean;
};

export const SidebarPageContent: FC<SidebarPageContentProps> = ({
  metric,
  setMetric,
  executionMetric,
  computedMetric,
  setComputedMetric,
  displayMetric,
  displaySourceMetrics,
  hasUnsupportedSourceMetrics,
  hasSharedDateRanges,
  preset,
  dimensions,
  raqiDimensions,
  resource,
  dateRangeOptions,
  availableMetrics,
  sourceFilterDimensionsByMetric,
  priorUri,
  l7SmoothingFromUrl = false,
}) => {
  const {
    isExploreModeComputedMetricsEnabled,
    isExploreModeChartTypeSelectionEnabled,
    isExploreModeTableChartTypeEnabled,
    isExploreModeL7SmoothingEnabled,
    isExploreModeTrendLineOverlayEnabled,
  } = useFeatureFlagsForNamespace(
    [
      'isExploreModeComputedMetricsEnabled',
      'isExploreModeChartTypeSelectionEnabled',
      'isExploreModeTableChartTypeEnabled',
      'isExploreModeL7SmoothingEnabled',
      'isExploreModeTrendLineOverlayEnabled',
    ],
    FeatureFlagNamespace.Analytics,
  );
  const isComputedMetricsFeatureEnabled = !!isExploreModeComputedMetricsEnabled;
  const showChartTypeSelector = !!isExploreModeChartTypeSelectionEnabled;
  const showSmoothingControl = !!isExploreModeL7SmoothingEnabled;
  const showTrendLineOverlayOption = !!isExploreModeTrendLineOverlayEnabled;

  const {
    classes: {
      root,
      headerRow,
      headerActions,
      subtitle,
      layout,
      chartArea,
      topBar,
      topBarLeft,
      topBarRight,
      topBarDropdownWrapper,
      filterChipsRow,
      chartBody,
      mobileChartArea,
      mobileSheet,
      sheetDoneButton,
    },
  } = useStyles();

  const isMobile = useMediaQuery('(max-width: 600px)');
  const [isConfigureSheetOpen, setIsConfigureSheetOpen] = useState(false);

  const { translate } = useRAQIV2TranslationDependencies();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const configureLabel = tPendingTranslation(
    'Configure',
    'Button label to open the chart configuration sheet on mobile.',
    translationKey('Action.ExploreMode.Configure', TranslationNamespace.Analytics),
  );
  const doneLabel = tPendingTranslation(
    'Done',
    'Button label to close the chart configuration sheet on mobile.',
    translationKey('Action.ExploreMode.Done', TranslationNamespace.Analytics),
  );
  const configureSheetCloseLabel = tPendingTranslation(
    'Close configuration',
    'Aria label for closing the chart configuration sheet.',
    translationKey('Action.ExploreMode.CloseConfiguration', TranslationNamespace.Analytics),
  );
  const configureSheetTitle = tPendingTranslation(
    'Configure',
    'Title for the mobile chart configuration sheet.',
    translationKey('Heading.ExploreMode.ConfigureSheet', TranslationNamespace.Analytics),
  );
  const untitledFormulaLabel = tPendingTranslation(
    '(Untitled formula)',
    'Default name shown for a formula that has not been named yet.',
    translationKey('Label.ExploreMode.UntitledFormula', TranslationNamespace.Analytics),
  );
  const exploreSubtitleLabel = tPendingTranslation(
    'See advanced slice-and-dice for any metric',
    'Subtitle text describing the explore mode page functionality.',
    translationKey('Description.ExploreMode.Subtitle', TranslationNamespace.Analytics),
  );
  const emptyStateTitleLabel = tPendingTranslation(
    '(empty)',
    'Title shown in the empty state when no chart data is available.',
    translationKey('Label.ExploreMode.EmptyState.Title', TranslationNamespace.Analytics),
  ) as FormattedText;
  const emptyStateSubtitleLabel = tPendingTranslation(
    'Average over selected time period',
    'Subtitle shown in the empty state describing the default aggregation method.',
    translationKey('Label.ExploreMode.EmptyState.Subtitle', TranslationNamespace.Analytics),
  ) as FormattedText;
  const shareLabel = tPendingTranslation(
    'Share',
    'Button label to share the current explore mode view.',
    translationKey('Action.ExploreMode.Share', TranslationNamespace.Analytics),
  );
  const closeLabel = tPendingTranslation(
    'Close',
    'Button label to close the explore mode view.',
    translationKey('Action.ExploreMode.Close', TranslationNamespace.Analytics),
  );
  const downloadCsvLabel = tPendingTranslation(
    'Download CSV',
    'Menu item label to download chart data as a CSV file.',
    translationKey('Action.ExploreMode.DownloadCsv', TranslationNamespace.Analytics),
  );
  const moreOptionsLabel = tPendingTranslation(
    'More options',
    'Aria label for the more options menu button.',
    translationKey('Action.ExploreMode.MoreOptions', TranslationNamespace.Analytics),
  );
  const smoothingChartTitleFormat = tPendingTranslation(
    '{metricName} (7 day moving average)',
    'Chart title when L7 smoothing is enabled. {metricName} is replaced with the metric display name.',
    translationKey('Label.ExploreMode.Smoothing.ChartTitleFormat', TranslationNamespace.Analytics),
  );

  const [exporter, setExporter] = useState<GenericCsvExporter | null>(null);
  const onChartDataUpdated = useCallback(
    ({ exporter: chartExporter }: { exporter: GenericCsvExporter }) => {
      setExporter(chartExporter);
    },
    [],
  );
  useEffect(() => {
    if (!displayMetric) {
      setExporter(null);
    }
  }, [displayMetric]);
  const closeHref = useMemo(() => {
    if (priorUri) {
      return priorUri;
    }
    return urls.creatorHub.dashboard.getExperienceOverviewUrl(resource.id);
  }, [priorUri, resource.id]);

  const canExport = Boolean(displayMetric && exporter && !exporter.hasEmptyData);
  const handleExport = useCallback(() => {
    if (!exporter || exporter.hasEmptyData) return;
    exporter.download({});
  }, [exporter]);

  const onSelectChartRegion = useOnSelectChartRegion();
  const chartContext = useCurrentChartContext({
    resource,
    dimensions,
    metric: displayMetric,
    constraintMetrics: displaySourceMetrics,
  });

  const hasComputedMetricExecution = Boolean(executionMetric && isComputedMetric(executionMetric));
  const defaultChartType = useMemo(
    () =>
      displayMetric
        ? getExploreModeChartType(preset, displayMetric, chartContext, {
            isExecutingComputedMetric: hasComputedMetricExecution,
          })
        : ChartType.Spline,
    [preset, displayMetric, chartContext, hasComputedMetricExecution],
  );

  const showTableOption = !!(
    isExploreModeChartTypeSelectionEnabled && isExploreModeTableChartTypeEnabled
  );
  const isDurationMetric = displayMetric ? isDurationChartMetric(displayMetric) : false;
  const chartTypeSupport = useMemo<Record<ExploreModeChartType, ChartTypeMetricSupport>>(() => {
    const supported: ChartTypeMetricSupport = { isSupported: true };
    const entries: [ExploreModeChartType, ChartTypeMetricSupport][] = chartTypeOrder
      .filter((ct) => {
        if (ct === EXPLORE_MODE_TABLE) return showTableOption;
        if (ct === ChartType.DurationSpline || ct === ChartType.DurationArea)
          return isDurationMetric;
        if (ct === ChartType.Spline || ct === ChartType.Column || ct === ChartType.Bar)
          return !isDurationMetric;
        return true;
      })
      .map((ct) => [
        ct,
        ct === EXPLORE_MODE_TABLE || !displayMetric
          ? supported
          : getChartTypeSupportForMetric(ct as ChartType, displayMetric),
      ]);
    return Object.fromEntries(entries) as Record<ExploreModeChartType, ChartTypeMetricSupport>;
  }, [displayMetric, isDurationMetric, showTableOption]);
  const availableChartTypes = useMemo<readonly ExploreModeChartType[]>(
    () => Object.keys(chartTypeSupport) as ExploreModeChartType[],
    [chartTypeSupport],
  );
  const supportedChartTypes = useMemo<readonly ExploreModeChartType[]>(
    () =>
      (Object.entries(chartTypeSupport) as [ExploreModeChartType, ChartTypeMetricSupport][])
        .filter(([, support]) => support.isSupported)
        .map(([chartType]) => chartType),
    [chartTypeSupport],
  );

  // This second useQueryParams manages both chartType and granularity atomically,
  // bypassing AnalyticsCurrentGranularityProvider. This is necessary because using
  // separate bundles per control causes re-render loops and lost query param updates
  // when multiple useQueryParam calls fire in the same render cycle.
  // DSA-2649 will combine per-control bundles into a single proxyable bundle.
  const exploreModeQueryKeys = useMemo(
    () => [AnalyticsQueryParams.ChartType, AnalyticsQueryParams.Granularity] as const,
    [],
  );
  const [{ [AnalyticsQueryParams.ChartType]: queryChartType }, setExploreModeParams] =
    useQueryParams(exploreModeQueryKeys);

  const chartTypeOverride = useMemo<ExploreModeChartType | null>(() => {
    if (typeof queryChartType !== 'string') return null;
    return availableChartTypes.find((chartType) => chartType === queryChartType) ?? null;
  }, [queryChartType, availableChartTypes]);

  const setChartTypeOverride = useCallback(
    (type: ExploreModeChartType | null) => {
      setExploreModeParams({ [AnalyticsQueryParams.ChartType]: type });
    },
    [setExploreModeParams],
  );

  const { unifiedLogger } = useUnifiedLoggerProvider();
  const setChartTypeWithGranularity = useCallback(
    (type: ExploreModeChartType | null, granularity: TUIGranularity) => {
      const queryGranularity = uiGranularityToQueryGranularity[granularity];
      setExploreModeParams({
        [AnalyticsQueryParams.ChartType]: type,
        [AnalyticsQueryParams.Granularity]: queryGranularity,
      });
      logGranularityChange(unifiedLogger, { newGranularity: queryGranularity });
    },
    [setExploreModeParams, unifiedLogger],
  );

  useEffect(() => {
    if (chartTypeOverride && !supportedChartTypes.includes(chartTypeOverride)) {
      setExploreModeParams({ [AnalyticsQueryParams.ChartType]: null }, { skipHistory: true });
    }
  }, [chartTypeOverride, supportedChartTypes, setExploreModeParams]);

  const selectedChartType: ExploreModeChartType = showChartTypeSelector
    ? (chartTypeOverride ?? defaultChartType)
    : defaultChartType;

  const overlayParamKeys = useMemo(
    () => [AnalyticsQueryParams.Overlays, AnalyticsQueryParams.OverlayBenchmarkType] as const,
    [],
  );
  const [overlayParams, setOverlayParams] = useQueryParams(overlayParamKeys);

  const benchmarkOverlayType: BenchmarkOverlayType | null = useMemo(
    () => deserializeBenchmarkType(overlayParams[AnalyticsQueryParams.OverlayBenchmarkType]),
    [overlayParams],
  );
  const [operationsEnabled, setOperationsEnabled] = useState<boolean>(
    () => isComputedMetricsFeatureEnabled && computedMetric !== null,
  );
  const [smoothingOption, setSmoothingOption] = useState<SmoothingOption>(() => {
    if (showSmoothingControl && l7SmoothingFromUrl) return 'l7-moving-average';
    if (showSmoothingControl && computedMetric?.l7Smoothing) return 'l7-moving-average';
    return 'none';
  });
  const isL7SmoothingEnabled = showSmoothingControl && smoothingOption === 'l7-moving-average';
  const computedMetricQueryCacheRef = useRef<{
    signature: string | null;
    metric: ComputedMetric<TRAQIV2NumericUIMetric> | null;
    displayName: string | undefined;
  }>({
    signature: null,
    metric: null,
    displayName: undefined,
  });
  const activeMetricForQuery = useMemo(() => {
    if (isComputedMetricsFeatureEnabled && operationsEnabled && !computedMetric) {
      return null;
    }
    if (!executionMetric) {
      return null;
    }
    if (!isComputedMetric(executionMetric)) {
      return executionMetric;
    }

    const computedMetricForQuery: ComputedMetric<TRAQIV2NumericUIMetric> = {
      ...executionMetric,
      name: undefined,
    };
    const signature = JSON.stringify(computedMetricForQuery);
    const cached = computedMetricQueryCacheRef.current;
    if (cached.signature === signature && cached.metric) {
      cached.displayName = executionMetric.name?.trim() || undefined;
      return cached.metric;
    }

    computedMetricQueryCacheRef.current = {
      signature,
      metric: computedMetricForQuery,
      displayName: executionMetric.name?.trim() || undefined,
    };
    return computedMetricForQuery;
  }, [computedMetric, executionMetric, operationsEnabled, isComputedMetricsFeatureEnabled]);
  useEffect(() => {
    if (!isComputedMetricsFeatureEnabled) {
      setOperationsEnabled(false);
      return;
    }
    if (computedMetric) {
      setOperationsEnabled(true);
    }
  }, [computedMetric, isComputedMetricsFeatureEnabled]);
  const computedMetricChartTitleLabel = useMemo(() => {
    if (!activeMetricForQuery || !isComputedMetric(activeMetricForQuery)) {
      return undefined;
    }

    const displayName =
      executionMetric && isComputedMetric(executionMetric)
        ? executionMetric.name?.trim()
        : undefined;
    return displayName || activeMetricForQuery.formula;
  }, [activeMetricForQuery, executionMetric]);
  const isActiveMetricComputed = useMemo(
    () => Boolean(activeMetricForQuery && isComputedMetric(activeMetricForQuery)),
    [activeMetricForQuery],
  );
  const hasSharedGranularities = useMemo(() => {
    if (!activeMetricForQuery || !isComputedMetric(activeMetricForQuery)) {
      return true;
    }
    if (!displaySourceMetrics.length || hasUnsupportedSourceMetrics) {
      return false;
    }
    return (
      getSharedGranularityOptionsForMetrics({
        metrics: displaySourceMetrics,
        startDate: chartContext.timeSpec.startTime,
        endDate: chartContext.timeSpec.endTime,
        breakdown: chartContext.breakdown,
      }).length > 0
    );
  }, [
    activeMetricForQuery,
    chartContext.breakdown,
    chartContext.timeSpec.endTime,
    chartContext.timeSpec.startTime,
    displaySourceMetrics,
    hasUnsupportedSourceMetrics,
  ]);
  const isComputedMetricConstraintsIncompatible = useMemo(
    () =>
      Boolean(
        activeMetricForQuery &&
          isComputedMetric(activeMetricForQuery) &&
          (hasUnsupportedSourceMetrics || !hasSharedDateRanges || !hasSharedGranularities),
      ),
    [
      activeMetricForQuery,
      hasSharedDateRanges,
      hasSharedGranularities,
      hasUnsupportedSourceMetrics,
    ],
  );

  const effectiveRaqiDimensions = useMemo(() => {
    let dims: TRAQIV2Dimension[] = [...raqiDimensions];
    if (operationsEnabled) {
      dims = dims.filter((dim) => {
        const filterDim = getFilterBarDimensionForRAQIV2Dimension(dim);
        return !filterDim || !isDynamicFilterDimension(filterDim);
      });
    }
    if (!dims.includes(RAQIV2Dimension.CustomEventName)) {
      dims.push(RAQIV2Dimension.CustomEventName);
    }
    if (!dims.includes(RAQIV2UIPseudoDimension.AggregationType as TRAQIV2Dimension)) {
      dims.push(RAQIV2UIPseudoDimension.AggregationType as TRAQIV2Dimension);
    }
    return dims;
  }, [raqiDimensions, operationsEnabled]);

  const { filters, onFiltersChange } = useRAQIAnalyticsCurrentFilterBundle(effectiveRaqiDimensions);

  const { sourceFilter, isCustomEventsMode, filteredMetrics, handleSourceChange } =
    useExploreModeSourceSelection({
      metric,
      setMetric,
      availableMetrics,
      translate,
      filters,
      onFiltersChange,
    });

  const selectedCustomEventNameFilter = useMemo(
    () => getFilterValueForDimension(filters, RAQIV2Dimension.CustomEventName, null),
    [filters],
  );
  const previousCustomEventNameFilterRef = useRef<string | null>(selectedCustomEventNameFilter);

  useEffect(() => {
    const previousCustomEventNameFilter = previousCustomEventNameFilterRef.current;
    const hasCustomEventNameFilterChanged =
      previousCustomEventNameFilter !== selectedCustomEventNameFilter;

    previousCustomEventNameFilterRef.current = selectedCustomEventNameFilter;

    if (
      !isCustomEventsMode ||
      !hasCustomEventNameFilterChanged ||
      selectedCustomEventNameFilter === null ||
      metric === customEventsMetric
    ) {
      return;
    }

    setMetric(customEventsMetric);
  }, [isCustomEventsMode, metric, selectedCustomEventNameFilter, setMetric]);

  const isCustomEventsReady = useMemo(
    () => isCustomEventsQueryReady(isCustomEventsMode, metric, filters),
    [isCustomEventsMode, metric, filters],
  );

  const resolvedMetricForQuery = useMemo(() => {
    if (!activeMetricForQuery || isComputedMetricConstraintsIncompatible || !isCustomEventsReady) {
      return null;
    }
    return isComputedMetric(activeMetricForQuery)
      ? activeMetricForQuery
      : getMetricForL7Smoothing(activeMetricForQuery, isL7SmoothingEnabled);
  }, [
    activeMetricForQuery,
    isComputedMetricConstraintsIncompatible,
    isL7SmoothingEnabled,
    isCustomEventsReady,
  ]);

  const benchmarkEligibilitySpec = useMemo(() => {
    if (isActiveMetricComputed || !resolvedMetricForQuery) {
      return null;
    }
    const baseSpec = { ...chartContext, metric: resolvedMetricForQuery };
    const exploreModeSpecOverride = displayMetric
      ? getAnalyticsMetricDisplayConfig(displayMetric).exploreModeSpecOverride
      : undefined;
    return exploreModeSpecOverride
      ? computeRAQIV2SpecOverride(baseSpec, exploreModeSpecOverride)
      : baseSpec;
  }, [chartContext, displayMetric, isActiveMetricComputed, resolvedMetricForQuery]);

  const overlayAvailability = useMemo(
    () =>
      getOverlayAvailability(benchmarkEligibilitySpec, {
        isComputedMetric: isActiveMetricComputed,
        isTrendLineEnabled: showTrendLineOverlayOption,
        hasBreakdown: Boolean(chartContext.breakdown?.length),
        chartType: selectedChartType,
      }),
    [
      benchmarkEligibilitySpec,
      isActiveMetricComputed,
      showTrendLineOverlayOption,
      chartContext.breakdown?.length,
      selectedChartType,
    ],
  );

  const benchmarkSpec = overlayAvailability.benchmark.applicable ? benchmarkEligibilitySpec : null;
  const {
    availableBenchmarkTypes,
    isLoading: isBenchmarksLoading,
    hasAnyBenchmarkData,
  } = useAvailableBenchmarkTypes(benchmarkSpec);

  const effectiveOverlayAvailability = useMemo(() => {
    if (
      overlayAvailability.benchmark.applicable &&
      !overlayAvailability.benchmark.disabled &&
      !isBenchmarksLoading &&
      !hasAnyBenchmarkData
    ) {
      return {
        ...overlayAvailability,
        benchmark: {
          applicable: true,
          disabled: true,
          reason: 'noBenchmarkData' as OverlayDisabledReason,
        },
      };
    }
    return overlayAvailability;
  }, [overlayAvailability, isBenchmarksLoading, hasAnyBenchmarkData]);

  // Derive overlay selection directly from URL params (single source of truth).
  // useQueryParams returns a setter whose identity changes on every URL update
  // (it closes over `router` which Next.js recreates per-render on route change).
  // Stashing it in a ref avoids infinite re-fire of effects and keeps callbacks stable.
  const setOverlayParamsRef = useRef(setOverlayParams);
  setOverlayParamsRef.current = setOverlayParams;

  const overlayOptionRaw: OverlayOption = useMemo(() => {
    const deserialized = deserializeOverlayParam(overlayParams[AnalyticsQueryParams.Overlays]);
    if (deserialized === undefined || deserialized === 'none') {
      return 'none';
    }
    return overlayDiscriminantToOption[deserialized] ?? 'none';
  }, [overlayParams]);

  const setOverlayOption = useCallback(
    (option: OverlayOption) => {
      setOverlayParamsRef.current({
        [AnalyticsQueryParams.Overlays]: serializeOverlayParam(overlayOptionToDiscriminant[option]),
        [AnalyticsQueryParams.OverlayBenchmarkType]:
          option !== 'benchmarks' ? null : serializeBenchmarkType(benchmarkOverlayType),
      });
    },
    [benchmarkOverlayType],
  );

  const setBenchmarkOverlayTypeWithUrl = useCallback((type: BenchmarkOverlayType | null) => {
    setOverlayParamsRef.current({
      [AnalyticsQueryParams.OverlayBenchmarkType]: serializeBenchmarkType(type),
    });
  }, []);

  const overlayOption: OverlayOption = useMemo(() => {
    if (overlayOptionRaw === 'none') return 'none';
    const statusMap = {
      benchmarks: effectiveOverlayAvailability.benchmark,
      'period-over-period': effectiveOverlayAvailability.comparison,
      'trend-line': effectiveOverlayAvailability['trend-line'],
    } as Record<string, (typeof effectiveOverlayAvailability)[OverlayType] | undefined>;
    const status = statusMap[overlayOptionRaw];
    if (status && (!status.applicable || status.disabled)) return 'none';
    return overlayOptionRaw;
  }, [overlayOptionRaw, effectiveOverlayAvailability]);

  const overlayChartOptions: ChartOverlays = useMemo(() => {
    switch (overlayOption) {
      case 'benchmarks':
        return [ChartOverlay.benchmark(benchmarkOverlayType ?? undefined)];
      case 'period-over-period':
        return [ChartOverlay.comparison()];
      case 'trend-line':
        return [ChartOverlay.trendLine()];
      case 'none':
      default:
        return [];
    }
  }, [benchmarkOverlayType, overlayOption]);
  const chartContextWithPresentation = useMemo(
    () => ({
      ...chartContext,
      overlays: overlayChartOptions,
    }),
    [chartContext, overlayChartOptions],
  );

  const setComputedMetricWithSmoothing = useCallback(
    (nextComputedMetric: ComputedMetric<TRAQIV2NumericUIMetric> | null) => {
      if (!nextComputedMetric) {
        setComputedMetric(null);
        return;
      }
      setComputedMetric({
        ...nextComputedMetric,
        l7Smoothing: isL7SmoothingEnabled,
      });
    },
    [isL7SmoothingEnabled, setComputedMetric],
  );

  useEffect(() => {
    if (!showSmoothingControl) {
      setSmoothingOption('none');
      return;
    }
    if (!computedMetric) {
      return;
    }
    const nextOption = computedMetric.l7Smoothing ? 'l7-moving-average' : 'none';
    setSmoothingOption((previousOption) =>
      previousOption === nextOption ? previousOption : nextOption,
    );
  }, [computedMetric, computedMetric?.l7Smoothing, showSmoothingControl]);

  useEffect(() => {
    if (!computedMetric) {
      return;
    }
    const nextSmoothing = showSmoothingControl ? isL7SmoothingEnabled : false;
    const computedMetricHasSmoothing = computedMetric.l7Smoothing ?? false;
    if (computedMetricHasSmoothing === nextSmoothing) {
      return;
    }
    setComputedMetric({
      ...computedMetric,
      l7Smoothing: nextSmoothing,
    });
  }, [computedMetric, isL7SmoothingEnabled, setComputedMetric, showSmoothingControl]);

  const chartSpec = useMemo(() => {
    if (!resolvedMetricForQuery) {
      return null;
    }
    const exploreModeSpecOverride =
      !isComputedMetric(resolvedMetricForQuery) && displayMetric
        ? getAnalyticsMetricDisplayConfig(displayMetric).exploreModeSpecOverride
        : undefined;
    return {
      ...(exploreModeSpecOverride
        ? computeRAQIV2SpecOverride(chartContextWithPresentation, exploreModeSpecOverride)
        : chartContextWithPresentation),
      metric: resolvedMetricForQuery,
    };
  }, [resolvedMetricForQuery, chartContextWithPresentation, displayMetric]);

  useEffect(() => {
    if (overlayOption !== 'benchmarks' || benchmarkOverlayType === null) {
      return;
    }
    if (!availableBenchmarkTypes.includes(benchmarkOverlayType)) {
      setOverlayParamsRef.current({
        [AnalyticsQueryParams.OverlayBenchmarkType]: null,
      });
    }
  }, [availableBenchmarkTypes, overlayOption, benchmarkOverlayType]);

  const chart = useMemo(() => {
    if (!chartSpec || !displayMetric) return null;

    const { localizedName, localizedDescription } = getAnalyticsMetricDisplayConfig(displayMetric);
    const titleKey = preset ? getTitleKeyFromPredefinedChart(preset) : localizedName;
    const tooltipKey = preset ? getTooltipKeyFromPredefinedChart(preset) : localizedDescription;

    if (!isExploreModeSupportedChartType(selectedChartType)) {
      return null;
    }

    const computedMetricChart = isComputedMetric(chartSpec.metric) ? chartSpec.metric : null;
    const chartTitleLabel = computedMetricChart
      ? computedMetricChartTitleLabel || untitledFormulaLabel
      : undefined;
    const chartDefinitionTooltipKey = computedMetricChart ? undefined : tooltipKey;

    const isUserDefinedComputedMetric = computedMetricChart && computedMetric !== null;
    const effectiveTitleLabel =
      isL7SmoothingEnabled && !isUserDefinedComputedMetric
        ? String(smoothingChartTitleFormat).replace('{metricName}', String(translate(titleKey)))
        : chartTitleLabel;

    return (
      <GenericAnalyticsLayoutItem layout={RAQIV2SpecialLayoutType.FullWidthLayout}>
        <RAQIV2GenericChart
          titleLabel={effectiveTitleLabel}
          titleKey={effectiveTitleLabel ? undefined : titleKey}
          definitionTooltipKey={chartDefinitionTooltipKey}
          spec={chartSpec}
          chartKeyOrConfig={preset}
          onSelectChartRegion={onSelectChartRegion}
          chartType={selectedChartType}
          chartStyleMode={ChartStyleMode.Normal}
          chartHeight={450}
          overlays={overlayChartOptions}
          onChartDataUpdated={onChartDataUpdated}
        />
      </GenericAnalyticsLayoutItem>
    );
  }, [
    selectedChartType,
    chartSpec,
    overlayChartOptions,
    onSelectChartRegion,
    onChartDataUpdated,
    displayMetric,
    preset,
    untitledFormulaLabel,
    computedMetricChartTitleLabel,
    computedMetric,
    isL7SmoothingEnabled,
    smoothingChartTitleFormat,
    translate,
  ]);

  const breakdownDimensions = useMemo(
    () =>
      dimensions.filter(
        (dimension): dimension is TRAQIV2BreakdownDimension =>
          isSupportedBreakdownDimension(dimension) &&
          !getExploreModeFilterOnlyDimensions(selectedChartType).includes(dimension),
      ),
    [dimensions, selectedChartType],
  );

  const { breakdown, setBreakdown } = useAnalyticsCurrentBreakdownBundle(breakdownDimensions);

  const noneLabel = (translate(translationKey('Label.None', TranslationNamespace.Analytics)) ||
    'None') as FormattedText;
  const getBreakdownLabel = useCallback(
    (dimension: TRAQIV2BreakdownDimension): FormattedText =>
      (translate(getDimensionRenderer(dimension).name) || dimension) as FormattedText,
    [translate],
  );

  const filterDrawerDimensions = useMemo(() => {
    const allFilterDims = raqiDimensions
      .filter(
        (dim) =>
          dim !== RAQIV2Dimension.CustomEventName &&
          dim !== RAQIV2UIPseudoDimension.AggregationType,
      )
      .flatMap((dim) => getFilterBarDimensionForRAQIV2Dimension(dim) ?? []);

    if (operationsEnabled) {
      return allFilterDims.filter((dim) => !isDynamicFilterDimension(dim));
    }
    return allFilterDims;
  }, [raqiDimensions, operationsEnabled]);

  return (
    <div className={root}>
      <div className={headerRow}>
        <p className={subtitle}>{exploreSubtitleLabel}</p>
        <div className={headerActions}>
          <ExploreModeShareButton label={shareLabel} />
          <Button variant='Standard' size='Small' as='a' href={closeHref}>
            {closeLabel}
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <IconButton
                variant='Utility'
                size='Small'
                icon='icon-filled-three-dots-horizontal'
                ariaLabel={moreOptionsLabel as string}
              />
            </PopoverTrigger>
            <PopoverContent side='bottom' align='end' ariaLabel={moreOptionsLabel as string}>
              <Menu size='Medium'>
                <MenuSection>
                  <MenuItem
                    value='download-csv'
                    title={downloadCsvLabel as string}
                    disabled={!canExport}
                    onSelect={handleExport}
                  />
                </MenuSection>
              </Menu>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {isMobile ? (
        <div className={layout}>
          <div className={mobileChartArea}>
            <div className={topBar}>
              <div className={topBarLeft}>
                <ExploreModeDateRangeControl dateRangeOptions={dateRangeOptions} />
                {filterDrawerDimensions.length > 0 && (
                  <ExplorePageFilterButton
                    resource={resource}
                    dimensions={filterDrawerDimensions}
                    filters={filters}
                    onFiltersChange={onFiltersChange}
                  />
                )}
              </div>
              <div className={topBarRight}>
                <ExploreModeAnnotationsControl
                  resourceType={resource.type}
                  className={topBarDropdownWrapper}
                />
                <Button
                  variant='Standard'
                  size='Medium'
                  onClick={() => setIsConfigureSheetOpen(true)}>
                  {configureLabel}
                </Button>
              </div>
            </div>

            {filterDrawerDimensions.length > 0 && (
              <div className={filterChipsRow}>
                <ExperienceAnalyticsFilterChips
                  dimensions={filterDrawerDimensions}
                  knownRAQIDimensionsShownElsewhere={customEventSidebarDimensions}
                />
              </div>
            )}

            <div className={chartBody}>
              {chart ?? (
                <ExploreModeChartEmptyState
                  titleLabel={emptyStateTitleLabel}
                  subtitleLabel={emptyStateSubtitleLabel}
                />
              )}
            </div>
          </div>

          <SheetRoot open={isConfigureSheetOpen} onOpenChange={setIsConfigureSheetOpen}>
            <SheetContent
              largeScreenVariant='side'
              closeLabel={configureSheetCloseLabel as string}
              mobilePortraitClassName={mobileSheet}>
              <SheetTitle>{configureSheetTitle}</SheetTitle>
              <SheetBody>
                <ExploreModeSidebar
                  variant='sheet'
                  metric={metric}
                  setMetric={setMetric}
                  computedMetric={computedMetric}
                  setComputedMetric={setComputedMetricWithSmoothing}
                  availableMetrics={availableMetrics}
                  constraintMetrics={displaySourceMetrics}
                  sourceFilter={sourceFilter}
                  filteredMetrics={filteredMetrics}
                  onSourceChange={handleSourceChange}
                  chartType={selectedChartType}
                  onChartTypeChange={setChartTypeOverride}
                  onChartTypeWithGranularityChange={setChartTypeWithGranularity}
                  overlayOption={overlayOption}
                  onOverlayChange={setOverlayOption}
                  benchmarkType={benchmarkOverlayType}
                  onBenchmarkTypeChange={setBenchmarkOverlayTypeWithUrl}
                  availableBenchmarkTypes={availableBenchmarkTypes}
                  smoothingOption={smoothingOption}
                  onSmoothingChange={setSmoothingOption}
                  overlayAvailability={effectiveOverlayAvailability}
                  chartContext={chartContextWithPresentation}
                  isComputedMetricsFeatureEnabled={isComputedMetricsFeatureEnabled}
                  operationsEnabled={operationsEnabled}
                  onOperationsEnabledChange={setOperationsEnabled}
                  showChartTypeSelector={showChartTypeSelector}
                  availableChartTypes={availableChartTypes}
                  supportedChartTypes={supportedChartTypes}
                  chartTypeSupport={chartTypeSupport}
                  showSmoothingControl={showSmoothingControl}
                  sourceFilterResource={resource}
                  sourceFilterDimensionsByMetric={sourceFilterDimensionsByMetric}
                  breakdownDimensions={breakdownDimensions}
                  breakdown={breakdown}
                  onBreakdownChange={setBreakdown}
                  noBreakdownLabel={noneLabel}
                  getBreakdownLabel={getBreakdownLabel}
                  {...(isCustomEventsMode
                    ? {
                        isCustomEventsMode: true as const,
                        customEventResource: resource,
                        filters,
                        onFiltersChange,
                      }
                    : { isCustomEventsMode: false as const })}
                />
              </SheetBody>
              <SheetActions>
                <Button
                  variant='Emphasis'
                  size='Medium'
                  className={sheetDoneButton}
                  onClick={() => setIsConfigureSheetOpen(false)}>
                  {doneLabel}
                </Button>
              </SheetActions>
            </SheetContent>
          </SheetRoot>
        </div>
      ) : (
        <div className={layout}>
          <ExploreModeSidebar
            metric={metric}
            setMetric={setMetric}
            computedMetric={computedMetric}
            setComputedMetric={setComputedMetricWithSmoothing}
            availableMetrics={availableMetrics}
            constraintMetrics={displaySourceMetrics}
            sourceFilter={sourceFilter}
            filteredMetrics={filteredMetrics}
            onSourceChange={handleSourceChange}
            chartType={selectedChartType}
            onChartTypeChange={setChartTypeOverride}
            onChartTypeWithGranularityChange={setChartTypeWithGranularity}
            overlayOption={overlayOption}
            onOverlayChange={setOverlayOption}
            benchmarkType={benchmarkOverlayType}
            onBenchmarkTypeChange={setBenchmarkOverlayTypeWithUrl}
            availableBenchmarkTypes={availableBenchmarkTypes}
            smoothingOption={smoothingOption}
            onSmoothingChange={setSmoothingOption}
            overlayAvailability={effectiveOverlayAvailability}
            chartContext={chartContextWithPresentation}
            isComputedMetricsFeatureEnabled={isComputedMetricsFeatureEnabled}
            operationsEnabled={operationsEnabled}
            onOperationsEnabledChange={setOperationsEnabled}
            showChartTypeSelector={showChartTypeSelector}
            availableChartTypes={availableChartTypes}
            supportedChartTypes={supportedChartTypes}
            chartTypeSupport={chartTypeSupport}
            showSmoothingControl={showSmoothingControl}
            sourceFilterResource={resource}
            sourceFilterDimensionsByMetric={sourceFilterDimensionsByMetric}
            breakdownDimensions={breakdownDimensions}
            breakdown={breakdown}
            onBreakdownChange={setBreakdown}
            noBreakdownLabel={noneLabel}
            getBreakdownLabel={getBreakdownLabel}
            {...(isCustomEventsMode
              ? {
                  isCustomEventsMode: true as const,
                  customEventResource: resource,
                  filters,
                  onFiltersChange,
                }
              : { isCustomEventsMode: false as const })}
          />

          <div className={chartArea}>
            <div className={topBar}>
              <div className={topBarLeft}>
                <ExploreModeDateRangeControl dateRangeOptions={dateRangeOptions} />
                {filterDrawerDimensions.length > 0 && (
                  <ExplorePageFilterButton
                    resource={resource}
                    dimensions={filterDrawerDimensions}
                    filters={filters}
                    onFiltersChange={onFiltersChange}
                  />
                )}
              </div>
              <div className={topBarRight}>
                <ExploreModeAnnotationsControl
                  resourceType={resource.type}
                  className={topBarDropdownWrapper}
                />
              </div>
            </div>

            {filterDrawerDimensions.length > 0 && (
              <div className={filterChipsRow}>
                <ExperienceAnalyticsFilterChips
                  dimensions={filterDrawerDimensions}
                  knownRAQIDimensionsShownElsewhere={customEventSidebarDimensions}
                />
              </div>
            )}

            <div className={chartBody}>
              {chart ?? (
                <ExploreModeChartEmptyState
                  titleLabel={emptyStateTitleLabel}
                  subtitleLabel={emptyStateSubtitleLabel}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ExploreModeSidebarPage: FC = () => {
  const {
    preset,
    metric,
    setMetric,
    computedMetric,
    setComputedMetric,
    executionMetric,
    allowedMetrics,
    priorUri,
    l7SmoothingFromUrl,
  } = useExperienceAnalyticsExploreModeContext();
  const { isExploreModeSidebarLayoutEnabled } = useFeatureFlagsForNamespace(
    'isExploreModeSidebarLayoutEnabled',
    FeatureFlagNamespace.Analytics,
  );
  const { displaySourceMetrics, hasUnsupportedSourceMetrics } = useMemo(
    () =>
      resolveExploreModeComputedMetricSources({
        executionMetric,
        fallbackMetric: metric,
        allowedMetrics,
      }),
    [allowedMetrics, executionMetric, metric],
  );
  const displayMetric = useMemo((): TExploreModeMetrics | null => {
    if (!displaySourceMetrics.length) {
      return null;
    }
    if (metric && displaySourceMetrics.some((sourceMetric) => sourceMetric === metric)) {
      return metric;
    }
    return displaySourceMetrics[0];
  }, [displaySourceMetrics, metric]);

  const dimensions = useMemo(() => {
    if (!displaySourceMetrics.length) {
      return [];
    }
    const exploreModeDimensions = getExploreModeDimensions();
    const [firstMetric, ...otherMetrics] = displaySourceMetrics;
    const firstMetricDimensions = exploreModeDimensions[firstMetric] || [];
    const metricDimensions = firstMetricDimensions.filter((dimension) =>
      otherMetrics.every((sourceMetric) =>
        (exploreModeDimensions[sourceMetric] || []).includes(dimension),
      ),
    );
    return metricDimensions;
  }, [displaySourceMetrics]);

  const intersectedDateRanges = useMemo(
    () => getIntersectedExploreModeDateRangesForMetrics(displaySourceMetrics),
    [displaySourceMetrics],
  );
  const hasSharedDateRanges = useMemo(
    () => displaySourceMetrics.length === 0 || intersectedDateRanges.length > 0,
    [displaySourceMetrics.length, intersectedDateRanges.length],
  );

  const dateRangeOptions = useMemo(() => {
    if (displaySourceMetrics.length === 0) {
      return [...DefaultExploreModeDateRanges];
    }
    if (hasSharedDateRanges) {
      return [...intersectedDateRanges];
    }
    return [DateRangeType.Last28Days];
  }, [displaySourceMetrics.length, hasSharedDateRanges, intersectedDateRanges]);

  const timeRangeOptions: AnalyticsPageConfigDateOptions = useMemo(() => {
    const supportedRanges =
      dateRangeOptions.length > 0 ? dateRangeOptions : [...DefaultExploreModeDateRanges];
    const defaultRange = supportedRanges.includes(DateRangeType.Last28Days)
      ? DateRangeType.Last28Days
      : supportedRanges[0];
    const hasDisabledSourceMetric = displaySourceMetrics.some(
      (metricToCheck) => getAnalyticsMetricDisplayConfig(metricToCheck).exploreMode?.disabled,
    );

    if (hasDisabledSourceMetric) {
      return {
        type: 'dateRange' as const,
        supportedRanges,
        defaultRange,
        excludeEndDateInRange: false,
        maxEndDateOffset: 0,
        maxStartDateOffsetDays: 365,
      };
    }
    return {
      type: 'dateRange' as const,
      supportedRanges,
      defaultRange,
      minStartDate: new Date('06/01/2023'),
    };
  }, [dateRangeOptions, displaySourceMetrics]);
  const sourceFilterDimensionsByMetric = useMemo<SourceFilterDimensionsByMetric>(() => {
    const exploreModeDimensions = getExploreModeDimensions();

    return allowedMetrics.reduce((acc, allowedMetric) => {
      const metricDimensions = exploreModeDimensions[allowedMetric] || [];
      const filterDimensions = metricDimensions
        .flatMap((dimension) => getFilterBarDimensionForRAQIV2Dimension(dimension) ?? [])
        .filter((dim) => !isDynamicFilterDimension(dim));
      if (filterDimensions.length > 0) {
        acc[allowedMetric] = filterDimensions;
      }
      return acc;
    }, {} as SourceFilterDimensionsByMetric);
  }, [allowedMetrics]);

  const resource = useUniverseResource();
  const pageConfig: CreatorAnalyticsPageSurfaceConfig = useMemo(
    () => ({
      resourceTypes: [resource.type],
      filterDimensions: dimensions,
      breakdownDimensions: dimensions,
      timeRangeOptions,
      surfaceAnnotationOptions: exploreSurfaceAnnotationOptions,
      body: [],
    }),
    [resource.type, dimensions, timeRangeOptions],
  );

  if (!isExploreModeSidebarLayoutEnabled) {
    return null;
  }

  return (
    <UniversePerformanceRaqiClientProvider>
      <AnalyticsContextLayerInnerProvider config={pageConfig}>
        <SidebarPageContent
          metric={metric}
          setMetric={setMetric}
          executionMetric={executionMetric}
          computedMetric={computedMetric}
          setComputedMetric={setComputedMetric}
          displayMetric={displayMetric}
          displaySourceMetrics={displaySourceMetrics}
          hasUnsupportedSourceMetrics={hasUnsupportedSourceMetrics}
          hasSharedDateRanges={hasSharedDateRanges}
          preset={preset}
          dimensions={dimensions}
          raqiDimensions={dimensions}
          resource={resource}
          dateRangeOptions={dateRangeOptions}
          availableMetrics={[...allowedMetrics]}
          sourceFilterDimensionsByMetric={sourceFilterDimensionsByMetric}
          priorUri={priorUri}
          l7SmoothingFromUrl={l7SmoothingFromUrl}
        />
      </AnalyticsContextLayerInnerProvider>
    </UniversePerformanceRaqiClientProvider>
  );
};

export default withTranslation(ExploreModeSidebarPage, [
  ...wellKnownAnalyticsTranslationNamespaces,
]);
