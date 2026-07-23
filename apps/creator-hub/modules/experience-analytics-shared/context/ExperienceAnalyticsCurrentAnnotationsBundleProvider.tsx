import { createContext, useContext } from 'react';
import {
  type AnalyticsCurrentAnnotationsBundleContextType,
  DefaultCreatorAnalyticsCurrentAnnotationsBundleContext,
} from '../types/AnalyticsCurrentAnnotationsBundleContext';

export const ExperienceAnalyticsCurrentAnnotationsBundleContext =
  createContext<AnalyticsCurrentAnnotationsBundleContextType>(
    DefaultCreatorAnalyticsCurrentAnnotationsBundleContext,
  );

export const useExperienceAnalyticsCurrentAnnotationsBundle = () =>
  useContext(ExperienceAnalyticsCurrentAnnotationsBundleContext);

// Provider removed: PageConfigAwareAnnotationProvider now supplies this context via
// PageConfigAwareAnalyticsProvider (through AnalyticsContextLayerInnerProvider).
