type ChartEventLoggingNames = {
  chartImpression: string;
  hoverImpression: string;
};

export enum ChartLoggingContext {
  InsightCard = 'InsightCard',
  RealtimeCard = 'RealtimeCard',
  SnapshotSummary = 'SnapshotSummary',
  OverviewSummary = 'OverviewSummary',
}

export type TChartEventLogging = {
  eventNames: ChartEventLoggingNames;
  context: ChartLoggingContext;
};
