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
  /** RAQIv2 breakdown (TRAQIV2BreakdownDimension[]) */
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

  /** Explore Mode overlay selections (comma-separated: "benchmark", "comparison", "trend-line") */
  Overlays = 'overlays',
  /** Benchmark type for the benchmark overlay (e.g. "Genre", "Similarity") */
  OverlayBenchmarkType = 'benchmarkType',
}
export default AnalyticsQueryParams;
