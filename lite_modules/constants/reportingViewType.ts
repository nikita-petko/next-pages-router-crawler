// Reporting view types for filtering user segments
enum ReportingViewType {
  REPORTING_VIEW_TYPE_UNSPECIFIED = 0,

  REPORTING_VIEW_TYPE_DEFAULT = 1,

  REPORTING_VIEW_TYPE_NEW_USERS = 2,

  REPORTING_VIEW_TYPE_RECENT_USERS = 3,

  REPORTING_VIEW_TYPE_7D_RESURRECTED = 4,

  REPORTING_VIEW_TYPE_30D_RESURRECTED = 5,
}

/**
 * Number of trailing days whose data is still being attributed for each
 * reporting view. Used by reporting charts to render those days as a dashed
 * line and is sourced from the attribution lookback configured per view in
 * `ads-reporting-data-layer`.
 */
const ATTRIBUTION_WINDOW_BY_VIEW: Record<ReportingViewType, number> = {
  [ReportingViewType.REPORTING_VIEW_TYPE_30D_RESURRECTED]: 30,
  [ReportingViewType.REPORTING_VIEW_TYPE_7D_RESURRECTED]: 7,
  [ReportingViewType.REPORTING_VIEW_TYPE_DEFAULT]: 30,
  [ReportingViewType.REPORTING_VIEW_TYPE_NEW_USERS]: 30,
  [ReportingViewType.REPORTING_VIEW_TYPE_RECENT_USERS]: 7,
  [ReportingViewType.REPORTING_VIEW_TYPE_UNSPECIFIED]: 30,
};

export const getAttributionWindow = (reportingViewType: ReportingViewType): number =>
  ATTRIBUTION_WINDOW_BY_VIEW[reportingViewType];

export default ReportingViewType;
