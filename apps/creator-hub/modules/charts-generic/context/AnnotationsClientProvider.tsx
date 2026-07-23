import type { Context } from 'react';
import { useContext } from 'react';
import ChartResourceType from '../enums/ChartResourceType';
import type { AnnotationsClientProviderState } from '../types/AnnotationsClientProviderState';
import { CreatorAnnotationsClientContext } from './annotations/CreatorAnnotationsClientProvider';
import { UniverseAnnotationsClientContext } from './annotations/UniverseAnnotationsClientProvider';

export const getAnnotationsClientProvider = (
  resourceType: ChartResourceType,
): Context<AnnotationsClientProviderState | null> => {
  switch (resourceType) {
    case ChartResourceType.Group:
      return CreatorAnnotationsClientContext;
    case ChartResourceType.Universe:
      return UniverseAnnotationsClientContext;
    case ChartResourceType.User:
      return CreatorAnnotationsClientContext;
    default: {
      const exhaustiveCheck: never = resourceType;
      throw new Error(`Invalid resource type ${exhaustiveCheck}`);
    }
  }
};

export function useAnnotationsClient(
  resourceType: ChartResourceType,
): AnnotationsClientProviderState {
  const provider = getAnnotationsClientProvider(resourceType);
  const context = useContext(provider);
  if (context === null) {
    throw new Error('useAnnotationsClient must be used within a AnnotationsClientProvider');
  }
  return context;
}
