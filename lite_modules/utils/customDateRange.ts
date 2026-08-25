interface CustomDateRangeGateState {
  appMetadataState?: {
    data?: {
      isCustomDateRangeEnabled?: boolean;
    };
  };
  shouldUseWorkspaceUniverseFiltering: () => boolean;
}

/**
 * Whether the URL-driven custom date range treatment (`SyncedDateRangePicker`,
 * `?rangeType=...&minTime=...&maxTime=...`) is active. Mirrors the CAaaS stats
 * gate: workspace-scoped sessions always get it, while `isCustomDateRangeEnabled`
 * remains the separate rollout switch for the ad-account-scoped sessions the
 * workspace gate excludes (impersonation, internal/external managed accounts).
 */
export const shouldUseCustomDateRange = (state: CustomDateRangeGateState): boolean =>
  state.shouldUseWorkspaceUniverseFiltering() ||
  Boolean(state.appMetadataState?.data?.isCustomDateRangeEnabled);
