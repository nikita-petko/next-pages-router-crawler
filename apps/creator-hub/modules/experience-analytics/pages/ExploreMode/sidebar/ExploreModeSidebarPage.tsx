import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChartStyleMode } from '@rbx/analytics-ui';
import type { TRAQIV2APIMetric, TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2MetricToSupportedGranularities,
  RAQIV2UIMetric,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import { useFlag } from '@rbx/flags';
import { IconButton, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import {
  Button as MuiButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FileCopyOutlinedIcon,
  makeStyles,
  useMediaQuery,
} from '@rbx/ui';
import {
  isChartOverflowMenuEnabled as isChartOverflowMenuEnabledFlag,
  isCustomDashboardsEnabled as isCustomDashboardsEnabledFlag,
  isExperienceAlertsEnabled,
} from '@generated/flags/creatorAnalytics';
import type { FormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import wellKnownAnalyticsTranslationNamespaces from '@modules/analytics-translations/wellKnownAnalyticsTranslationNamespaces';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type GenericCsvExporter from '@modules/charts-generic/charts/exporters/GenericCsvExporter';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import CodeEditor from '@modules/charts-generic/components/CodeEditors/CodeEditor';
import CodeEditorSupportedLanguages from '@modules/charts-generic/components/CodeEditors/CodeEditorSupportedLanguages';
import { useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import { alignToUTCMidnight } from '@modules/charts-generic/utils/datePickerUtilities';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import type { ChartResource as RAQIV2ChartResource } from '@modules/clients/analytics/analyticsRAQIShared';
import { AnnotationType } from '@modules/clients/analytics/annotations/annotations';
import AnalyticsAlertClientProvider from '@modules/experience-alerts/components/AnalyticsAlertClientProvider';
import { analyticsAlertControlPlaneClient } from '@modules/experience-alerts/constants/types';
import buildChartConfiguratorTableConfig, {
  type ExploreModeTableMetricColumnInput,
} from '@modules/experience-analytics-shared/chartConfigurator/buildChartConfiguratorTableConfig';
import {
  isChartConfiguratorSupportedChartType,
  type ChartConfiguratorChartType,
} from '@modules/experience-analytics-shared/chartConfigurator/ChartConfiguratorChartTypes';
import {
  getChartConfiguratorDimensions,
  getChartConfiguratorFilterOnlyDimensions,
  getSharedChartConfiguratorDimensions,
} from '@modules/experience-analytics-shared/chartConfigurator/ChartConfiguratorDimensions';
import type { TChartConfiguratorMetrics } from '@modules/experience-analytics-shared/chartConfigurator/chartConfiguratorMetricsConfig';
import {
  useComputedMetricValidationError,
  useComputedMetricFormulaLabel,
} from '@modules/experience-analytics-shared/chartConfigurator/computedMetricValidationStore';
import {
  ChartConfiguratorChartTypeOrder,
  deriveChartTypeAvailability,
  deriveControlledChartConfiguratorMetrics,
  isChartTypeCompatibleWithGranularity,
  resolveGranularitySelection,
} from '@modules/experience-analytics-shared/chartConfigurator/controlledChartConfiguratorState';
import getSharedGranularityOptionsForMetrics from '@modules/experience-analytics-shared/chartConfigurator/getSharedGranularityOptionsForMetrics';
import isDurationChartMetric, {
  isDurationChartType,
} from '@modules/experience-analytics-shared/chartConfigurator/isDurationChartMetric';
import { getMetricForL7Smoothing } from '@modules/experience-analytics-shared/chartConfigurator/l7MetricMapping';
import { useActiveMetricForQuery } from '@modules/experience-analytics-shared/chartConfigurator/useActiveMetricForQuery';
import ChartConfigurator from '@modules/experience-analytics-shared/components/chartConfigurator/ChartConfigurator';
import type { SourceFilterDimensionsByMetric } from '@modules/experience-analytics-shared/components/chartConfigurator/ChartConfiguratorEquationBuilder';
import type { OverlayOption } from '@modules/experience-analytics-shared/components/chartConfigurator/ChartConfiguratorOverlaysControl';
import ChartConfiguratorSidebar from '@modules/experience-analytics-shared/components/chartConfigurator/ChartConfiguratorSidebar';
import {
  assertUnhandledSidebarAction,
  type ChartConfiguratorSidebarAction,
  type ChartConfiguratorSidebarProps,
} from '@modules/experience-analytics-shared/components/chartConfigurator/ChartConfiguratorSidebarModelTypes';
import type { ExploreModeTableMetricColumn } from '@modules/experience-analytics-shared/components/chartConfigurator/chartConfiguratorTableColumns';
import ChartConfiguratorDateRangeControl from '@modules/experience-analytics-shared/components/chartConfigurator/components/ChartConfiguratorDateRangeControl';
import {
  applyCollapseToFilters,
  buildSeededComputedMetricFromSimple,
  collapseComputedMetricToSimple,
  stripSourceOwnedFilters,
} from '@modules/experience-analytics-shared/components/chartConfigurator/computedMetricUrlOwnership';
import {
  useChartConfiguratorSourceSelection,
  isCustomEventsQueryReady,
  customEventsMetric,
} from '@modules/experience-analytics-shared/components/chartConfigurator/useChartConfiguratorSourceSelection';
import getDimensionRenderer from '@modules/experience-analytics-shared/components/getDimensionRenderer';
import { ChartActionsProvider } from '@modules/experience-analytics-shared/components/RAQIV2/ChartActionsContext';
import GenericAnalyticsLayoutItem from '@modules/experience-analytics-shared/components/RAQIV2/layout/GenericAnalyticsLayoutItem';
import { SourceMetricContextProvider } from '@modules/experience-analytics-shared/components/RAQIV2/layout/RAQIV2ConfigurablePageContext';
import RAQIV2GenericChart from '@modules/experience-analytics-shared/components/RAQIV2/RAQIV2GenericChart';
import AnalyticsConfigTable from '@modules/experience-analytics-shared/components/RAQIV2/table/AnalyticsConfigTable';
import getAnalyticsMetricDisplayConfig, {
  isNumericUIMetric,
} from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import { getFilterBarDimensionForRAQIV2Dimension } from '@modules/experience-analytics-shared/constants/FilterDimensionConfig';
import {
  getExploreModeChartType,
  getTitleKeyFromPredefinedChart,
  getTooltipKeyFromPredefinedChart,
  type TRAQIV2PredefinedChartKey,
} from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import { AnalyticsContextLayerInnerProvider } from '@modules/experience-analytics-shared/context/AnalyticsContextLayerProvider';
import { useAnalyticsCurrentBreakdownBundle } from '@modules/experience-analytics-shared/context/AnalyticsCurrentBreakdownBundleProvider';
import { useRAQIAnalyticsCurrentFilterBundle } from '@modules/experience-analytics-shared/context/AnalyticsCurrentFilterBundleProvider';
import { uiGranularityToQueryGranularity } from '@modules/experience-analytics-shared/context/AnalyticsCurrentGranularityProvider';
import { UniversePerformanceRaqiClientProvider } from '@modules/experience-analytics-shared/context/UniversePerformanceRaqiClientProvider';
import useCreateAlertAction from '@modules/experience-analytics-shared/createAlert/useCreateAlertAction';
import { useExperienceAnalyticsExploreModeContext } from '@modules/experience-analytics-shared/exploreMode/ExperienceAnalyticsExploreModeContextProvider';
import { ExploreModeAlertSelectionProvider } from '@modules/experience-analytics-shared/exploreMode/ExploreModeAlertSelectionContext';
import {
  getL7SmoothingDisabledReason,
  isL7SmoothingDisabled,
} from '@modules/experience-analytics-shared/exploreMode/l7SmoothingEligibility';
import useCurrentChartContext from '@modules/experience-analytics-shared/exploreMode/useCurrentChartContext';
import useAvailableBenchmarkTypes from '@modules/experience-analytics-shared/hooks/useAvailableBenchmarkTypes';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useOnSelectChartRegion from '@modules/experience-analytics-shared/hooks/useOnSelectChartRegion';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import useStableArray from '@modules/experience-analytics-shared/hooks/useStableArray';
import ExperienceAnalyticsFilterChips from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsFilterChips';
import { getFilterValueForDimension } from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/filterUtils';
import { logGranularityChange } from '@modules/experience-analytics-shared/logging/experienceAnalyticsUnifiedLogger';
import {
  getMetricCacheKeyFromMetricLike,
  getUIMetricFromAtomicMetricLike,
  isComputedMetric,
  isCustomEventsAtomicMetricLike,
  type ComputedMetric,
  type MetricLike,
} from '@modules/experience-analytics-shared/types/ComputedMetric';
import {
  ChartOverlay,
  type ChartOverlays,
  type OverlayType,
} from '@modules/experience-analytics-shared/types/RAQIV2ChartSpec';
import type {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsPageSurfaceConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import type RAQIV2TableContext from '@modules/experience-analytics-shared/types/RAQIV2TableContext';
import computeRAQIV2SpecOverride from '@modules/experience-analytics-shared/utils/computeRAQIV2SpecOverride';
import extractPseudoDimensionsFromFilters, {
  hasPseudoDimensionValues,
} from '@modules/experience-analytics-shared/utils/extractPseudoDimensionsFromFilters';
import { getAPIMetricFromUIMetric } from '@modules/experience-analytics-shared/utils/getAPIMetricFromUIMetric';
import getOverlayAvailability, {
  type OverlayDisabledReason,
} from '@modules/experience-analytics-shared/utils/getOverlayAvailability';
import { getQuotaConfigForMetric } from '@modules/experience-analytics-shared/utils/getQuotaConfigForMetric';
import isMetricFanoutDimension from '@modules/experience-analytics-shared/utils/isMetricFanoutDimension';
import type { TUIGranularity } from '@modules/experience-analytics-shared/utils/seriesGranularities';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import AddToDashboardPickerCta from '../../../custom-dashboards/components/AddToDashboardPickerCta';
import {
  buildChartTileFromEditor,
  customEventFiltersToMetricVariant,
} from '../../../custom-dashboards/pages/chartEditor/chartTileDraft';
import type { ChartTileConfig } from '../../../custom-dashboards/types';
import { createTileId } from '../../../custom-dashboards/utils/createTileId';
import ExplorePageFilterButton from './components/ExploreFilterButton';
import ExploreModeAnnotationsControl from './components/ExploreModeAnnotationsControl';
import ExploreModeChartEmptyState from './components/ExploreModeChartEmptyState';
import ExploreModeCTAs, { type ExploreModeCtaAction } from './components/ExploreModeCTAs';
import ExploreModeMobileWrapper from './components/ExploreModeMobileWrapper';
import useCollapsedPrimaryRail from './useCollapsedPrimaryRail';
import useCollapseNux from './useCollapseNux';
import useExploreControlledChartConfiguratorCoreUrlSync from './useExploreControlledChartConfiguratorCoreUrlSync';
import useExploreModeHasCustomEventsProbe from './useExploreModeHasCustomEventsProbe';
import useExploreModeLastSourcePersistence from './useExploreModeLastSourcePersistence';
import { copyShareLinkToClipboard } from './utils/copyShareLink';
import { getDefaultEventTypeForMetric } from './utils/getDefaultEventTypeForMetric';

const sourceOwnedFilterDimensions: readonly TRAQIV2Dimension[] = [
  RAQIV2Dimension.CustomEventName,
  RAQIV2UIPseudoDimension.AggregationType,
];

type ResolveExploreChartTitleLabelArgs = {
  computedMetricChart: ComputedMetric | null;
  computedMetricChartTitleLabel: string | undefined;
  selectedCustomEventNameForTitle: string | undefined;
  untitledFormulaLabel: FormattedText | string;
  isActiveMetricComputed: boolean;
  isL7SmoothingEnabled: boolean;
  smoothingChartTitleFormat: FormattedText | string;
  defaultMetricName: FormattedText | string;
};

const resolveExploreChartTitleLabel = ({
  computedMetricChart,
  computedMetricChartTitleLabel,
  selectedCustomEventNameForTitle,
  untitledFormulaLabel,
  isActiveMetricComputed,
  isL7SmoothingEnabled,
  smoothingChartTitleFormat,
  defaultMetricName,
}: ResolveExploreChartTitleLabelArgs): FormattedText | string | undefined => {
  const isSyntheticSmoothingComputedMetric =
    computedMetricChart?.l7Smoothing === true && !isActiveMetricComputed;
  const simpleMetricCollapse = computedMetricChart
    ? collapseComputedMetricToSimple(computedMetricChart)
    : null;

  const atomicMetricTitleLabel =
    selectedCustomEventNameForTitle ?? simpleMetricCollapse?.customEventName;
  const fallbackComputedMetricTitleLabel = isSyntheticSmoothingComputedMetric
    ? (atomicMetricTitleLabel ?? defaultMetricName)
    : simpleMetricCollapse
      ? simpleMetricCollapse.customEventName
      : untitledFormulaLabel;
  const chartTitleLabel = computedMetricChart
    ? (computedMetricChartTitleLabel ?? fallbackComputedMetricTitleLabel)
    : selectedCustomEventNameForTitle;

  if (isL7SmoothingEnabled && !isActiveMetricComputed) {
    const smoothingMetricName = chartTitleLabel ?? defaultMetricName;
    return String(smoothingChartTitleFormat).replace('{metricName}', smoothingMetricName);
  }

  return chartTitleLabel;
};

// Spacing on the elements below is expressed via Foundation Tailwind utility
// classes (gap-medium, padding-y-large, etc.) applied directly in JSX. The
// remaining declarations here are layout/structural properties that don't
// have Tailwind equivalents in the legacy `makeStyles` flow.
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
  },
  headerTitleBlock: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
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
    // Pair with ChartConfiguratorSidebar inlineFocusRingInset so outline-focus /
    // selected strokes are not clipped by this row's overflow:hidden.
    paddingLeft: 'calc(2 * var(--stroke-thicker))',
    marginLeft: 'calc(-2 * var(--stroke-thicker))',
  },
  configuratorShell: {
    flex: 1,
    minHeight: 0,
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
    flexWrap: 'wrap',
    borderBottom: '1px solid var(--stroke-default)',
    position: 'relative',
    // Must be > 1 so the configure-icon Tooltip (which opens `bottom-center`
    // and grows toward the chart) paints above the chart card's outlined
    // border. The chart card wrapper (`contentLayer` in
    // ChartCardDragAndResizeContainer) also uses `zIndex: 1`, and as a later
    // sibling it would otherwise win the stacking tie.
    zIndex: 2,
  },
  topBarLeft: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  topBarRight: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  topBarDropdownWrapper: {
    display: 'flex',
    flexDirection: 'column',
    width: '220px',
  },
  // Settings (configure) icon-button is bottom-aligned with the date-range and
  // filter dropdowns above. Stack it inside a column so the tooltip lifts above
  // the chart's top border instead of clipping to it.
  configureIconWrapper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  chartBody: {
    flex: 1,
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
}));

const getExploreSurfaceAnnotationOptions = (
  isExperienceAlertsFlagEnabled: boolean,
): AnalyticsPageConfigAnnotationOptions => ({
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
    ...(isExperienceAlertsFlagEnabled ? [AnnotationType.ConfiguredAlertIncident] : []),
  ],
  // `ConfiguredAlertIncident` is intentionally NOT in the default set on
  // Explore Mode: the annotation type is now derived from the cascading
  // sub-menu's `?annotation_alertId` selection (enabled iff at least one
  // alert is pinned). The sync-on-selection effect in
  // `ExploreModeAnnotationsControl` is the only writer that flips it on /
  // off in `selectedAnnotationOptions`.
  defaultAnnotationTypes: [],
  showAnnotationsControl: true,
});

export type SidebarPageContentProps = {
  controlledConfigurator: ReturnType<typeof useExploreControlledChartConfiguratorCoreUrlSync>;
  displayMetric: TChartConfiguratorMetrics | null;
  displaySourceMetrics: readonly TChartConfiguratorMetrics[];
  hasUnsupportedSourceMetrics: boolean;
  hasSharedDateRanges: boolean;
  preset: TRAQIV2PredefinedChartKey | null;
  dimensions: readonly TRAQIV2Dimension[];
  resource: RAQIV2ChartResource;
  dateRangeOptions: readonly RAQIV2DateRangeType[];
  availableMetrics: TChartConfiguratorMetrics[];
  sourceFilterDimensionsByMetric?: SourceFilterDimensionsByMetric;
  priorUri: string | null;
  clearPreset: () => void;
};

export const SidebarPageContent: FC<SidebarPageContentProps> = ({
  controlledConfigurator,
  displayMetric,
  displaySourceMetrics,
  hasUnsupportedSourceMetrics,
  hasSharedDateRanges,
  preset,
  dimensions,
  resource,
  dateRangeOptions,
  availableMetrics,
  sourceFilterDimensionsByMetric,
  priorUri,
  clearPreset,
}) => {
  const { ready: isChartOverflowMenuFetched, value: isChartOverflowMenuEnabledValue } = useFlag(
    isChartOverflowMenuEnabledFlag,
  );
  const { ready: isCustomDashboardsFetched, value: isCustomDashboardsEnabledValue } = useFlag(
    isCustomDashboardsEnabledFlag,
  );
  const areFeatureFlagsFetched = isChartOverflowMenuFetched && isCustomDashboardsFetched;
  const isChartOverflowMenuEnabled = isChartOverflowMenuFetched && isChartOverflowMenuEnabledValue;
  const isCustomDashboardsEnabled = isCustomDashboardsFetched && isCustomDashboardsEnabledValue;

  const {
    classes: {
      root,
      headerRow,
      headerTitleBlock,
      subtitle,
      layout,
      configuratorShell,
      chartArea,
      topBar,
      topBarLeft,
      topBarRight,
      topBarDropdownWrapper,
      configureIconWrapper,
      chartBody,
      mobileChartArea,
    },
  } = useStyles();

  const isMobile = useMediaQuery('(max-width: 600px)');
  const [isConfigureSheetOpen, setIsConfigureSheetOpen] = useState(false);
  const handleOpenConfigureSheet = useCallback(() => setIsConfigureSheetOpen(true), []);
  const { isSidebarCollapsed, showCollapseNux, handleCollapseSidebar, handleExpandSidebar } =
    useCollapseNux();

  // When entering Explore Mode from a chart, benchmark card, or insights tile
  // (priorUri is set), collapse the Hub-wide primary rail so the chart gets
  // the full canvas. The hook snapshots the rail's prior open state on entry
  // and restores it on unmount. The configure sidebar still respects the
  // user's persisted preference in this case — only the Hub chrome is
  // overridden.
  useCollapsedPrimaryRail(Boolean(priorUri));

  const {
    state: controlledState,
    overlayState,
    tableAdditionalColumns,
    annotationOptions,
    setMetric: setControlledMetric,
    setComputedMetric: setControlledComputedMetric,
    setChartType,
    setChartTypeWithGranularity: setControlledChartTypeWithGranularity,
    setGranularity: setControlledGranularity,
    setOperationsToggle,
    setSmoothingOption,
    setOverlayOption,
    setBenchmarkOverlayType,
    setComparisonOffset,
    setComparisonCustomStartDate,
    setTableAdditionalColumns,
    setAnnotationOptions,
  } = controlledConfigurator;
  const {
    metric,
    computedMetric,
    chartTypeOverride: controlledChartTypeOverride,
    granularity: controlledGranularity,
    isOperationsToggleOn,
    operationsDraftMetric,
    smoothingOption,
  } = controlledState;
  const executionMetric: MetricLike | null = computedMetric ?? metric;

  const setMetric = useCallback(
    (nextMetric: TChartConfiguratorMetrics | null) => {
      clearPreset();
      setControlledMetric(nextMetric);
    },
    [clearPreset, setControlledMetric],
  );

  const setComputedMetric = useCallback(
    (nextComputedMetric: ComputedMetric | null) => {
      clearPreset();
      setControlledComputedMetric(nextComputedMetric);
    },
    [clearPreset, setControlledComputedMetric],
  );

  const { translate } = useRAQIV2TranslationDependencies();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const configureIconAriaLabel = tPendingTranslation(
    'Adjust more chart settings',
    'Aria label and tooltip for the icon button that re-opens the chart configuration drawer.',
    translationKey('Action.ExploreMode.ConfigureIcon', TranslationNamespace.Analytics),
  );
  const configureNuxTooltipLabel = tPendingTranslation(
    'Click Configure to adjust chart settings',
    'Tooltip shown on the Configure button the first time a user collapses the sidebar.',
    translationKey('Description.ExploreMode.CollapseNuxTooltip', TranslationNamespace.Analytics),
  );
  const untitledFormulaLabel = tPendingTranslation(
    '(Untitled formula)',
    'Default name shown for a formula that has not been named yet.',
    translationKey('Label.ExploreMode.UntitledFormula', TranslationNamespace.Analytics),
  );
  const exploreSubtitleLabel = tPendingTranslation(
    'Deep dive into your data with custom visualizations',
    'Subtitle text describing the explore mode page functionality.',
    translationKey('Description.ExploreMode.Subtitle', TranslationNamespace.Analytics),
  );
  const emptyStateTitleLabel = tPendingTranslation(
    '(empty)',
    'Title shown in the empty state when no chart data is available.',
    translationKey('Label.ExploreMode.EmptyState.Title', TranslationNamespace.Analytics),
  );
  const emptyStateSubtitleLabel = tPendingTranslation(
    'Average over selected time period',
    'Subtitle shown in the empty state describing the default aggregation method.',
    translationKey('Label.ExploreMode.EmptyState.Subtitle', TranslationNamespace.Analytics),
  );
  const computedMetricErrorDescription = tPendingTranslation(
    'Unable to compute formula. Check metric sources for errors.',
    'Error description shown in the chart area when a computed metric cannot be executed due to validation errors.',
    translationKey('Error.ExploreMode.ComputedMetricError', TranslationNamespace.Analytics),
  );
  const shareLabel = tPendingTranslation(
    'Share',
    'Button label to share the current explore mode view.',
    translationKey('Action.ExploreMode.Share', TranslationNamespace.Analytics),
  );
  const shareTooltipLabel = tPendingTranslation(
    'Copy a link to this page onto your clipboard',
    'Tooltip text for the share action that copies the current page URL.',
    translationKey('Description.PagePermalinkTooltip', TranslationNamespace.Analytics),
  );
  const closeLabel = tPendingTranslation(
    'Close',
    'Button label to close the dialog.',
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
  const viewSourceQueryLabel = tPendingTranslation(
    'View source query',
    'Menu item label to view the source query for the chart.',
    translationKey('Action.ExploreMode.ViewSourceQuery', TranslationNamespace.Analytics),
  );
  const copyLabel = tPendingTranslation(
    'Copy',
    'Button label to copy content to clipboard.',
    translationKey('Action.ExploreMode.Copy', TranslationNamespace.Analytics),
  );
  const copiedLabel = tPendingTranslation(
    'Copied!',
    'Button label shown after content is copied to clipboard.',
    translationKey('Message.Copied', TranslationNamespace.Analytics),
  );
  const smoothingChartTitleFormat = tPendingTranslation(
    '{metricName} (7 day moving average)',
    'Chart title when L7 smoothing is enabled. {metricName} is replaced with the metric display name.',
    translationKey('Label.ExploreMode.Smoothing.ChartTitleFormat', TranslationNamespace.Analytics),
  );

  // Holds a getter rather than the exporter itself so that the (table)
  // exporter is only allocated when the user actually triggers a download.
  // The chart path doesn't have the same allocation concern (it computes the
  // exporter as part of normal chart rendering anyway), so we just wrap the
  // already-built instance in a `() => chartExporter` closure to keep a
  // single uniform shape.
  const exporterGetterRef = useRef<(() => GenericCsvExporter) | null>(null);
  const [hasExportData, setHasExportData] = useState(false);
  const onChartDataUpdated = useCallback(
    ({ exporter: chartExporter }: { exporter: GenericCsvExporter }) => {
      exporterGetterRef.current = chartExporter.hasEmptyData ? null : () => chartExporter;
      setHasExportData(!chartExporter.hasEmptyData);
    },
    [],
  );
  // When the user clears the displayed metric there is no chart to publish an
  // exporter, so we drop the cached getter and the export-availability flag.
  // This is an effect (not derived state) because the exporter getter lives in
  // a ref that only the chart's `onChartDataUpdated` callback can repopulate;
  // there is no render-time value to derive `hasExportData` from.
  useEffect(() => {
    if (!displayMetric) {
      exporterGetterRef.current = null;
      // oxlint-disable-next-line react/react-compiler -- the export flag mirrors the ref-backed exporter, which only the chart callback can repopulate, so it can't be derived during render
      setHasExportData(false);
    }
  }, [displayMetric]);
  const closeHref = useMemo(() => {
    if (priorUri) {
      return priorUri;
    }
    return creatorHub.dashboard.getExperienceOverviewUrl(resource.id);
  }, [priorUri, resource.id]);

  // The View Events primary button only renders for metrics with a
  // corresponding live-events stream (custom events, economy, funnels). For
  // those surfaces we collapse the Share CTA into the overflow menu so the
  // header doesn't grow a fourth top-level button. Reuse the View Events
  // button's own gating helper so the two stay in lockstep — if the View
  // Events button starts/stops rendering for a metric, Share's placement
  // updates with it.
  const showViewEvents = useMemo(
    () => getDefaultEventTypeForMetric(displayMetric) !== null,
    [displayMetric],
  );

  // Returns the success boolean so ExploreModeCTAs can gate its
  // post-click feedback (the inline-button "Copied!" tooltip and the
  // overflow-trigger flash for the menu-item form) on whether the
  // clipboard write actually went through. The shared util has already
  // swallowed + logged any failure.
  const handleShare = useCallback(() => copyShareLinkToClipboard(), []);

  const canExport = Boolean(displayMetric && hasExportData);
  const handleExport = useCallback(() => {
    const getExporter = exporterGetterRef.current;
    if (!getExporter) {
      return;
    }
    const exp = getExporter();
    if (exp.hasEmptyData) {
      return;
    }
    exp.download({});
  }, []);

  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const copiedResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOpenSourceDialog = useCallback(() => {
    setSourceDialogOpen(true);
  }, []);
  const handleCloseSourceDialog = useCallback(() => {
    setSourceDialogOpen(false);
    setIsCopied(false);
  }, []);

  useEffect(
    () => () => {
      if (copiedResetTimeoutRef.current) {
        clearTimeout(copiedResetTimeoutRef.current);
      }
    },
    [],
  );

  const onSelectChartRegion = useOnSelectChartRegion();
  const chartContextFromProvider = useCurrentChartContext({
    resource,
    dimensions,
    // Source identity and fanout selections are source/sidebar state, not
    // page-level chart-context filters. Keep chart-context filters to the real
    // dimensions shared by the active source metrics.
    filterDimensions: dimensions,
    metric: displayMetric,
    constraintMetrics: displaySourceMetrics,
  });
  const requestedChartContext = useMemo(
    () => ({
      ...chartContextFromProvider,
      granularity: controlledGranularity,
    }),
    [chartContextFromProvider, controlledGranularity],
  );
  const granularitySelection = useMemo(
    () =>
      resolveGranularitySelection({
        metrics: displaySourceMetrics,
        requestedGranularity: controlledGranularity,
        startDate: chartContextFromProvider.timeSpec.startTime,
        endDate: chartContextFromProvider.timeSpec.endTime,
        breakdown: chartContextFromProvider.breakdown,
      }),
    [
      chartContextFromProvider.breakdown,
      chartContextFromProvider.timeSpec.endTime,
      chartContextFromProvider.timeSpec.startTime,
      controlledGranularity,
      displaySourceMetrics,
    ],
  );
  const chartContext = useMemo(
    () => ({
      ...chartContextFromProvider,
      granularity: granularitySelection.effectiveGranularity,
    }),
    [chartContextFromProvider, granularitySelection.effectiveGranularity],
  );
  // The granularity dropdown always shows the coerced (effective) granularity so
  // the control matches the rendered chart. The requested value (e.g. Cumulative
  // carried over from a previous metric) stays in the reducer/URL for seamless
  // round-tripping. Computed charts additionally surface an inline notice
  // (shouldShowUnsupportedGranularityWarning) explaining that the source metrics
  // don't share the requested interval; single-metric charts coerce silently.
  const sidebarChartContext = useMemo(
    () => ({
      ...requestedChartContext,
      granularity: granularitySelection.effectiveGranularity,
    }),
    [granularitySelection.effectiveGranularity, requestedChartContext],
  );

  const hasComputedMetricExecution = Boolean(executionMetric && isComputedMetric(executionMetric));
  const defaultChartType = useMemo<ChartConfiguratorChartType>(() => {
    if (!displayMetric) {
      return ChartType.Spline;
    }
    const chartType = getExploreModeChartType(preset, displayMetric, chartContext, {
      isExecutingComputedMetric: hasComputedMetricExecution,
    });
    return isChartConfiguratorSupportedChartType(chartType) ? chartType : ChartType.Spline;
  }, [preset, displayMetric, chartContext, hasComputedMetricExecution]);

  const isDurationMetric = displayMetric ? isDurationChartMetric(displayMetric) : false;
  const isChartTypeAvailable = useCallback(
    (chartType: ChartConfiguratorChartType): boolean => {
      if (isDurationChartType(chartType)) {
        return isDurationMetric;
      }
      if (chartType === ChartType.Area) {
        return defaultChartType === ChartType.Area;
      }
      if (
        chartType === ChartType.Spline ||
        chartType === ChartType.Column ||
        chartType === ChartType.Bar ||
        chartType === ChartType.Pie
      ) {
        return !isDurationMetric;
      }
      return true;
    },
    [defaultChartType, isDurationMetric],
  );
  const { availableChartTypes, supportedChartTypes, chartTypeSupport } = useMemo(
    () =>
      deriveChartTypeAvailability({
        displayMetric,
        isChartTypeAvailable,
        isL7SmoothingEnabled: controlledConfigurator.isL7SmoothingEnabled,
      }),
    [controlledConfigurator.isL7SmoothingEnabled, displayMetric, isChartTypeAvailable],
  );

  const { unifiedLogger } = useUnifiedLoggerProvider();
  // Drop a cumulative chart-type override (Bar/Pie) once granularity is coerced
  // to a time-bucketed value — e.g. carrying Cumulative + Bar into a computed
  // formula whose metrics can't be cumulative. Without this the chart renders a
  // bar against a daily series and silently plots only the first bucket. The
  // override stays in URL/reducer state so it re-applies if granularity returns
  // to Cumulative.
  const chartTypeOverride =
    controlledChartTypeOverride &&
    supportedChartTypes.includes(controlledChartTypeOverride) &&
    isChartTypeCompatibleWithGranularity(controlledChartTypeOverride, chartContext.granularity)
      ? controlledChartTypeOverride
      : null;
  const setChartTypeOverride = setChartType;
  const setChartTypeWithGranularity = useCallback(
    (type: ChartConfiguratorChartType | null, granularity: TUIGranularity) => {
      const queryGranularity = uiGranularityToQueryGranularity[granularity];
      setControlledChartTypeWithGranularity(type, granularity);
      logGranularityChange(unifiedLogger, { newGranularity: queryGranularity });
    },
    [setControlledChartTypeWithGranularity, unifiedLogger],
  );
  // Granularity-only changes must preserve the current chart type override.
  // Routing through `setChartTypeWithGranularity(null, …)` would serialize
  // `chartType: null`, clearing the URL param and reseeding the configurator
  // back to the default chart type (Spline) — dropping Bar/Pie/Table.
  const setGranularity = useCallback(
    (granularity: TUIGranularity) => {
      const queryGranularity = uiGranularityToQueryGranularity[granularity];
      setControlledGranularity(granularity);
      logGranularityChange(unifiedLogger, { newGranularity: queryGranularity });
    },
    [setControlledGranularity, unifiedLogger],
  );

  useEffect(() => {
    if (controlledChartTypeOverride && !supportedChartTypes.includes(controlledChartTypeOverride)) {
      setChartType(null, { skipHistory: true });
    }
  }, [controlledChartTypeOverride, supportedChartTypes, setChartType]);

  const selectedChartType: ChartConfiguratorChartType = chartTypeOverride ?? defaultChartType;

  const isTableMode = selectedChartType === ChartType.Table;
  // Duration charts plot a bucketed, non-temporal x-axis, so a time-domain
  // 7-day moving average is not applicable. The control is still rendered so
  // the user sees the option and understands why it's unavailable (tooltip).
  const l7SmoothingDisabledReason = getL7SmoothingDisabledReason({
    selectedChartType,
    granularity: chartContext.granularity,
  });
  const isL7SmoothingDisabledFlag = isL7SmoothingDisabled({
    selectedChartType,
    granularity: chartContext.granularity,
  });

  // Reset the exporter whenever we toggle between chart/table modes — and
  // between chart sub-types (spline ↔ bar/pie/etc.) — so the download-CSV
  // control doesn't surface stale data from the previous view. Each chart
  // component owns its own exporter (TimeSeries vs SingleDate, with
  // different shapes), and re-publishes it via `onChartDataUpdated` after
  // mount; clearing the ref synchronously here avoids a one-render window
  // where the menu would still hand out the previous chart's exporter.
  // Sync during render when `selectedChartType` flips (covers URL/default
  // chart type changes, not only sidebar chart-type setters) instead of
  // mirroring via useEffect.
  const prevSelectedChartTypeRef = useRef(selectedChartType);
  if (prevSelectedChartTypeRef.current !== selectedChartType) {
    /* oxlint-disable react/react-compiler -- writing these refs during render is deliberate: clearing the exporter synchronously on a chart-type flip avoids a one-render window where the menu hands out the previous chart's exporter (see comment above) */
    prevSelectedChartTypeRef.current = selectedChartType;
    exporterGetterRef.current = null;
    /* oxlint-enable react/react-compiler */
    setHasExportData(false);
  }

  const {
    overlayOption: overlayOptionRaw,
    benchmarkType: benchmarkOverlayType,
    comparisonOffset,
    comparisonCustomStartDate: comparisonCustomStartDateFromUrl,
  } = overlayState;

  // Reconcile any URL-supplied `comparisonCustomStartDate` against the current
  // main date range. The picker clamps only when the user emits `onChange`, so
  // the URL/state can still carry a value that is now after the new main
  // window's start (or before the retention floor) after the user adjusts the
  // primary date range. Without reconciliation that stale value flows directly
  // into `ChartOverlay.comparison` and the fetch range can overlap incorrectly
  // or even produce `startTime > endTime` for the combined request.
  //
  // Match the picker's clamp range: `[minStartDate, mainStart - 1 bucket]`.
  // When that window is empty (pathological retention setup) treat the custom
  // value as unusable and fall back to the legacy previous-period comparison.
  const { startDate: dateRangeBundleStartDate, minStartDate: dateRangeBundleMinStartDate } =
    useAnalyticsCurrentDateRangeBundle();
  const comparisonCustomStartDate = useMemo(() => {
    if (!comparisonCustomStartDateFromUrl) {
      return undefined;
    }
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    // Snap the clamp bounds to UTC midnight to match the picker and the
    // `defaultCustomStartDate` path in `ChartConfiguratorOverlaysControl`. For preset
    // ranges (Last7Days/Last28Days etc.) the bundle's `startDate` carries
    // `maxEndDate`'s time-of-day; without alignment a stale URL value that
    // clamps to `maxTime` would serialize a non-midnight timestamp back to the
    // URL and the request would slice against a non-UTC-midnight custom start.
    const minTime = alignToUTCMidnight(dateRangeBundleMinStartDate).getTime();
    const maxTime = alignToUTCMidnight(
      new Date(dateRangeBundleStartDate.getTime() - ONE_DAY_MS),
    ).getTime();
    if (maxTime < minTime) {
      return undefined;
    }
    const rawTime = comparisonCustomStartDateFromUrl.getTime();
    if (rawTime >= minTime && rawTime <= maxTime) {
      return alignToUTCMidnight(comparisonCustomStartDateFromUrl);
    }
    return new Date(Math.min(maxTime, Math.max(minTime, rawTime)));
  }, [comparisonCustomStartDateFromUrl, dateRangeBundleMinStartDate, dateRangeBundleStartDate]);
  const isL7SmoothingEnabled =
    !isL7SmoothingDisabledFlag && controlledConfigurator.isL7SmoothingEnabled;

  const {
    activeMetricForQuery,
    isActiveMetricComputed,
    effectiveComputedMetric,
    computedMetricChartTitleLabel,
  } = useActiveMetricForQuery({
    executionMetric,
    computedMetric,
    operationsDraftMetric,
    isOperationsToggleOn,
  });

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
  // The equation builder pre-validates unsupported sources and date range
  // compatibility (DSA-5506) so these checks should rarely trigger during
  // interactive editing.  They remain as a defensive fallback for computed
  // metrics loaded from URL query params that bypass the builder.
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

  const hasBuilderValidationError = useComputedMetricValidationError();
  const builderFormulaLabel = useComputedMetricFormulaLabel();
  const isComputedMetricError =
    hasBuilderValidationError || isComputedMetricConstraintsIncompatible;

  const effectiveRaqiDimensions = useMemo(() => {
    const dims: TRAQIV2Dimension[] = [...dimensions];
    if (!dims.includes(RAQIV2Dimension.CustomEventName)) {
      dims.push(RAQIV2Dimension.CustomEventName);
    }
    if (!dims.includes(RAQIV2UIPseudoDimension.AggregationType as TRAQIV2Dimension)) {
      dims.push(RAQIV2UIPseudoDimension.AggregationType as TRAQIV2Dimension);
    }
    return dims;
  }, [dimensions]);

  const { filters, onFiltersChange, raqiFilters, clearFilterDimensions } =
    useRAQIAnalyticsCurrentFilterBundle(effectiveRaqiDimensions);
  // Primitive (`string | undefined`); recomputed each render — dep arrays
  // downstream compare by value via `Object.is`, so `useMemo` would add
  // overhead without changing render behavior.
  const selectedCustomEventNameForTitle =
    displayMetric === customEventsMetric
      ? (getFilterValueForDimension(filters, RAQIV2Dimension.CustomEventName, null)?.trim() ??
        undefined)
      : undefined;

  // Reset All in Explore Mode wipes *every* filter from the URL — both the
  // filters applicable to the current metric and any greyed-out orphan filters
  // carried over from another metric. We batch the removal into a single
  // setFilterParams call so the router only pushes one update.
  const clearAllFilters = useCallback(() => {
    const allDimensions = raqiFilters.map(({ dimension }) => dimension);
    if (allDimensions.length > 0) {
      clearFilterDimensions(allDimensions);
    }
  }, [raqiFilters, clearFilterDimensions]);

  const { sourceFilter, isCustomEventsMode, filteredMetrics, handleSourceChange } =
    useChartConfiguratorSourceSelection({
      metric,
      setMetric,
      availableMetrics,
      translate,
      filters,
      onFiltersChange,
    });

  // Probe for custom-events existence only while the page has nothing
  // selected — once a metric or computed metric is in play, the default
  // source decision is moot, and the probe's network/cache work is wasted.
  // The probe itself reads its localStorage cache synchronously and
  // short-circuits a fetch when a non-stale answer already exists.
  const hasCustomEventsProbeEnabled = !metric && !computedMetric;
  const hasCustomEventsState = useExploreModeHasCustomEventsProbe(
    resource,
    hasCustomEventsProbeEnabled,
  );

  const { didAutoSelectCustomEvents } = useExploreModeLastSourcePersistence({
    universeId: resource.id,
    metric,
    setMetric,
    computedMetric,
    filters,
    onFiltersChange,
    hasCustomEvents: hasCustomEventsState,
    isReady: areFeatureFlagsFetched,
  });

  const selectedCustomEventNameFilter = useMemo(
    () => getFilterValueForDimension(filters, RAQIV2Dimension.CustomEventName, null),
    [filters],
  );

  useEffect(() => {
    if (
      isOperationsToggleOn ||
      !isCustomEventsMode ||
      selectedCustomEventNameFilter === null ||
      metric === customEventsMetric
    ) {
      return;
    }

    setMetric(customEventsMetric);
  }, [isCustomEventsMode, metric, isOperationsToggleOn, selectedCustomEventNameFilter, setMetric]);

  const isCustomEventsReady = useMemo(
    () => isCustomEventsQueryReady(isCustomEventsMode, metric, filters),
    [isCustomEventsMode, metric, filters],
  );

  const resolvedMetricForQuery = useMemo(() => {
    if (!activeMetricForQuery || isComputedMetricConstraintsIncompatible) {
      return null;
    }
    if (isComputedMetric(activeMetricForQuery)) {
      if (!isL7SmoothingEnabled && activeMetricForQuery.l7Smoothing) {
        const { l7Smoothing: _l7Smoothing, ...withoutL7Smoothing } = activeMetricForQuery;
        return withoutL7Smoothing;
      }
      return activeMetricForQuery;
    }
    if (!isCustomEventsReady) {
      return null;
    }
    const activeUIMetric = getUIMetricFromAtomicMetricLike(activeMetricForQuery);
    if (!isNumericUIMetric(activeUIMetric)) {
      return null;
    }
    const { pseudoDimensionValues } = extractPseudoDimensionsFromFilters(raqiFilters);
    return getMetricForL7Smoothing(activeUIMetric, isL7SmoothingEnabled, {
      ...(activeUIMetric === customEventsMetric && selectedCustomEventNameFilter
        ? { customEventName: selectedCustomEventNameFilter }
        : {}),
      ...(hasPseudoDimensionValues(pseudoDimensionValues) ? { pseudoDimensionValues } : {}),
    });
  }, [
    activeMetricForQuery,
    isComputedMetricConstraintsIncompatible,
    isL7SmoothingEnabled,
    isCustomEventsReady,
    raqiFilters,
    selectedCustomEventNameFilter,
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

  const quotaConfigForDisplayMetric = useMemo(() => {
    if (isActiveMetricComputed || !displayMetric) {
      return undefined;
    }
    // Read the quota directly off the active metric's display config rather
    // than going through `preset`. The preset URL param is only present when
    // the source chart was registered as a centralized predefined chart key
    // (`chartKey: RAQIV2PredefinedChartKey.X`) — the cloud-services chart
    // configs (DataStore, MemoryStore, etc.) deliberately omit `chartKey`,
    // so a preset-gated path silently dropped quota lines for those metrics
    // even when codegen exposed a `quotaConfig`. `getQuotaConfigForMetric`
    // already short-circuits to `undefined` when the variant is `Metric` but
    // the companion isn't a numeric UI metric we can chart, and the chart-
    // type gate (Spline-only) is enforced at the `getOverlayAvailability`
    // layer below — no need to re-check those here.
    return getQuotaConfigForMetric(displayMetric);
  }, [isActiveMetricComputed, displayMetric]);

  const hasQuota = quotaConfigForDisplayMetric !== undefined;

  const hasOverlayEligibilityBreakdown =
    benchmarkEligibilitySpec?.breakdown !== undefined
      ? benchmarkEligibilitySpec.breakdown.length > 0
      : Boolean(chartContext.breakdown?.length);

  const overlayAvailability = useMemo(
    () =>
      getOverlayAvailability(benchmarkEligibilitySpec, {
        isComputedMetric: isActiveMetricComputed,
        hasBreakdown: hasOverlayEligibilityBreakdown,
        chartType: selectedChartType,
        hasQuota,
      }),
    [
      benchmarkEligibilitySpec,
      hasOverlayEligibilityBreakdown,
      isActiveMetricComputed,
      selectedChartType,
      hasQuota,
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

  // Persist the reconciled `comparisonCustomStartDate` back into the URL when
  // the clamp produced a different value than what's stored. This keeps the
  // URL consistent with what the fetch/picker actually use and prevents a
  // stale custom start from being re-serialized verbatim by `setOverlayOption`
  // when other overlay params change. Uses `skipHistory` so silent
  // self-corrections don't pollute the browser back/forward stack.
  useEffect(() => {
    if (
      comparisonCustomStartDateFromUrl?.getTime() === comparisonCustomStartDate?.getTime() ||
      (!comparisonCustomStartDateFromUrl && !comparisonCustomStartDate)
    ) {
      return;
    }
    setComparisonCustomStartDate(comparisonCustomStartDate, { skipHistory: true });
  }, [comparisonCustomStartDate, comparisonCustomStartDateFromUrl, setComparisonCustomStartDate]);

  const overlayOption: OverlayOption = useMemo(() => {
    if (overlayOptionRaw === 'none') {
      return 'none';
    }
    const statusMap = {
      benchmarks: effectiveOverlayAvailability.benchmark,
      'period-over-period': effectiveOverlayAvailability.comparison,
      quota: effectiveOverlayAvailability.quota,
    } as Record<string, (typeof effectiveOverlayAvailability)[OverlayType] | undefined>;
    const status = statusMap[overlayOptionRaw];
    if (status && (!status.applicable || status.disabled)) {
      return 'none';
    }
    return overlayOptionRaw;
  }, [overlayOptionRaw, effectiveOverlayAvailability]);

  const overlayChartOptions: ChartOverlays = useMemo(() => {
    switch (overlayOption) {
      case 'benchmarks':
        return [ChartOverlay.benchmark(benchmarkOverlayType ?? undefined)];
      case 'period-over-period':
        return [
          ChartOverlay.comparison({
            relativeOffset: comparisonOffset,
            customStartDate: comparisonCustomStartDate,
          }),
        ];
      case 'quota':
      case 'none':
      default:
        return [];
    }
  }, [benchmarkOverlayType, comparisonOffset, comparisonCustomStartDate, overlayOption]);
  const chartContextWithPresentation = useMemo(
    () => ({
      ...chartContext,
      overlays: overlayChartOptions,
    }),
    [chartContext, overlayChartOptions],
  );
  const chartContextForQuery = useMemo(() => {
    if (!isActiveMetricComputed || !chartContextWithPresentation.filter?.length) {
      return chartContextWithPresentation;
    }

    const queryFilters = chartContextWithPresentation.filter.filter(
      (filter) =>
        filter.dimension !== RAQIV2Dimension.CustomEventName &&
        !isMetricFanoutDimension(filter.dimension as TRAQIV2Dimension),
    );
    if (queryFilters.length === chartContextWithPresentation.filter.length) {
      return chartContextWithPresentation;
    }

    return {
      ...chartContextWithPresentation,
      filter: queryFilters.length > 0 ? queryFilters : undefined,
    };
  }, [chartContextWithPresentation, isActiveMetricComputed]);

  const setComputedMetricWithSmoothing = useCallback(
    (nextComputedMetric: ComputedMetric | null) => {
      if (!nextComputedMetric) {
        setComputedMetric(null);
        return;
      }
      const nextComputedMetricWithSmoothing = {
        ...nextComputedMetric,
        l7Smoothing: isL7SmoothingEnabled,
      };
      setComputedMetric(nextComputedMetricWithSmoothing);
    },
    [isL7SmoothingEnabled, setComputedMetric],
  );

  // Two-way URL ownership for the "Use operations" toggle.
  //
  // ON: `computedMetric=cm2...` becomes the sole owner of metric identity.
  //     The current simple metric (and any source-owned page-level filters
  //     like `filter_CustomEventName` / `filter_AggregationType`) is lifted
  //     into Metric A and stripped from the URL so the source's typed
  //     fields don't double-apply alongside the page-level filters.
  //
  // OFF: If the computed metric is a single-source identity formula
  //      (`formula: 'A'`, one source, no extra source filters) we collapse
  //      it back to a simple metric and restore the source-owned filters
  //      to the URL. Otherwise we clear computed mode without inventing
  //      simple metric/filter state — the context provider falls back to
  //      the last regular metric for the URL's `metric` param.
  const handleOperationsToggleChange = useCallback(
    (enabled: boolean) => {
      if (enabled === isOperationsToggleOn) {
        return;
      }
      if (enabled) {
        if (computedMetric === null && metric) {
          const seededComputedMetric = buildSeededComputedMetricFromSimple(
            metric,
            filters,
            raqiFilters,
          );
          setOperationsToggle(true, seededComputedMetric);
          const stripped = stripSourceOwnedFilters(filters);
          if (stripped.length !== filters.length) {
            onFiltersChange(stripped);
          }
        } else {
          setOperationsToggle(true, null);
        }
        return;
      }
      if (computedMetric) {
        const collapse = collapseComputedMetricToSimple(computedMetric);
        if (collapse) {
          const restored = applyCollapseToFilters(filters, collapse);
          if (restored !== filters) {
            onFiltersChange(restored);
          }
          setMetric(collapse.metric);
          return;
        }
        setComputedMetricWithSmoothing(null);
      }
      setOperationsToggle(false, null);
    },
    [
      computedMetric,
      filters,
      metric,
      onFiltersChange,
      isOperationsToggleOn,
      raqiFilters,
      setComputedMetricWithSmoothing,
      setMetric,
      setOperationsToggle,
    ],
  );

  const chartSpec = useMemo(() => {
    if (!resolvedMetricForQuery) {
      return null;
    }
    // Gate on `isActiveMetricComputed` (the user's metric), not on
    // `resolvedMetricForQuery`, which may be an L7-smoothing synthetic
    // ComputedMetric wrapper that still needs the atomic metric's override.
    const exploreModeSpecOverride =
      !isActiveMetricComputed && displayMetric
        ? getAnalyticsMetricDisplayConfig(displayMetric).exploreModeSpecOverride
        : undefined;
    const spec = {
      ...(exploreModeSpecOverride
        ? computeRAQIV2SpecOverride(chartContextForQuery, exploreModeSpecOverride)
        : chartContextForQuery),
      metric: resolvedMetricForQuery,
    };
    const filterOnlyDimensions = getChartConfiguratorFilterOnlyDimensions(selectedChartType);
    if (spec.breakdown?.length && filterOnlyDimensions.length) {
      spec.breakdown = spec.breakdown.filter((dim) => !filterOnlyDimensions.includes(dim));
    }
    return spec;
  }, [
    resolvedMetricForQuery,
    chartContextForQuery,
    selectedChartType,
    displayMetric,
    isActiveMetricComputed,
  ]);

  const specJson = useMemo(
    () => (chartSpec ? JSON.stringify(chartSpec, null, 2) : ''),
    [chartSpec],
  );

  const handleCopySpec = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(specJson);
      setIsCopied(true);
      if (copiedResetTimeoutRef.current) {
        clearTimeout(copiedResetTimeoutRef.current);
      }
      copiedResetTimeoutRef.current = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      // clipboard unavailable
    }
  }, [specJson]);

  useEffect(() => {
    if (overlayOption !== 'benchmarks' || benchmarkOverlayType === null) {
      return;
    }
    if (!availableBenchmarkTypes.includes(benchmarkOverlayType)) {
      setBenchmarkOverlayType(null);
    }
  }, [availableBenchmarkTypes, overlayOption, benchmarkOverlayType, setBenchmarkOverlayType]);

  const chart = useMemo(() => {
    if (isTableMode) {
      return null;
    }
    if (!chartSpec || !displayMetric) {
      return null;
    }

    const { localizedName, localizedDescription } = getAnalyticsMetricDisplayConfig(displayMetric);
    const titleKey = preset ? getTitleKeyFromPredefinedChart(preset) : localizedName;
    const tooltipKey = preset ? getTooltipKeyFromPredefinedChart(preset) : localizedDescription;

    if (!isChartConfiguratorSupportedChartType(selectedChartType)) {
      return null;
    }

    const computedMetricChart = isComputedMetric(chartSpec.metric) ? chartSpec.metric : null;
    const chartDefinitionTooltipKey = computedMetricChart ? undefined : tooltipKey;
    const effectiveTitleLabel = resolveExploreChartTitleLabel({
      computedMetricChart,
      computedMetricChartTitleLabel,
      selectedCustomEventNameForTitle,
      untitledFormulaLabel,
      isActiveMetricComputed,
      isL7SmoothingEnabled,
      smoothingChartTitleFormat,
      defaultMetricName: translate(titleKey),
    });

    const quotaConfig = overlayOption === 'quota' ? quotaConfigForDisplayMetric : undefined;

    return (
      // Explore Mode owns export and navigation outside the card; suppress the
      // default chart header actions for the live preview chart.
      <ChartActionsProvider value={false}>
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
            quotaConfig={quotaConfig}
            onChartDataUpdated={onChartDataUpdated}
            chartLocation='explore-mode'
          />
        </GenericAnalyticsLayoutItem>
      </ChartActionsProvider>
    );
  }, [
    selectedChartType,
    chartSpec,
    overlayChartOptions,
    onSelectChartRegion,
    onChartDataUpdated,
    displayMetric,
    overlayOption,
    quotaConfigForDisplayMetric,
    preset,
    computedMetricChartTitleLabel,
    selectedCustomEventNameForTitle,
    untitledFormulaLabel,
    isActiveMetricComputed,
    isL7SmoothingEnabled,
    smoothingChartTitleFormat,
    translate,
    isTableMode,
  ]);

  // Derived source columns: when operations is on, every source metric beyond
  // the primary becomes its own column in the table view.
  //
  // When the active primary is itself a computed (formula) metric, the
  // formula's source metrics are an internal implementation detail of the
  // computed result — surfacing them as separate columns would just clutter
  // the table with duplicated/related numbers. The user can still add any of
  // those metrics back as additional columns below the chart type selector.
  const derivedSourceColumns = useMemo<ExploreModeTableMetricColumn[]>(() => {
    if (!isTableMode || !isOperationsToggleOn) {
      return [];
    }
    if (activeMetricForQuery && isComputedMetric(activeMetricForQuery)) {
      return [];
    }
    return displaySourceMetrics
      .filter((m): m is TChartConfiguratorMetrics => m !== displayMetric)
      .map((m) => ({ type: 'metric' as const, key: `derived_${m}`, metric: m }));
  }, [
    isTableMode,
    isOperationsToggleOn,
    displaySourceMetrics,
    displayMetric,
    activeMetricForQuery,
  ]);

  // Metrics that ultimately constrain the available breakdowns: the primary
  // (display) metric plus any derived sources or additional columns that have
  // a metric chosen.
  const tableConstraintMetrics = useMemo<readonly TChartConfiguratorMetrics[]>(() => {
    if (!isTableMode) {
      return [];
    }
    const seen = new Set<TChartConfiguratorMetrics>();
    if (displayMetric) {
      seen.add(displayMetric);
    }
    derivedSourceColumns.forEach((c) => {
      if (c.type === 'metric' && c.metric) {
        seen.add(c.metric);
      }
    });
    tableAdditionalColumns.forEach((c) => {
      if (c.type === 'metric' && c.metric) {
        seen.add(c.metric);
      }
    });
    return Array.from(seen);
  }, [isTableMode, displayMetric, derivedSourceColumns, tableAdditionalColumns]);

  // Metrics that the chart-level filter drawer applies to, resolved to API
  // metrics so dynamic filter UIs (e.g. TransactionType) can fetch options
  // via useCurrentAnalyticsPageContextMetrics(). Pseudo-dimension selections
  // (AggregationType / PercentileType) materially change the resolved API
  // metric (e.g. CustomEventsV2 + Sum vs Count), so we honour them per
  // source rather than always defaulting to nulls:
  //   - Computed metric chart mode and table-mode computed primary:
  //     each source carries its own `pseudoDimensionValues`
  //     (per buildComputedMetricDag.resolveSourceMetric).
  //   - Single metric chart mode and table-mode non-computed primary /
  //     derived columns: fall back to the page-level fanout selections in
  //     the chart-level `filters` (extracted via
  //     extractPseudoDimensionsFromFilters).
  //   - Table-mode additional columns: each column scopes its own filters,
  //     so honour any per-column fanout selection.
  const chartContextApiMetrics = useMemo<TRAQIV2APIMetric[]>(() => {
    const seen = new Set<TRAQIV2APIMetric>();
    const out: TRAQIV2APIMetric[] = [];

    const { pseudoDimensionValues: pagePseudoValues } =
      extractPseudoDimensionsFromFilters(raqiFilters);

    const collect = (
      sourceMetric: TChartConfiguratorMetrics,
      pseudoDimensionValues: typeof pagePseudoValues,
    ) => {
      const apiMetric = isValidEnumValue(RAQIV2UIMetric, sourceMetric)
        ? getAPIMetricFromUIMetric(sourceMetric, pseudoDimensionValues)
        : sourceMetric;
      if (!seen.has(apiMetric)) {
        seen.add(apiMetric);
        out.push(apiMetric);
      }
    };

    if (isTableMode && tableConstraintMetrics.length > 0) {
      // When the primary is a computed metric, derivedSourceColumns is empty
      // by design; expand the formula's sources here so dynamic filter
      // options can be fetched for every source metric in the union.
      if (executionMetric && isComputedMetric(executionMetric)) {
        executionMetric.sources.forEach((source) => {
          const sourceMetric = getUIMetricFromAtomicMetricLike(source.metric);
          if (!isNumericUIMetric(sourceMetric)) {
            return;
          }
          if (!displaySourceMetrics.includes(sourceMetric)) {
            return;
          }
          collect(
            sourceMetric,
            isCustomEventsAtomicMetricLike(source.metric)
              ? {
                  aggregationType:
                    source.metric.aggregationType ??
                    source.pseudoDimensionValues?.aggregationType ??
                    pagePseudoValues.aggregationType,
                  percentile:
                    source.pseudoDimensionValues?.percentile ?? pagePseudoValues.percentile,
                }
              : (source.pseudoDimensionValues ?? pagePseudoValues),
          );
        });
      } else if (displayMetric) {
        collect(displayMetric, pagePseudoValues);
      }
      derivedSourceColumns.forEach((col) => {
        if (col.type === 'metric' && col.metric) {
          collect(col.metric, pagePseudoValues);
        }
      });
      tableAdditionalColumns.forEach((col) => {
        if (col.type === 'metric' && col.metric) {
          const { pseudoDimensionValues: columnPseudoValues } = extractPseudoDimensionsFromFilters(
            col.filters,
          );
          collect(col.metric, columnPseudoValues);
        }
      });
      return out;
    }

    if (executionMetric && isComputedMetric(executionMetric)) {
      executionMetric.sources.forEach((source) => {
        const sourceMetric = getUIMetricFromAtomicMetricLike(source.metric);
        if (!isNumericUIMetric(sourceMetric)) {
          return;
        }
        if (!displaySourceMetrics.includes(sourceMetric)) {
          return;
        }
        collect(
          sourceMetric,
          isCustomEventsAtomicMetricLike(source.metric)
            ? {
                aggregationType:
                  source.metric.aggregationType ??
                  source.pseudoDimensionValues?.aggregationType ??
                  pagePseudoValues.aggregationType,
                percentile: source.pseudoDimensionValues?.percentile ?? pagePseudoValues.percentile,
              }
            : (source.pseudoDimensionValues ?? pagePseudoValues),
        );
      });
      return out;
    }

    displaySourceMetrics.forEach((m) => collect(m, pagePseudoValues));
    return out;
  }, [
    isTableMode,
    tableConstraintMetrics,
    displayMetric,
    derivedSourceColumns,
    tableAdditionalColumns,
    executionMetric,
    displaySourceMetrics,
    raqiFilters,
  ]);

  const breakdownDimensions = useMemo(() => {
    const filtered = dimensions.filter(
      (dimension): dimension is TRAQIV2Dimension =>
        !getChartConfiguratorFilterOnlyDimensions(selectedChartType).includes(dimension),
    );
    if (!isTableMode || tableConstraintMetrics.length === 0) {
      return filtered;
    }
    const chartConfiguratorDims = getChartConfiguratorDimensions();
    return filtered.filter((dim) =>
      tableConstraintMetrics.every((m) => {
        const supported = chartConfiguratorDims[m];
        // Every metric is expected to have an entry in the chart configurator
        // dimensions map. A missing entry should never happen in production,
        // but if it does we report it (so we hear about the gap) and treat
        // the metric as supporting no breakdowns rather than silently
        // collapsing the breakdown selector to "everything".
        if (!supported) {
          logAnalyticsError(
            `Chart configurator: metric ${m} is missing from getChartConfiguratorDimensions(); treating as having no supported breakdowns.`,
          );
          return false;
        }
        return supported.includes(dim);
      }),
    );
  }, [dimensions, selectedChartType, isTableMode, tableConstraintMetrics]);

  const { breakdown, setBreakdown } = useAnalyticsCurrentBreakdownBundle(breakdownDimensions);

  // In table mode, restrict the metrics shown in source/additional selectors
  // to those that support both:
  //   1. every currently-selected breakdown dimension, AND
  //   2. the active time granularity (so the user cannot pick a column whose
  //      query would later be rejected as `UnsupportedGranularity` — e.g.
  //      adding a daily-only metric while the table is bucketed by hour).
  // Outside of table mode the granularity check is handled per-control via
  // `getGranularityOptionsForMetric`, so we don't need to filter it here.
  const tableGranularity = chartContextWithPresentation.granularity;
  const tableAvailableMetrics = useMemo<TChartConfiguratorMetrics[]>(() => {
    if (!isTableMode) {
      return [...availableMetrics];
    }
    const chartConfiguratorDims = getChartConfiguratorDimensions();
    return availableMetrics.filter((m) => {
      if (breakdown.length > 0) {
        const supported = chartConfiguratorDims[m] || [];
        if (!breakdown.every((b) => supported.includes(b))) {
          return false;
        }
      }
      const supportedGranularities = RAQIV2MetricToSupportedGranularities[m];
      // Treat a missing entry as "no granularities supported" (matches the
      // breakdown branch above): better to surface the gap than to silently
      // include a metric whose query would fail at request time.
      if (!supportedGranularities?.includes(tableGranularity)) {
        return false;
      }
      return true;
    });
  }, [availableMetrics, breakdown, isTableMode, tableGranularity]);

  // Drop any chosen additional-column metric that no longer supports the
  // currently selected breakdowns OR the active granularity. Resets it to
  // null rather than removing the column slot so the user can pick a
  // replacement.
  //
  // We use a functional updater so this effect doesn't have to depend on
  // `tableAdditionalColumns` itself — that dependency would otherwise re-run
  // the effect on every state update it produces, even though the only
  // inputs that should retrigger the reset are the current breakdown
  // selection, granularity, and table-mode toggle.
  useEffect(() => {
    if (!isTableMode) {
      return;
    }
    const chartConfiguratorDims = getChartConfiguratorDimensions();
    setTableAdditionalColumns((prev) => {
      let changed = false;
      const next = prev.map((col) => {
        if (col.type !== 'metric' || !col.metric) {
          return col;
        }
        const supported = chartConfiguratorDims[col.metric] || [];
        const breakdownOk = breakdown.every((b) => supported.includes(b));
        const supportedGranularities = RAQIV2MetricToSupportedGranularities[col.metric];
        const granularityOk = supportedGranularities?.includes(tableGranularity) ?? false;
        if (breakdownOk && granularityOk) {
          return col;
        }
        changed = true;
        return { ...col, metric: null, filters: undefined };
      });
      return changed ? next : prev;
    });
  }, [breakdown, isTableMode, setTableAdditionalColumns, tableGranularity]);

  const handleTableExporterReady = useCallback(
    (getTableExporter: (() => GenericCsvExporter) | null) => {
      exporterGetterRef.current = getTableExporter;
      // The table-side getter contract guarantees `null` when there's no data
      // to export, so its presence alone is sufficient to drive the
      // download-CSV affordance — we don't need to construct the exporter
      // here just to read `hasEmptyData`.
      setHasExportData(getTableExporter !== null);
    },
    [],
  );

  const noTableMetricLabel = tPendingTranslation(
    'Select a metric to populate the table',
    'Empty state shown in explore mode when no metric column is configured for the table view.',
    translationKey('Label.ExploreMode.Table.NoMetric', TranslationNamespace.Analytics),
  );

  const tableView = useMemo(() => {
    if (!isTableMode) {
      return null;
    }

    // Convert the explore-mode column representations into the builder's
    // input shape. Drop columns whose metric is unselected — they have no
    // queryable target yet.
    //
    // `TChartConfiguratorMetrics` is an alias for `TRAQIV2NumericUIMetric`, which
    // is itself one half of the `MetricLike<TRAQIV2NumericUIMetric>` union,
    // so no cast is required here.
    const toInput = (col: {
      key: string;
      metric: TChartConfiguratorMetrics | null;
      filters?: readonly NonNullable<RAQIV2TableContext['filter']>[number][];
    }): ExploreModeTableMetricColumnInput | null => {
      if (!col.metric) {
        return null;
      }
      return {
        key: col.key,
        metric: col.metric,
        filter: col.filters,
      };
    };

    // Use the original `executionMetric` rather than `activeMetricForQuery`
    // for the table primary column. `activeMetricForQuery` strips the
    // computed metric's `name` for chart-query cache stability (so renaming
    // a formula doesn't refetch the chart), but the table column header
    // derives its label from the metric — without the name it would always
    // render as "(Untitled formula)" even after the user names the formula.
    // The chart path reads the name separately via `computedMetricChartTitleLabel`;
    // the table path doesn't have an equivalent escape hatch, so we just
    // hand it the named version. `activeMetricForQuery` is null when
    // `executionMetric` is null, so when it's truthy we know we have a
    // metric to render.
    const primaryMetricSourceForTable: MetricLike | null =
      isOperationsToggleOn && effectiveComputedMetric ? effectiveComputedMetric : executionMetric;
    const primaryMetricForTable: MetricLike | null =
      activeMetricForQuery && primaryMetricSourceForTable
        ? isComputedMetric(primaryMetricSourceForTable)
          ? primaryMetricSourceForTable
          : resolvedMetricForQuery
        : null;
    const primaryMetric: ExploreModeTableMetricColumnInput | null = primaryMetricForTable
      ? {
          // Keys must be stable strings. Atomic identity may include a custom
          // event name, so route all non-computed keys through the shared cache
          // key helper.
          key: isComputedMetric(primaryMetricForTable)
            ? 'primary_computed'
            : `primary_${getMetricCacheKeyFromMetricLike(primaryMetricForTable)}`,
          metric: primaryMetricForTable,
        }
      : null;

    // After hoisting CustomEventName + AggregationType into the atomic
    // metric (DSA-5755), source identity is no longer threaded as a
    // page-level filter. The custom-event scoping for table queries flows
    // through `buildChartConfiguratorTableConfig`'s per-column metric overrides,
    // which inspect the page-level filter to scope CustomEventsV2 columns
    // only. `chartContextWithPresentation.filter` already excludes
    // CustomEventName and metric-fanout pseudo-dimensions (those are
    // dropped from `useCurrentChartContext`'s `filterDimensions`), so
    // forwarding it directly is correct.
    const tableContextFilter = chartContextWithPresentation.filter;

    const tableConfig = buildChartConfiguratorTableConfig({
      breakdown,
      primaryMetric,
      derivedSourceColumns: derivedSourceColumns
        .map(toInput)
        .filter((c): c is ExploreModeTableMetricColumnInput => c !== null),
      additionalMetricColumns: tableAdditionalColumns
        .map((col) => (col.type === 'metric' ? toInput(col) : null))
        .filter((c): c is ExploreModeTableMetricColumnInput => c !== null),
      // Pass the page-level filter so the builder can produce per-column
      // overrides that scope custom-event sidebar dimensions
      // (CustomEventName, AggregationType) to CustomEventsV2 columns only.
      // Without this, picking a custom event for a CustomEventsV2 primary or
      // additional column would silently apply that filter to every other
      // column in the table.
      pageLevelFilter: tableContextFilter,
      // Drives the default sort: time-bucketed → Timestamp asc, cumulative →
      // primary metric desc. Matches the chartContext that flows into the
      // table itself, so URL-driven sharing produces consistent defaults.
      granularity: chartContextWithPresentation.granularity,
    });

    if (!tableConfig) {
      return <div className='padding-medium text-body-medium'>{noTableMetricLabel}</div>;
    }

    const tableContext: RAQIV2TableContext = {
      resource,
      timeSpec: chartContextWithPresentation.timeSpec,
      breakdown,
      granularity: chartContextWithPresentation.granularity,
      filter: tableContextFilter ?? [],
    };

    return (
      <AnalyticsConfigTable
        config={tableConfig}
        tableContext={tableContext}
        onExporterReady={handleTableExporterReady}
      />
    );
  }, [
    isTableMode,
    activeMetricForQuery,
    executionMetric,
    effectiveComputedMetric,
    isOperationsToggleOn,
    resolvedMetricForQuery,
    resource,
    chartContextWithPresentation.timeSpec,
    chartContextWithPresentation.filter,
    chartContextWithPresentation.granularity,
    breakdown,
    derivedSourceColumns,
    tableAdditionalColumns,
    handleTableExporterReady,
    noTableMetricLabel,
  ]);

  const chartOrTable = isTableMode ? tableView : chart;

  const getBreakdownLabel = useCallback(
    (dimension: TRAQIV2Dimension): FormattedText => translate(getDimensionRenderer(dimension).name),
    [translate],
  );

  const filterDrawerDimensions = useMemo(() => {
    const allFilterDims = dimensions
      .filter(
        (dim) =>
          dim !== RAQIV2Dimension.CustomEventName &&
          dim !== RAQIV2UIPseudoDimension.AggregationType,
      )
      .flatMap((dim) => getFilterBarDimensionForRAQIV2Dimension(dim) ?? []);

    // Pseudo-dimensions (e.g. TopCountries) can map to the same filter bar dimension
    // as their underlying dimension (e.g. Country), producing duplicates.
    // Dynamic filter dimensions (e.g., TransactionType, CustomField*) are kept here
    // even in operations mode: the chart-level filter button is wrapped in a
    // SourceMetricContextProvider below that supplies the union of source metrics
    // to useCurrentAnalyticsPageContextMetrics(), which dynamic filter UIs need
    // to fetch their option values.
    return [...new Set(allFilterDims)];
  }, [dimensions]);

  const dispatchSidebarAction = useCallback(
    (action: ChartConfiguratorSidebarAction) => {
      switch (action.type) {
        case 'select-metric':
          setMetric(action.metric);
          return;
        case 'set-computed-metric':
          setComputedMetricWithSmoothing(action.computedMetric);
          return;
        case 'set-source-filter':
          handleSourceChange(action.sourceFilter);
          return;
        case 'set-custom-event-filters':
          onFiltersChange(action.filters);
          return;
        case 'toggle-operations':
          handleOperationsToggleChange(action.isOn);
          return;
        case 'select-chart-type':
          setChartTypeOverride(action.chartType);
          return;
        case 'select-chart-type-with-granularity':
          setChartTypeWithGranularity(action.chartType, action.granularity);
          return;
        case 'select-granularity':
          setGranularity(action.granularity);
          return;
        case 'set-breakdown':
          setBreakdown(action.breakdown);
          return;
        case 'set-overlay-option':
          setOverlayOption(action.overlayOption);
          return;
        case 'set-benchmark-type':
          setBenchmarkOverlayType(action.benchmarkType);
          return;
        case 'set-comparison-offset':
          setComparisonOffset(action.comparisonOffset);
          return;
        case 'set-comparison-custom-start-date':
          setComparisonCustomStartDate(action.comparisonCustomStartDate);
          return;
        case 'set-smoothing-option':
          setSmoothingOption(action.smoothingOption);
          return;
        case 'set-table-additional-columns':
          setTableAdditionalColumns(action.tableAdditionalColumns);
          break;
        default:
          assertUnhandledSidebarAction(action);
      }
    },
    [
      handleOperationsToggleChange,
      handleSourceChange,
      onFiltersChange,
      setBenchmarkOverlayType,
      setBreakdown,
      setChartTypeOverride,
      setChartTypeWithGranularity,
      setComparisonCustomStartDate,
      setComparisonOffset,
      setComputedMetricWithSmoothing,
      setGranularity,
      setMetric,
      setOverlayOption,
      setSmoothingOption,
      setTableAdditionalColumns,
    ],
  );

  // Every prop that's identical between the desktop sidebar and the mobile
  // bottom-sheet sidebar. The two call sites only differ on `variant` (sheet vs
  // inline) and `onCollapse` (desktop only), so we keep just those on the
  // individual elements below.
  const sharedSidebarProps = useMemo<ChartConfiguratorSidebarProps>(
    () => ({
      dispatch: dispatchSidebarAction,
      metricControls: {
        metric,
        computedMetric: effectiveComputedMetric,
        availableMetrics: isTableMode ? tableAvailableMetrics : availableMetrics,
        constraintMetrics: displaySourceMetrics,
        sourceFilterResource: resource,
        sourceFilterDimensionsByMetric,
        ...(isOperationsToggleOn
          ? {
              mode: 'operations' as const,
            }
          : isCustomEventsMode
            ? {
                mode: 'custom-events' as const,
                sourceFilter,
                customEventResource: resource,
                filters,
                autoFocusEventName: didAutoSelectCustomEvents,
              }
            : {
                mode: 'metric' as const,
                sourceFilter,
                filteredMetrics,
              }),
      },
      chartControls: {
        chartType: selectedChartType,
        availableChartTypes,
        supportedChartTypes,
        chartTypeSupport,
      },
      granularityControls: {
        chartContext: sidebarChartContext,
        granularitySelection,
      },
      breakdownControls: {
        breakdownDimensions,
        breakdown,
        getBreakdownLabel,
      },
      overlayControls: {
        isEnabled: true,
        overlayOption,
        benchmarkType: benchmarkOverlayType,
        availableBenchmarkTypes,
        comparisonOffset,
        comparisonCustomStartDate,
        overlayAvailability: effectiveOverlayAvailability,
      },
      smoothingControls: {
        smoothingOption,
        isL7SmoothingDisabled: isL7SmoothingDisabledFlag,
        l7SmoothingDisabledReason,
      },
      tableControls: isTableMode
        ? {
            mode: 'table',
            tableAdditionalColumns,
            tablePrimaryColumnCount: 1 + derivedSourceColumns.length,
          }
        : { mode: 'chart' },
    }),
    [
      availableBenchmarkTypes,
      availableChartTypes,
      availableMetrics,
      benchmarkOverlayType,
      breakdown,
      breakdownDimensions,
      chartTypeSupport,
      comparisonCustomStartDate,
      comparisonOffset,
      derivedSourceColumns.length,
      didAutoSelectCustomEvents,
      dispatchSidebarAction,
      displaySourceMetrics,
      effectiveComputedMetric,
      effectiveOverlayAvailability,
      filteredMetrics,
      filters,
      getBreakdownLabel,
      granularitySelection,
      isCustomEventsMode,
      isL7SmoothingDisabledFlag,
      isOperationsToggleOn,
      isTableMode,
      l7SmoothingDisabledReason,
      metric,
      overlayOption,
      resource,
      selectedChartType,
      sidebarChartContext,
      smoothingOption,
      sourceFilter,
      sourceFilterDimensionsByMetric,
      supportedChartTypes,
      tableAdditionalColumns,
      tableAvailableMetrics,
    ],
  );

  // "Create alert" deep link for the current Explore Mode selection. There's no
  // predefined-chart spec here, so synthesize one from the live chart context +
  // display metric. Gated to simple (non-computed) metrics — alerts can't target
  // a formula — and the hook returns undefined (item hidden) when the
  // user/universe/metric aren't alert-eligible.
  const createAlertSpec = useMemo(
    () =>
      displayMetric && !isActiveMetricComputed ? { ...chartContext, metric: displayMetric } : null,
    [chartContext, displayMetric, isActiveMetricComputed],
  );
  const createAlertAction = useCreateAlertAction(createAlertSpec);
  const createAlertLabel = translate(
    translationKey('Action.CreateAlertFromChart', TranslationNamespace.Analytics),
  );
  const openCreateAlert = useCallback(() => {
    if (createAlertAction) {
      window.open(createAlertAction.href, '_blank', 'noopener,noreferrer');
    }
  }, [createAlertAction]);

  const addToDashboardMissingMetricLabel = tPendingTranslation(
    'Pick a metric first',
    'Tooltip explaining why Explore Mode cannot add the current chart to a custom dashboard yet.',
    translationKey('Description.AddToDashboardMissingMetric', TranslationNamespace.Analytics),
  );
  const addToDashboardInvalidFormulaLabel = tPendingTranslation(
    'Fix the formula before adding this chart.',
    'Tooltip explaining that a computed metric chart must be valid before it can be added to a dashboard.',
    translationKey('Description.AddToDashboardInvalidFormula', TranslationNamespace.Analytics),
  );
  const addToDashboardUnsupportedLabel = tPendingTranslation(
    "This chart can't be added to a dashboard yet.",
    'Tooltip explaining that the current Explore Mode chart configuration cannot be persisted to a custom dashboard.',
    translationKey('Description.AddToDashboardUnsupportedChart', TranslationNamespace.Analytics),
  );

  const capturedDashboardTile = useMemo<ChartTileConfig | null>(() => {
    if (!displayMetric || !resolvedMetricForQuery || isComputedMetricError) {
      return null;
    }
    return buildChartTileFromEditor({
      tileId: createTileId(),
      metric: displayMetric,
      metricVariant: customEventFiltersToMetricVariant(filters),
      computedMetric: isActiveMetricComputed ? effectiveComputedMetric : null,
      chartType: selectedChartType,
      breakdownDimension: breakdown[0],
      granularity: chartContext.granularity,
      overlayOption,
      benchmarkType: benchmarkOverlayType,
      comparisonOffset,
      comparisonCustomStartDate,
      smoothingOption: isL7SmoothingEnabled ? smoothingOption : 'none',
      filters,
      tableAdditionalColumns,
    });
  }, [
    benchmarkOverlayType,
    breakdown,
    chartContext.granularity,
    comparisonCustomStartDate,
    comparisonOffset,
    displayMetric,
    effectiveComputedMetric,
    filters,
    isActiveMetricComputed,
    isComputedMetricError,
    isL7SmoothingEnabled,
    overlayOption,
    resolvedMetricForQuery,
    selectedChartType,
    smoothingOption,
    tableAdditionalColumns,
  ]);
  const addToDashboardDisabledReason = !displayMetric
    ? addToDashboardMissingMetricLabel
    : isComputedMetricError
      ? addToDashboardInvalidFormulaLabel
      : capturedDashboardTile
        ? undefined
        : addToDashboardUnsupportedLabel;

  // The action list is the single source of truth for the page header
  // CTAs. Order in this array matches left-to-right order in the rendered
  // header for inline buttons; menu items collect into the overflow popover
  // in declaration order. See ExploreModeCTAs for the action shape.
  //
  // Promotion rules encoded here:
  //   • View Events takes the primary slot whenever it's visible (custom
  //     events / economy / funnel metrics). The component itself returns
  //     null for other metrics, so listing it unconditionally is safe.
  //   • Share takes the primary slot in all other cases. When View Events
  //     is visible, Share collapses into the overflow menu.
  //   • Close is always Standard — it's a navigational escape hatch, not
  //     a primary action.
  const ctaActions = useMemo<readonly ExploreModeCtaAction[]>(() => {
    const items: ExploreModeCtaAction[] = [];

    items.push({
      kind: 'view-events',
      id: 'view-events',
      variant: 'Emphasis',
      metric: displayMetric,
    });

    if (showViewEvents) {
      items.push({
        kind: 'menu-item',
        id: 'share',
        label: shareLabel,
        onSelect: handleShare,
        // The menu closes on select, so CTAs flashes "Copied!" on the
        // overflow trigger instead of on the item itself.
        feedback: { selectedLabel: copiedLabel },
      });
    } else {
      items.push({
        kind: 'button',
        id: 'share',
        variant: 'Emphasis',
        label: shareLabel,
        onClick: handleShare,
        feedback: {
          hoverLabel: shareTooltipLabel,
          selectedLabel: copiedLabel,
        },
      });
    }

    if (isCustomDashboardsEnabled) {
      items.push({
        kind: 'custom-button',
        id: 'add-to-dashboard',
        variant: 'Standard',
        render: () => (
          <AddToDashboardPickerCta
            universeId={resource.id}
            capturedTile={capturedDashboardTile}
            isDisabled={!capturedDashboardTile}
            disabledReason={addToDashboardDisabledReason}
          />
        ),
      });
    }

    items.push({
      kind: 'button',
      id: 'close',
      variant: 'Standard',
      label: closeLabel,
      href: closeHref,
    });

    // oxlint-disable-next-line react/react-compiler -- `handleExport` reads the exporter getter from a ref, but only inside the onSelect callback (at click time, not during render), which is the intended ref usage
    items.push({
      kind: 'menu-item',
      id: 'download-csv',
      label: downloadCsvLabel,
      disabled: !canExport,
      onSelect: handleExport,
    });

    if (createAlertAction) {
      items.push({
        kind: 'menu-item',
        id: 'create-alert',
        label: createAlertLabel,
        onSelect: openCreateAlert,
      });
    }

    if (isChartOverflowMenuEnabled) {
      items.push({
        kind: 'menu-item',
        id: 'view-source-query',
        label: viewSourceQueryLabel,
        disabled: !chartSpec,
        onSelect: handleOpenSourceDialog,
      });
    }

    return items;
  }, [
    displayMetric,
    showViewEvents,
    shareLabel,
    shareTooltipLabel,
    copiedLabel,
    handleShare,
    closeLabel,
    closeHref,
    downloadCsvLabel,
    canExport,
    handleExport,
    createAlertAction,
    createAlertLabel,
    openCreateAlert,
    resource.id,
    capturedDashboardTile,
    addToDashboardDisabledReason,
    isCustomDashboardsEnabled,
    isChartOverflowMenuEnabled,
    viewSourceQueryLabel,
    chartSpec,
    handleOpenSourceDialog,
  ]);

  const sidebarPropsForShell = isMobile
    ? { ...sharedSidebarProps, variant: 'sheet' as const }
    : sharedSidebarProps;

  const topBarSlot = (
    <div className={`${topBar} gap-medium padding-y-large`}>
      <div className={`${topBarLeft} gap-medium`}>
        <ChartConfiguratorDateRangeControl dateRangeOptions={dateRangeOptions} />
        {filterDrawerDimensions.length > 0 && (
          <SourceMetricContextProvider metrics={chartContextApiMetrics}>
            <ExplorePageFilterButton
              resource={resource}
              dimensions={filterDrawerDimensions}
              filters={filters}
              onFiltersChange={onFiltersChange}
              onResetAllFilters={clearAllFilters}
            />
          </SourceMetricContextProvider>
        )}
        {!isMobile && isSidebarCollapsed && (
          <div className={configureIconWrapper}>
            <Tooltip
              title={showCollapseNux ? configureNuxTooltipLabel : configureIconAriaLabel}
              position='bottom-center'
              delayDurationMs={showCollapseNux ? 0 : undefined}
              open={showCollapseNux || undefined}>
              <TooltipTrigger asChild>
                <IconButton
                  variant='Standard'
                  size='Medium'
                  icon='icon-regular-three-sliders-horizontal'
                  ariaLabel={configureIconAriaLabel}
                  onClick={handleExpandSidebar}
                />
              </TooltipTrigger>
            </Tooltip>
          </div>
        )}
      </div>
      <div className={`${topBarRight} gap-medium`}>
        <ExploreModeAnnotationsControl
          resourceType={resource.type}
          className={`${topBarDropdownWrapper} gap-xsmall`}
          selectedAnnotationOptions={annotationOptions}
          onAnnotationOptionsChange={setAnnotationOptions}
        />
        {isMobile && (
          <div className={configureIconWrapper}>
            <Tooltip title={configureIconAriaLabel} position='bottom-center'>
              <TooltipTrigger asChild>
                <IconButton
                  variant='Standard'
                  size='Medium'
                  icon='icon-regular-three-sliders-horizontal'
                  ariaLabel={configureIconAriaLabel}
                  onClick={handleOpenConfigureSheet}
                />
              </TooltipTrigger>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );

  const preview = (
    <>
      {filterDrawerDimensions.length > 0 && (
        <div className='padding-top-small'>
          <ExperienceAnalyticsFilterChips
            dimensions={filterDrawerDimensions}
            knownRAQIDimensionsShownElsewhere={sourceOwnedFilterDimensions}
          />
        </div>
      )}

      <div className={`${chartBody} padding-bottom-xxlarge`}>
        {chartOrTable ?? (
          <ExploreModeChartEmptyState
            titleLabel={
              isOperationsToggleOn
                ? (builderFormulaLabel ?? untitledFormulaLabel)
                : emptyStateTitleLabel
            }
            subtitleLabel={emptyStateSubtitleLabel}
            isError={isComputedMetricError}
            errorDescription={isComputedMetricError ? computedMetricErrorDescription : undefined}
          />
        )}
      </div>
    </>
  );

  const pageContent = (
    <div className={root}>
      <div className={`${headerRow} gap-medium margin-bottom-medium`}>
        <div className={`${headerTitleBlock} gap-xxsmall`}>
          {/* The Hub page chrome already renders the "Explore" page title
              in the standard layout, so we only show the subtitle here. */}
          <p className={subtitle}>{exploreSubtitleLabel}</p>
        </div>
        <ExploreModeCTAs actions={ctaActions} moreOptionsLabel={moreOptionsLabel} />
      </div>
      <ChartConfigurator
        className={configuratorShell}
        contentClassName={layout}
        sidebarProps={sidebarPropsForShell}
        topBarSlot={topBarSlot}
        preview={preview}
        previewClassName={isMobile ? mobileChartArea : chartArea}
        renderSidebar={({ sidebar, sidebarProps }) => {
          if (isMobile) {
            return (
              <ExploreModeMobileWrapper
                isOpen={isConfigureSheetOpen}
                onOpenChange={setIsConfigureSheetOpen}>
                {sidebar}
              </ExploreModeMobileWrapper>
            );
          }

          if (isSidebarCollapsed) {
            return null;
          }

          return <ChartConfiguratorSidebar onCollapse={handleCollapseSidebar} {...sidebarProps} />;
        }}
      />
    </div>
  );

  return (
    <>
      {pageContent}
      <Dialog
        open={sourceDialogOpen}
        onClose={handleCloseSourceDialog}
        maxWidth='Medium'
        fullWidth
        data-testid='explore-mode-source-query-dialog'>
        <DialogTitle>{viewSourceQueryLabel}</DialogTitle>
        <DialogContent>
          <CodeEditor
            value={specJson}
            readOnly
            language={CodeEditorSupportedLanguages.Json}
            height='400px'
          />
        </DialogContent>
        <DialogActions>
          <MuiButton
            onClick={handleCopySpec}
            variant='contained'
            color='primary'
            startIcon={<FileCopyOutlinedIcon />}
            data-testid='explore-mode-source-query-copy'>
            {isCopied ? copiedLabel : copyLabel}
          </MuiButton>
          <MuiButton onClick={handleCloseSourceDialog} variant='contained' color='secondary'>
            {closeLabel}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

const ExploreModeSidebarPage: FC = () => {
  const { preset, allowedMetrics, featureFlagsFetched, priorUri, clearPreset } =
    useExperienceAnalyticsExploreModeContext();
  const controlledConfigurator = useExploreControlledChartConfiguratorCoreUrlSync({
    allowedMetrics,
    availableChartTypes: ChartConfiguratorChartTypeOrder,
    featureFlagsFetched,
  });
  const { metric, computedMetric } = controlledConfigurator.state;
  const executionMetric: MetricLike | null = computedMetric ?? metric;
  const metricDerivation = useMemo(
    () =>
      deriveControlledChartConfiguratorMetrics({
        executionMetric,
        fallbackMetric: metric,
        allowedMetrics,
      }),
    [allowedMetrics, executionMetric, metric],
  );
  // Stabilize the array reference: the shared derivation returns a new array on
  // every call even when contents are identical. Without this, every
  // formula-name keystroke cascades through useCurrentChartContext → chartSpec
  // → chart useMemo.
  const displaySourceMetrics = useStableArray(metricDerivation.displaySourceMetrics);
  const displayMetric = useMemo((): TChartConfiguratorMetrics | null => {
    if (!displaySourceMetrics.length) {
      return null;
    }
    if (metric && displaySourceMetrics.some((sourceMetric) => sourceMetric === metric)) {
      return metric;
    }
    return displaySourceMetrics[0];
  }, [displaySourceMetrics, metric]);
  const { hasUnsupportedSourceMetrics, hasSharedDateRanges, dateRangeOptions } = metricDerivation;

  const dimensions = useMemo(() => {
    return getSharedChartConfiguratorDimensions(displaySourceMetrics);
  }, [displaySourceMetrics]);

  const timeRangeOptions: AnalyticsPageConfigDateOptions = useMemo(() => {
    const baseRanges = [...dateRangeOptions];
    // Always allow Custom: a metric's `supportedDateRangeTypes` enumerates the
    // relative-range presets shown in the picker, but Custom is rendered as a
    // separate calendar entry and is also how deep links from other surfaces
    // pass an explicit min/max time. Without it here, PageConfigAwareDateRange
    // sees `rangeType=Custom` in the URL, treats it as unsupported, and snaps
    // back to the first preset — silently dropping the carried-over range.
    const supportedRanges = baseRanges.includes(RAQIV2DateRangeType.Custom)
      ? baseRanges
      : [...baseRanges, RAQIV2DateRangeType.Custom];
    const defaultRange = supportedRanges.includes(RAQIV2DateRangeType.Last28Days)
      ? RAQIV2DateRangeType.Last28Days
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
  // Per-source-card filter drawers are wrapped in SourceMetricContextProvider
  // (see ChartConfiguratorMetricSourceCard), so dynamic filter dimensions like
  // TransactionType, CustomField1-3, and ItemSku resolve their option queries
  // against the source's specific metric. Unlike the chart-level filter drawer
  // (filterDrawerDimensions above), we keep dynamic dimensions here so source
  // cards expose event-specific filters (e.g., Economy/transaction events).
  //
  // CustomEventName is excluded as a defensive measure (it is already marked
  // isExploreModeDisabled in the codegen config). AggregationType is only
  // suppressed for CustomEventsV2 because that source card has a dedicated
  // Aggregation control in ChartConfiguratorCustomEventControls; other metrics that
  // happen to support AggregationType still get it as a regular filter
  // dimension because they have no equivalent dedicated control.
  const sourceFilterDimensionsByMetric = useMemo<SourceFilterDimensionsByMetric>(() => {
    const chartConfiguratorDimensions = getChartConfiguratorDimensions();

    return allowedMetrics.reduce((acc, allowedMetric) => {
      const metricDimensions = chartConfiguratorDimensions[allowedMetric] || [];
      const filterDimensions = [
        ...new Set(
          metricDimensions
            .filter((dim) => {
              if (dim === RAQIV2Dimension.CustomEventName) {
                return false;
              }
              if (
                dim === RAQIV2UIPseudoDimension.AggregationType &&
                allowedMetric === RAQIV2UIMetric.CustomEventsV2
              ) {
                return false;
              }
              return true;
            })
            .flatMap((dimension) => getFilterBarDimensionForRAQIV2Dimension(dimension) ?? []),
        ),
      ];
      if (filterDimensions.length > 0) {
        acc[allowedMetric] = filterDimensions;
      }
      return acc;
    }, {} as SourceFilterDimensionsByMetric);
  }, [allowedMetrics]);

  const resource = useUniverseResource();
  const { value: isExperienceAlertsEnabledFlag, ready: isExperienceAlertsFlagReady } = useFlag(
    isExperienceAlertsEnabled,
    {
      universeId: resource.id,
    },
  );
  const surfaceAnnotationOptions = useMemo(
    () => getExploreSurfaceAnnotationOptions(!!isExperienceAlertsEnabledFlag),
    [isExperienceAlertsEnabledFlag],
  );
  const pageConfig: CreatorAnalyticsPageSurfaceConfig = useMemo(
    () => ({
      resourceTypes: [resource.type],
      filterDimensions: dimensions,
      breakdownDimensions: dimensions,
      timeRangeOptions,
      surfaceAnnotationOptions,
      body: [],
    }),
    [resource.type, dimensions, timeRangeOptions, surfaceAnnotationOptions],
  );

  // Defer mount until the experience-alerts flag has resolved: the layout's
  // annotation provider snapshots `defaultAnnotationTypes` to the URL on first
  // render, and a stale `false` would silently drop ConfiguredAlertIncident.
  if (!isExperienceAlertsFlagReady) {
    return null;
  }

  const sidebarPageContent = (
    <SidebarPageContent
      controlledConfigurator={controlledConfigurator}
      displayMetric={displayMetric}
      displaySourceMetrics={displaySourceMetrics}
      hasUnsupportedSourceMetrics={hasUnsupportedSourceMetrics}
      hasSharedDateRanges={hasSharedDateRanges}
      preset={preset}
      dimensions={dimensions}
      resource={resource}
      dateRangeOptions={dateRangeOptions}
      availableMetrics={[...allowedMetrics]}
      sourceFilterDimensionsByMetric={sourceFilterDimensionsByMetric}
      priorUri={priorUri}
      clearPreset={clearPreset}
    />
  );

  return (
    <UniversePerformanceRaqiClientProvider>
      <AnalyticsContextLayerInnerProvider config={pageConfig}>
        {isExperienceAlertsEnabledFlag ? (
          // Only mount the alert-selection provider when the
          // `isExperienceAlertsEnabled` flag is on — this keeps the entire
          // `?annotation_alertId` reading / cascading sub-menu feature
          // behind the same flag as the rest of Experience Alerts. When
          // the flag is off, the context falls back to its
          // `isExploreModeContext: false` default and Explore Mode
          // behaves exactly like the other (non-Explore) pages with
          // respect to configured-alert incidents.
          //
          // `AnalyticsAlertClientProvider` is required here for
          // `useAlertsForMetric` (the hook that populates the cascading
          // sub-menu's row list) to actually fetch configured alerts —
          // unlike `ConfiguredAlertIncident` annotations, which come from
          // the existing `AnnotationsClient`, the alert *configuration*
          // list goes through the alert control-plane client. Without
          // this wrapper, `useAnalyticsAlertsListQuery` short-circuits
          // (its hook reads `useAnalyticsAlertClientOrNull`), the
          // available-alerts set stays empty, and the parent menu's
          // Alerts row is hidden by the
          // `availableAlertsForMetric.length > 0` gate even when the
          // chart is correctly rendering URL-pre-pinned incidents.
          <AnalyticsAlertClientProvider client={analyticsAlertControlPlaneClient}>
            <ExploreModeAlertSelectionProvider displayMetric={displayMetric}>
              {sidebarPageContent}
            </ExploreModeAlertSelectionProvider>
          </AnalyticsAlertClientProvider>
        ) : (
          sidebarPageContent
        )}
      </AnalyticsContextLayerInnerProvider>
    </UniversePerformanceRaqiClientProvider>
  );
};

export default withTranslation(ExploreModeSidebarPage, [
  ...wellKnownAnalyticsTranslationNamespaces,
]);
