import type { FC, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useFlag } from '@rbx/flags';
import { isJourneyEventsEnabled } from '@generated/flags/creatorAnalytics';
import type { RAQIV2ChartResource } from '@modules/clients/analytics';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { PageLoading } from '@modules/miscellaneous/components';

interface JourneysFlagGateProps {
  children: (resource: RAQIV2ChartResource) => ReactNode;
}

// Inner component only mounts once the universe resource has a real id, so
// the flag is evaluated only after we know which universe we're on.
const JourneysFlagGateInner: FC<{
  resource: RAQIV2ChartResource;
  children: (resource: RAQIV2ChartResource) => ReactNode;
}> = ({ resource, children }) => {
  const { ready: isFlagReady, value: isJourneysEnabled } = useFlag(isJourneyEventsEnabled);
  const router = useRouter();

  if (!isFlagReady) {
    return <PageLoading />;
  }

  if (!isJourneysEnabled) {
    void router.push('/404');
    return null;
  }

  return <>{children(resource)}</>;
};

/**
 * Renders `children(resource)` once the universe resource has loaded with a
 * real id and `isJourneyEventsEnabled` is `true`; otherwise renders
 * `<PageLoading />` or redirects to `/404`. `key={id}` forces a remount if
 * the universe id changes, so the flag hook never holds a stale value.
 */
const JourneysFlagGate: FC<JourneysFlagGateProps> = ({ children }) => {
  const resource = useUniverseResource();

  if (resource.isLoading || resource.id <= 0) {
    return <PageLoading />;
  }

  return (
    <JourneysFlagGateInner key={resource.id} resource={resource}>
      {children}
    </JourneysFlagGateInner>
  );
};

export default JourneysFlagGate;
