import React, { type FC, type ReactNode } from 'react';
import { useFlag } from '@rbx/flags';
import { isCustomDashboardsEnabled as isCustomDashboardsEnabledFlag } from '@generated/flags/creatorAnalytics';
import { TextFilterProvider } from '@modules/experience-analytics-shared/text-filter/TextFilterContext';
import { PageNotFound } from '@modules/miscellaneous/error';
import { filterCustomDashboardText } from '../textFilter';

const DEFAULT_DISABLED_FALLBACK = <PageNotFound />;

/**
 * Custom-dashboards page shell: feature-flag gate, service provider, and the
 * change-event → React-Query invalidation bridge. Pages below assume a
 * service is available and that mutations propagate cross-tab.
 *
 * The flag query is async; while it's loading, missing flags coerce to
 * `false`, so a naive `if (!flag)` would render the 404 fallback and then
 * mount the full tree once the flag arrives. Chart-editor ↔ edit navigation
 * also remounts this shell, and `useFlag` starts each mount with
 * `ready: false`. Keep the loading slot blank by default (do **not** fall
 * through to `fallback`) until `isFetched` is true so pages don't flash
 * PageNotFound on every sub-route transition.
 */
type CustomDashboardsShellProps = {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
  readonly loading?: ReactNode;
};

const CustomDashboardsShell: FC<CustomDashboardsShellProps> = ({
  children,
  fallback = DEFAULT_DISABLED_FALLBACK,
  loading = null,
}) => {
  const { ready: isFetched, value: isCustomDashboardsEnabledValue } = useFlag(
    isCustomDashboardsEnabledFlag,
  );
  const isCustomDashboardsEnabled = isFetched && isCustomDashboardsEnabledValue;

  if (!isFetched) {
    return <>{loading}</>;
  }

  if (!isCustomDashboardsEnabled) {
    return <>{fallback}</>;
  }

  return <TextFilterProvider filterText={filterCustomDashboardText}>{children}</TextFilterProvider>;
};

export default CustomDashboardsShell;
