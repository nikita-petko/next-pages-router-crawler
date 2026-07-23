import type { Context } from 'react';
import { useContext } from 'react';
import ChartResourceType from '@modules/charts-generic/enums/ChartResourceType';
import { CreatorAnalyticsCurrentAnnotationsBundleContext } from '../context/CreatorAnalyticsCurrentAnnotationsBundleProvider';
import { ExperienceAnalyticsCurrentAnnotationsBundleContext } from '../context/ExperienceAnalyticsCurrentAnnotationsBundleProvider';
import type { AnalyticsCurrentAnnotationsBundleContextType } from '../types/AnalyticsCurrentAnnotationsBundleContext';

function getCurrentAnnotationsBundleContext(
  resourceType: ChartResourceType,
): Context<AnalyticsCurrentAnnotationsBundleContextType> {
  switch (resourceType) {
    case ChartResourceType.Group:
    case ChartResourceType.User:
      return CreatorAnalyticsCurrentAnnotationsBundleContext;
    case ChartResourceType.Universe:
      return ExperienceAnalyticsCurrentAnnotationsBundleContext;
    default: {
      const exhaustiveCheck: never = resourceType;
      throw new Error(`Invalid resource type ${exhaustiveCheck}`);
    }
  }
}

export default function useCurrentAnnotationsBundleProvider(
  resourceType: ChartResourceType,
): AnalyticsCurrentAnnotationsBundleContextType {
  return useContext(getCurrentAnnotationsBundleContext(resourceType));
}
