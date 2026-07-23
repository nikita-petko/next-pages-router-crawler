enum AnalyticsQueryParams {
  MinTime = 'minTime',
  MaxTime = 'maxTime',
  RangeType = 'rangeType',
  ShowAlerts = 'showAlerts',
  Granularity = 'granularity',
  SingleDateType = 'singleDateType',
  SingleDateTime = 'singleDateTime',
  OverrideOwnerType = 'override_ownerType',
  OverrideOwnerId = 'override_ownerId',
  Tab = 'tab',

  Annotation = 'annotation',
  FilterAnnotation = 'filter_Annotation',

  /** Which chart type to use in explore mode */
  ChartType = 'chartType',
  /** Which metric to show in explore mode */
  Metric = 'metric',
  /** Additional explore-mode table metrics after the primary column */
  TableMetric = 'tableMetric[]',
  /** Optional per-tableMetric serialized filter payloads (index-aligned with tableMetric[]) */
  TableMetricFilters = 'tableMetricFilters[]',
  /** Encoded computed metric payload used in explore mode */
  ComputedMetric = 'computedMetric',
  /** Which predefinedChartKey the user is coming from */
  Preset = 'preset',
  /** An encoded query parameter indicating the page to return to */
  Referrer = 'aref',

  /** Time ranges for comparator charts */
  LabeledTimeRanges = 'labeledTimeRange',

  /** Pre-2024/06 non-RAQI breakdown (DataDivisionType) */
  LegacyBreakdownType = 'breakdownType',
  /** RAQIv2 breakdown (TRAQIV2Dimension[]) */
  Breakdown = 'breakdown',

  /** These are used in recommendationTypeToInsightsLinkSpec */
  FilterPlace = 'filter_Place',
  OperatingSystem = 'filter_OperatingSystem',
  MemoryGroup = 'filter_MemoryGroup',
  InsightId = 'insightId',
  RegenerateReport = 'regenerateReport',
  ActiveSection = 'activeSection',

  /** For experiments */
  ExperimentStep = 'step',
  ExperimentType = 'type',
  ExperimentId = 'experimentId',
  ExperimentDetailsTab = 'experimentDetailsTab',

  /** For config version history deep linking */
  ConfigVersion = 'configVersion',

  /** For AI chat conversation persistence */
  ConversationId = 'conversationId',

  /** Explore Mode overlay selections (comma-separated: "benchmark", "comparison", "quota") */
  Overlays = 'overlays',
  /** Benchmark type for the benchmark overlay (e.g. "Genre", "Similarity") */
  OverlayBenchmarkType = 'benchmarkType',
  /** Comparison offset for the period-over-period overlay (e.g. "7d", "14d", "28d") */
  OverlayComparisonOffset = 'comparisonOffset',
  /** Custom comparison start timestamp (milliseconds since epoch) for period-over-period overlay */
  OverlayComparisonCustomStartTime = 'comparisonCustomStartTime',

  /** Explore Mode smoothing selection (currently only "l7-moving-average") */
  Smoothing = 'smoothing',

  /**
   * Explore Mode per-alert filter for the `Alerts` annotation row.
   * Repeated string values (`?annotation_alertId=foo&annotation_alertId=bar`),
   * each one a configured alert id. When unset the `Alerts` annotation
   * row shows every alert configured for the current metric (today's
   * behavior); when present, only listed ids are shown.
   *
   * The enum *key* stays `AlertIds` (it is the canonical JS-side
   * identifier referenced everywhere from
   * `ExploreModeAlertSelectionContext` to `getExploreModeUrlParams`); the
   * *value* is the wire-format URL key, which is intentionally namespaced
   * with `annotation_` to make the param self-describing and to avoid
   * collisions with future non-annotation alert-id params.
   */
  AlertIds = 'annotation_alertId',
}
export default AnalyticsQueryParams;
