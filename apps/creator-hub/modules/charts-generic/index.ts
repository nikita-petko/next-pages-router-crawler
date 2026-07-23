/**
 * The charts-generic module contains components and utilities that are to be
 * shared across all anticipated usages of charts.
 *
 * Usages that are tied to an experience should go into
 * @modules/experience-analytics-shared.
 *
 * The primary analytics pages should go into @modules/experience-analytics.
 */

/**
 * TODO(gperkins@ 20230612): Refactor to directly export subHours and
 * getCurrentDate from dateUtils
 */
import dateUtils from './utils/dateUtils';

const { getCurrentDate, subHours, getCurrentHourDate } = dateUtils;

/**
 * Exported values
 */
export { default as TimeSeriesChartExportButton } from './charts/TimeSeriesChartExportButton';
export { default as ChartFooter } from './charts/ChartFooter';
export { default as ChartHeader } from './charts/ChartHeader';
export { default as ChartSummary } from './charts/ChartSummary';
export {
  default as ChartSummaryItem,
  isNumericChartSummaryItemSpec,
  filterNumericChartSummaryItemSpecs,
} from './charts/ChartSummaryItem';
export { default as ComparisonChip } from './charts/ComparisonChip';
export { default as DateRangePicker } from './charts/DateRangePicker';
export { default as MonthRangePicker } from './charts/MonthRangePicker';
export { default as LocalizingDatePicker } from './charts/LocalizingDatePicker';
export {
  default as TableExportButton,
  type TableExportButtonProps,
} from './charts/TableExportButton';
export { insightsChartColor } from './charts/constants';
export {
  formatDateRange,
  formatSingleDate,
  badlyMisnamedFormatLocalizedDateValueFromUTCToUserTimezone,
  formatTimestamp,
  makeFormatterWithOptions,
  formatMediumDateInUTC,
  formatDateInUTCWithCurrentYearHidden,
  formatTimestampForChartTooltip,
} from './charts/formatters';
export {
  // eslint-disable-next-line deprecation/deprecation -- migration in progress. Will be removed in DSA-4660.
  formatNumber,
  formatNumberWithSpec,
  NumberFormatterSpecDynamicOverrides,
  getFallbackNoDataSeriesValue,
  NumberContext,
  formatAbbreviatedNumber,
  NumberIcon,
} from './charts/numberFormatters';
export { percentageFormattingSpec } from './constants/analyticsNumberFormattingSpec';
export { default as formatChartUnit } from './charts/formatChartUnit';
export type { TNumberContextMetadata, TFormattingSpec } from './charts/numberFormatters';
export { default as ChartSummaryType } from './enums/ChartSummaryType';
export { default as GenericChartWrapper } from './charts/GenericChartWrapper';
export { default as GenericTableBodyWrapper } from './tables/GenericTableBodyWrapper';
export { default as GenericTableHeaderRows } from './tables/GenericTableHeaderRow';
export { default as GenericTablePagination } from './tables/GenericTablePagination';
export { default as GenericTable } from './tables/GenericTable';
export { default as GenericTableRow } from './tables/GenericTableRow';
export { default as GenericTableCell } from './tables/GenericTableCell';
export { default as GenericTableV2 } from './tables/GenericTableV2';
export { default as GenericTabs } from './tables/GenericTabs/GenericTabs';
export { default as GenericSummaryCard } from './cards/summaryCards/GenericSummaryCard';
export { default as GenericCardContentWrapper } from './cards/GenericCardContentWrapper';
export { default as MultiSelect } from './components/MultiSelect';
export {
  default as ComboboxTypeahead,
  ComboboxTypeaheadOption,
  type ComboboxTypeaheadProps,
  type ComboboxTypeaheadOptionProps,
} from './components/ComboboxTypeahead';
export { default as BenchmarkStaticSlider } from './components/BenchmarkStaticSlider/BenchmarkStaticSlider';
export { default as SummaryItem } from './components/SummaryItem';
export { default as BenchmarkScoreCard } from './components/BenchmarkScoreCard/BenchmarkScoreCard';

export { default as FilterDrawer } from './components/FilterDrawer/FilterDrawer';
export { default as FilterDrawerButton } from './components/FilterDrawer/FilterDrawerButton';
export { default as FilterDrawerEnumChoice } from './components/FilterDrawer/FilterDrawerEnumChoice';
export { default as FilterDrawerStringChoice } from './components/FilterDrawer/FilterDrawerStringChoice';
export { default as FilterDrawerTextChoice } from './components/FilterDrawer/FilterDrawerTextChoice';
export { default as FilterChip } from './components/FilterChip';
export { default as FilterStringChoice, BlankHandlingType } from './components/FilterStringChoice';
export { default as FilterDrawerGroup } from './components/FilterDrawer/FilterDrawerGroup';
export * from './components/FilterDrawer/DialogEventEmitter';
export * from './context/FilterDrawerEventEmitterContext';
export { default as AutocompleteChoiceControl } from './components/AutocompleteChoiceControl';
export * from './components/StatusBanner';

export { default as getTypeLegendDescription } from './charts/TimeSeriesRangeAnnotationLegend';
export { useXAxisFormatter } from './charts/formatters';
export { default as useTimeSeriesChartTooltipFormatters } from './charts/hooks/useTimeSeriesChartTooltipFormatters';
export { default as useTimeSeriesChartYAxisConfig } from './charts/hooks/useTimeSeriesChartYAxisConfig';
export {
  default as useChartSummarySpecs,
  getSummarySpec,
} from './charts/hooks/useChartSummarySpecs';
export { SummaryValueType } from './charts/ChartSummaryItem';

export { makeDurationFormatter } from './charts/formatters';
export { default as useChartColors } from './charts/hooks/useChartColors';

export {
  ChartUnit,
  ChartUnitAggregationType,
  ChartType,
  type TExplicitTimeRangeSpec,
  type TLabeledExplicitTimeRangeSpec,
} from './charts/types/ChartTypes';
export { default as useLocale } from './context/useLocale';
export { default as SeriesTypes } from './charts/types/SeriesTypes';
export type { GenericSeriesInfo } from './charts/types/SeriesTypes';
export { AnalyticsPageDescription } from './layout/AnalyticsPageDescription';

export type { AnalyticsDocLink } from './types/AnalyticsDocLink';
export { AnalyticsPageLayout } from './layout/AnalyticsPageLayout';
export { AnalyticsPageTitle } from './layout/AnalyticsPageTitle';
export { AnalyticsPageAction } from './layout/AnalyticsPageAction';
export { default as AnalyticsPageSummaryContainer } from './layout/AnalyticsPageSummaryContainer';
export { RAQIValidationError } from './types/RAQIValidator';
export { validateResponse } from './types/RAQIValidator';
export { getMinDate } from './utils/datePickerUtilities';
export { dateUtils };
export {
  earlierDate,
  laterDate,
  formatDateFromNow,
  formatDateRangeForKey,
} from './utils/dateUtils';
export { getCurrentDate, subHours, getCurrentHourDate };
export { default as priorTimestamp } from './utils/priorTimestamp';
export {
  getComparisonTimeRange,
  comparisonTimeRangeOffset,
  getComparisonChipSpec,
  getComparisonChipTooltip,
} from './utils/comparisonChipUtils';
export { default as buildExperienceAnalyticsUrlWithParams } from './utils/analyticsUrlBuilder';
export { default as ordinalizePercentileByLocale } from './utils/ordinalizePercentileByLocale';

export {
  processTimestamps,
  ingestRAQIMetricValues,
  sortTotalBreakdownFirst,
  buildSeriesInfo,
  buildSingleSeriesInfo,
  totalDatapointsAcrossSeries,
  getTotalFromPointsSeries,
  summarizeSeriesDataPoints,
  InfillBehavior,
} from './adapters/genericRAQIChartAdapter';
export { getRAQISumTotalValueWithComparison } from './adapters/RAQISummaryAdapters';
export { getSeriesByBreakdown, raqiDatapointsToTimeSeriesData } from './adapters/raqiAdapterUtils';
export {
  generateMockDataSeries,
  makeStackedColumnChartSpec,
  makeSplineChartSpec,
} from './utils/makeTestData';
export { alignToUTCMidnight } from './utils/datePickerUtilities';
export { ListTag, ListItemTag, BoldTag } from './utils/translateHTMLTags';

export { default as useLocalPaginatedAdapter } from './tables/hooks/useLocalPaginatedAdapter';

export { default as useComponentSize } from './components/useComponentSize';

/**
 * TODO(gperkins@ 20230412): move these to experience-analytics-shared
 *
 * NOTE(gperkins@ 20230614): I am not so sure about that any more, since
 * Date/Time-related stuff is probably needed by all the consumers of this
 * module.
 */
export { default as dateRangeOffsetDays } from './constants/dateRangeOffsetDays';
export { default as singleDateOffsetDays } from './constants/singleDateOffsetDays';
export { default as dateRangeStrings } from './constants/dateRangeStrings';
export { default as singleDateStrings } from './constants/singleDateStrings';

export {
  default as AnalyticsQueryDateRangeBundleContext,
  useAnalyticsCurrentDateRangeBundle,
} from './context/AnalyticsQueryDateRangeBundleContext';
export {
  default as AnalyticsQuerySingleDateBundleContext,
  useAnalyticsCurrentSingleDateBundle,
} from './context/AnalyticsQuerySingleDateBundleContext';
export { type AnalyticsDateRangeBundle } from './context/AnalyticsQueryDateRangeBundleContext';
export { default as AnalyticsQueryParams } from './enums/AnalyticsQueryParams';
export { default as DateRangeType } from './enums/DateRangeType';
export { default as SingleDateType } from './enums/SingleDateType';

export {
  useIsInAnalyticsExploreMode,
  AnalyticsExploreModeProvider,
} from './context/AnalyticsExploreModeContext';

export {
  type AnalyticsNavigationItem,
  getAnalyticsNavigationItemFromPath,
  analyticsItemMonetizationDeveloperProductsNavigationItem,
  analyticsItemMonetizationPassesNavigationItem,
  analyticsItemMonetizationAvatarItemsNavigationItem,
  analyticsItemAnalyticsNavigationItem,
  analyticsImmersiveAdsNavigationItem,
  analyticsSubscriptionsNavigationItem,
  analyticsMemoryStoresNavigationItem,
  analyticsDataStoresNavigationItem,
  analyticsHttpServiceNavigationItem,
  analyticsMessagingServiceNavigationItem,
  analyticsSpeechToTextNavigationItem,
  analyticsTextToSpeechNavigationItem,
  analyticsExperienceCreatorRewardsNavigationItem,
  analyticsPerformanceNavigationItem,
  analyticsAvatarCreationTokensNavigationItem,
  analyticsCrashesNavigationItem,
  analyticsErrorReportNavigationItem,
  analyticsAudienceNavigationItem,
  analyticsRecommendedEventsEconomyNavigationItem,
  analyticsRecommendedEventsFunnelsNavigationItem,
  analyticsExploreNavigationItem,
  analyticsRetentionNavigationItem,
  analyticsEngagementNavigationItem,
  analyticsUserAcquisitionNavigationItem,
  analyticsUserAcquisitionRFYNavigationItem,
  analyticsCustomEventsNavigationItem,
  analyticsFeedbackNavigationItem,
  analyticsConfigsHistoryNavigationItem,
  analyticsConfigsNavigationItem,
  analyticsConfigCreateNavigationItem,
  analyticsMatchmakingNavigationItem,
  analyticsCommerceNavigationItem,
  analyticsAssistantNavigationItem,
  analyticsAiChatNavigationItem,
  analyticsExperimentsNavigationItem,
  analyticsExperimentsCreateNavigationItem,
  analyticsRecommendationServiceNavigationItem,
  analyticsSafetyNavigationItem,
  analyticsCreationOverviewNavigationItem,
  analyticsMonetizationNavigationItem,
  analyticsAnalyticsHomeNavigationItem,
  analyticsThumbnailsNavigationItem,
  analyticsNotificationsNavigationItem,
  analyticsExperienceSubscriptionsNavigationItem,
  analyticsAlertsNavigationItem,
  analyticsAlertCreationNavigationItem,
  analyticsAlertConfifurationNavigationItem,
} from './constants/analyticsNavigationItems';

export { default as useAnalyticsPageStyles } from './layout/AnalyticsPage.styles';
export { default as useAnalyticsPageSummaryStyles } from './layout/AnalyticsPageSummary.styles';
export { default as LegacyEngagementPayoutsMetric } from './constants/LegacyEngagementPayoutsMetric';
export { default as XAxisGranularity, getXAxisGranularity } from './enums/XAxisGranularity';

export { useAnnotationsClient } from './context/AnnotationsClientProvider';
export {
  CreatorAnnotationsClientContext,
  CreatorAnnotationsClientProvider,
} from './context/annotations/CreatorAnnotationsClientProvider';
export {
  UniverseAnnotationsClientContext,
  UniverseAnnotationsClientProvider,
} from './context/annotations/UniverseAnnotationsClientProvider';
export type { AnnotationsClientProviderState } from './types/AnnotationsClientProviderState';

export { default as DebouncedTextField } from './charts/DebouncedTextField';

export { default as MetricValue, noDataSymbol } from './components/MetricValue/MetricValue';

export {
  DailyTimeSeriesAlignedToUTCMidnight,
  ThirtyMinutelyTimeSeriesAlignedToTheHour,
  HourlyTimeSeriesAlignedToTheHour,
  OneMinutelyTimeSeriesAlignedToTheMinute,
  WeeklyTimeSeriesAlignedToUTCMidnight,
  MonthlyTimeSeriesAlignedToUTCFirstDayMidnight,
  SeriesIntervalAlignment,
  millisecondsInInterval,
  EntireRangeInterval,
  shouldAlignComparisonSeriesEndWithMainSeriesStart,
} from './enums/SeriesIntervalMeaning';

export { default as logAnalyticsError } from './utils/logAnalyticsError';

export { default as useHoverImpressionObserver } from './charts/hooks/useHoverImpressionObserver';
export { default as useImpressionObserver } from './charts/hooks/useImpressionObserver';

export { isNonEmptyArray, mapNonEmptyArray, flatMapNonEmptyArray } from './types/NonEmptyArray';

export { default as InputFieldWrapper } from './components/InputFieldWrapper';
export { default as CodeEditor } from './components/CodeEditors/CodeEditor';
export { default as DiffCodeEditor } from './components/CodeEditors/DiffCodeEditor';
export { default as CodeEditorSupportedLanguages } from './components/CodeEditors/CodeEditorSupportedLanguages';

/**
 * Exported types
 */
export type {
  ChartSummaryItemSpec,
  NumericChartSummaryItemSpec,
  StringChartSummaryItemSpec,
} from './charts/ChartSummaryItem';
export type { ChartFooterActionLink } from './charts/ChartFooter';
export type { ComparisonChipSpec } from './charts/ComparisonChip';
export type { RangeFormatterFn, TRangeBenchmarkSpec } from './charts/types/RangeBenchmarkSpec';
export type {
  ChartUnitFormatted,
  GenericChartState,
  ChartEventLoggers,
} from './charts/types/ChartTypes';
export type { SplineChartTimeseriesData } from './charts/types/TimeSeriesSplineChartTypes';
export type { TimeSeriesAnnotation, TAnnotationId } from './charts/types/Annotations';
export { AlertAnnotationSeverity } from './charts/types/Annotations';

export type {
  SplineChartTimeseriesDataPoint,
  SplineChartTimeseriesList,
  SplineChartTimeSeriesNamedData,
  TimeSeriesSplineChartSpec,
} from './charts/types/TimeSeriesSplineChartTypes';

export type { SeriesMetadata, BenchmarkSeriesMetadata } from './charts/types/SeriesMetadata';

export { DurationBucketType } from './charts/types/DurationSplineChartTypes';
export type {
  DurationBucket,
  DurationSeriesDataPoint,
  DurationSplineChartSpec,
  DurationSeriesInfo,
} from './charts/types/DurationSplineChartTypes';
export type { TimeComparatorChartSpec } from './charts/types/TimeComparatorTypes';
export type { TimeSeriesWithinRangeSplineChartSpec } from './charts/types/TimeSeriesSplineChartTypes';
export type { TimeSeriesStackedColumnChartSpec } from './charts/types/TimeSeriesStackedColumnChartTypes';
export type {
  Value,
  Timestamp,
  TimeSeriesDataPoint,
  TimeSeriesData,
  TimeSeriesRangeTagData,
  TimeSeriesNamedData,
  TimeSeriesChartUnitSpec,
  GenericTimeSeriesChartSpec,
  TimeSeriesInfo,
  TagFormatterFn,
} from './charts/types/TimeSeriesTypes';
export type { ValidatorConfig } from './types/RAQIValidator';
export type {
  SeriesDataPoints,
  BreakdownSpec,
  PointsBySeries,
  SingleSeriesInfo,
  SortedSeriesInfo,
} from './adapters/genericRAQIChartAdapter';
export type {
  BarSeriesNamedDatapoint,
  BarSeriesEntry,
} from './charts/types/HorizontalBarChartTypes';
export type { ColumnSeriesEntry } from './charts/types/ColumnChartTypes';

export type {
  RAQIBreakdownValue,
  RAQIDatapoint,
  RAQIMetricValue,
  RAQIMetricFilter,
  RAQIResponse,
} from '@modules/clients/analytics';
export type { AnalyticsSearchParams } from './utils/analyticsUrlBuilder';
export type { ExtendedAnnotationsShapesOptions } from './charts/options';

export type { FormattingSpec, MetricValueSpec } from './components/MetricValue/MetricValue';

export type { GenericTablePaginationSpec } from './tables/GenericTablePagination';
export { unknownDueToCursorBasedPagination } from './tables/GenericTablePagination';
export type { HeaderProps } from './tables/GenericTable';
export type { TableHeaderSort } from './tables/GenericTableHeader';
export { default as GenericChartHeaderButton } from './charts/GenericChartHeaderButton';
export { getComparator } from './tables/tableSortUtils';
export { default as formatCellContent } from './tables/formatCellContent';
export { default as formatCellKey } from './tables/formatCellKey';
export type { TabbedChartSpec } from './components/TabbedCharts/TabbedCharts';
export { formatCellBackgroundStyle } from './tables/formatCellStyles';

export type { NonEmptyArray } from './types/NonEmptyArray';
export type { TableSort } from './tables/types/TableSort';
export { TableSortOrder } from './tables/types/TableSort';

export { getChartThemedColors, TableCellBackgroundColor } from './charts/options';
export type { SeriesIntervalMeaning } from './enums/SeriesIntervalMeaning';
export {
  ColumnType,
  CellBackgroundType,
  resolveTableColumnTitle,
  type TableColumnConfig,
  type TableColumnConfigWithoutSort,
} from './tables/types/GenericColumnType';
export {
  Status,
  type TableConfig,
  type CellDataType,
  type TableValueTypes,
  type ActionCellAction,
  type TBadgeStatus,
  type GenericTableV2RowExpansionConfig,
  type GenericTableV2ExpandedRowColumnsByColumn,
  type GenericTableV2ExpandedRowColumnDefinition,
  type GenericTableV2ExpandedRowColumnConfig,
  type GenericTableV2ExpandedRowCellSpec,
  type GenericTableV2RowExpansionRenderParams,
} from './tables/types/GenericTableType';
export type { Action } from './types/Action';
export {
  useDownloadAction,
  type TGenericChartExportConfig,
  default as GenericChartExportButton,
} from './charts/GenericChartExportButton';

export type { TCardStyleConfig } from './types/CardStyleConfig';
export { default as ChartResourceType } from './enums/ChartResourceType';

// chart & table exporters
export type { default as GenericCsvExporter } from './charts/exporters/GenericCsvExporter';
export { escapeFileName } from './charts/exporters/GenericCsvExporter';
export {
  default as GenericChartExporter,
  wrapNonRAQIMetricAsFormattedTextForExporter,
} from './charts/exporters/GenericChartExporter';
export type { ExportMetricLabel } from './charts/exporters/GenericChartExporter';
export { default as GenericTableExporter } from './charts/exporters/GenericTableExporter';
export { default as TimeSeriesChartExporter } from './charts/exporters/TimeSeriesChartExporter';
export { default as TimeComparatorChartExporter } from './charts/exporters/TimeComparatorChartExporter';
export { default as DurationChartExporter } from './charts/exporters/DurationChartExporter';
export { default as SingleDateChartExporter } from './charts/exporters/SingleDateChartExporter';
export { default as GenericTreemapExporter } from './charts/exporters/GenericTreemapExporter';

export {
  formatShortDateTimeWithoutYear,
  formatDurationInDay,
  formatDurationInSecond,
} from './charts/formatters/timeFormatters';

export {
  default as HighlightingCodeBlock,
  HighlightingCodeBlockLanguage,
} from './components/HighlightingCodeBlock/HighlightingCodeBlock';

export {
  FoundationLikeMultiSelect,
  multiSelectSizes,
  Menu as FoundationLikeMenu,
  MenuSection as FoundationLikeMenuSection,
  MenuItem as FoundationLikeMenuItem,
  MenuSeparator as FoundationLikeMenuSeparator,
  MenuLabel as FoundationLikeMenuLabel,
} from './components/FoundationLikeMultiSelect';
export type {
  TMultiSelectProps,
  TMultiSelectSize,
  TMultiSelectValue,
  TMenuProps as TFoundationLikeMenuProps,
  TMenuSectionProps as TFoundationLikeMenuSectionProps,
  TMenuItemProps as TFoundationLikeMenuItemProps,
} from './components/FoundationLikeMultiSelect';
