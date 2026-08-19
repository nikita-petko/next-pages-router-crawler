import type { FC, ReactNode } from 'react';
import type { RAQIV2ChartResource } from '@modules/clients/analytics';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { PageLoading } from '@modules/miscellaneous/components';

interface UniverseResourceGateProps {
  children: (resource: RAQIV2ChartResource) => ReactNode;
}

/**
 * Waits for the universe resource to load before rendering children that
 * require its identifier.
 */
const UniverseResourceGate: FC<UniverseResourceGateProps> = ({ children }) => {
  const resource = useUniverseResource();

  if (resource.isLoading || resource.id <= 0) {
    return <PageLoading />;
  }

  return <>{children(resource)}</>;
};

export default UniverseResourceGate;
