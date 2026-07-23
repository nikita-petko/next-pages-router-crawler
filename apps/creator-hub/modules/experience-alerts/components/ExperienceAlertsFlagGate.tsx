import type { FC, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useFlag } from '@rbx/flags';
import { isExperienceAlertsEnabled } from '@generated/flags/creatorAnalytics';
import type { RAQIV2ChartResource } from '@modules/clients/analytics';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { PageLoading } from '@modules/miscellaneous/components';

interface ExperienceAlertsFlagGateProps {
  children: (resource: RAQIV2ChartResource) => ReactNode;
}

// Inner component is only mounted once the universe resource is fully loaded
// with a real id. This prevents `useFlag` from being seeded with a stale value
// from an evaluation against the uninitialized universe id (-1) on hard refresh.
const ExperienceAlertsFlagGateInner: FC<{
  resource: RAQIV2ChartResource;
  children: (resource: RAQIV2ChartResource) => ReactNode;
}> = ({ resource, children }) => {
  const { ready: isFlagReady, value: isExperienceAlertsEnabledFlag } = useFlag(
    isExperienceAlertsEnabled,
    { universeId: resource.id },
  );
  const router = useRouter();

  if (!isFlagReady) {
    return <PageLoading />;
  }

  if (!isExperienceAlertsEnabledFlag) {
    void router.push('/404');
    return null;
  }

  return <>{children(resource)}</>;
};

/**
 * Renders `children(resource)` only when:
 *   1. the universe resource has fully loaded with a real id (> 0), and
 *   2. the `isExperienceAlertsEnabled` flag is `true` for that universe.
 *
 * The `resource` passed to `children` is guaranteed to be loaded
 * (`isLoading: false`, `id > 0`), so callers can use it directly without
 * re-reading from `useUniverseResource()`.
 *
 * While waiting, renders `<PageLoading />`. If the flag is `false`, redirects
 * to `/404`.
 *
 * The two-component split + `key={id}` is intentional: it ensures `useFlag` is
 * never called with the uninitialized universe id (-1) and is fully remounted
 * if the universe id ever changes, which would otherwise leave the hook with
 * a stale `{ ready: true, value: <previous> }` state.
 */
const ExperienceAlertsFlagGate: FC<ExperienceAlertsFlagGateProps> = ({ children }) => {
  const resource = useUniverseResource();

  if (resource.isLoading || resource.id <= 0) {
    return <PageLoading />;
  }

  return (
    <ExperienceAlertsFlagGateInner key={resource.id} resource={resource}>
      {children}
    </ExperienceAlertsFlagGateInner>
  );
};

export default ExperienceAlertsFlagGate;
