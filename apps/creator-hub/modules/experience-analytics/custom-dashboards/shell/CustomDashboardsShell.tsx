import React, { type FC, type ReactNode, useMemo } from 'react';
import { useFlag } from '@rbx/flags';
import { isCustomDashboardsEnabled as isCustomDashboardsEnabledFlag } from '@generated/flags/creatorAnalytics';
import wellKnownAnalyticsTranslationNamespaces from '@modules/analytics-translations/wellKnownAnalyticsTranslationNamespaces';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { useAnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import { TextFilterProvider } from '@modules/experience-analytics-shared/text-filter/TextFilterContext';
import { filterCustomDashboardText } from '../textFilter';

/**
 * Custom-dashboards page shell: feature-flag gate and text-filter provider.
 * Service provider and cross-tab invalidation live in `_app.tsx` (app-wide).
 *
 * The flag query is async; while it's loading, missing flags coerce to
 * `false`. A naive `if (!flag)` would render `fallback` (or an empty body)
 * and then mount the full tree once the flag arrives. Chart-editor ↔ edit
 * navigation also remounts this shell, and `useFlag` starts each mount with
 * `ready: false`. Keep the loading slot blank by default (do **not** fall
 * through to `fallback`) until `isFetched` is true so pages don't flash the
 * disabled-flag surface on every sub-route transition.
 *
 * The default `fallback` is `null` (empty body) so a disabled feature-flag
 * renders an empty analytics surface. Routes that want a 404 pass their
 * own `fallback={<PageNotFound />}`.
 */
type CustomDashboardsShellProps = {
  readonly children: ReactNode;
  readonly universeId: number;
  readonly fallback?: ReactNode;
  readonly loading?: ReactNode;
};

const CustomDashboardsShell: FC<CustomDashboardsShellProps> = ({
  children,
  universeId,
  fallback = null,
  loading = null,
}) => {
  const { ready: isFetched, value: isCustomDashboardsEnabledValue } = useFlag(
    isCustomDashboardsEnabledFlag,
    { universeId },
  );
  const {
    userCanViewAnalyticsForUniverse,
    isPending: isPermissionPending,
    isError: isPermissionError,
  } = useAnalyticsExperiencePermissions(universeId);
  const isCustomDashboardsEnabled = isFetched && isCustomDashboardsEnabledValue;
  const filterText = useMemo(() => filterCustomDashboardText(universeId), [universeId]);

  if (!isFetched || isPermissionPending) {
    return <>{loading}</>;
  }

  if (!isCustomDashboardsEnabled || isPermissionError || !userCanViewAnalyticsForUniverse) {
    return <>{fallback}</>;
  }

  return <TextFilterProvider filterText={filterText}>{children}</TextFilterProvider>;
};

export default withNamespaceSwitchedTranslation(
  CustomDashboardsShell,
  wellKnownAnalyticsTranslationNamespaces,
);
