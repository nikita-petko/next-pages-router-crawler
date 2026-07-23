/** NOTE(gperkins@2026-02-17): PageConfigAwareAnnotationProvider is the provider now. */
import { createContext, useContext } from 'react';
import type { AnalyticsCurrentAnnotationsBundleContextType } from '../types/AnalyticsCurrentAnnotationsBundleContext';
import { DefaultCreatorAnalyticsCurrentAnnotationsBundleContext } from '../types/AnalyticsCurrentAnnotationsBundleContext';

export const CreatorAnalyticsCurrentAnnotationsBundleContext =
  createContext<AnalyticsCurrentAnnotationsBundleContextType>(
    DefaultCreatorAnalyticsCurrentAnnotationsBundleContext,
  );

export const useCreatorAnalyticsCurrentAnnotationsBundle = () =>
  useContext(CreatorAnalyticsCurrentAnnotationsBundleContext);

export default {
  CreatorAnalyticsCurrentAnnotationsBundleContext,
  useCreatorAnalyticsCurrentAnnotationsBundle,
};
