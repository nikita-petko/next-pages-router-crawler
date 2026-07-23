import { Context, useContext, useMemo } from 'react';
import { ChartResourceType } from '@modules/charts-generic';
import { RAQIV2ChartResource as ChartResource } from '@modules/clients/analytics';
import { UniverseResourceContext } from '../context/resourceContexts/UniverseResourceProvider';
import { CreatorResourceContext } from '../context/resourceContexts/CreatorResourceProvider';
import { ChartResourceContextType } from '../types/ChartResourceContextType';

function getChartResourceContext(
  resourceType: ChartResourceType,
): Context<ChartResourceContextType | null> {
  switch (resourceType) {
    case ChartResourceType.Group:
      return CreatorResourceContext;
    case ChartResourceType.Universe:
      return UniverseResourceContext;
    case ChartResourceType.User:
      return CreatorResourceContext;
    default: {
      const exhaustiveCheck: never = resourceType as never;
      throw new Error(`Invalid resource type ${exhaustiveCheck}`);
    }
  }
}

export default function useChartResourceProvider(
  resourceType: ChartResourceType,
): ChartResourceContextType | null {
  return useContext(getChartResourceContext(resourceType));
}

const useGetChartResourceOrNull = (resourceType: ChartResourceType) => {
  const context = getChartResourceContext(resourceType);
  const provider = useContext(context);
  if (!provider) {
    return null;
  }
  return provider.getChartResource;
};

const useGetChartResource = (resourceTypes: ChartResourceType[]) => {
  // TODO(gperkins@20240927): This can crash when the array of resourceTypes changes
  //  for a given component, since the set of calls to `useContext` will change
  //  and thus the component's react hook slots will be mangled. (DSA-3281)
  // useUniverseResource & useCreatorResource are OK since their resourceTypes are fixed
  //  but useBestSupportedChartResourceOfTypes is at risk.
  const getChartResource = resourceTypes
    .map(useGetChartResourceOrNull)
    .find((chartResource) => !!chartResource);

  if (!getChartResource) {
    throw new Error(
      `No ChartResource was found. Make sure the component is wrapped in the appropriate ChartResource Provider`,
    );
  }
  return getChartResource;
};

export function useBestSupportedChartResourceOfTypes(
  resourceTypes: ChartResourceType[],
): ChartResource {
  const getChartResource = useGetChartResource(resourceTypes);
  return useMemo(getChartResource, [getChartResource]);
}

export const useUniverseResource = (): ChartResource => {
  return useBestSupportedChartResourceOfTypes([ChartResourceType.Universe]);
};

export const useCreatorResource = (): ChartResource => {
  return useBestSupportedChartResourceOfTypes([ChartResourceType.Group, ChartResourceType.User]);
};
