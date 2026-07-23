import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { TimeSeriesAnnotation } from '@modules/charts-generic/charts/types/Annotations';
import type { NonEmptyArray } from '@modules/charts-generic/types/NonEmptyArray';
import type { AnnotationType } from '@modules/clients/analytics';
import type { TRAQIV2NumericUIMetric } from '../constants/AnalyticsMetricDisplayConfig';
import type { AnnotationOptions } from '../constants/annotationConfig';
import type RAQIV2ChartContext from './RAQIV2ChartContext';

export type AnalyticsCurrentAnnotationsBundleContextType = {
  selectedAnnotationOptions: AnnotationOptions[];
  supportedAnnotationTypes: Array<AnnotationType | 'None'>;
  defaultAnnotationTypes: Array<AnnotationType | 'None'>;
  timeSeriesAnnotations: TimeSeriesAnnotation[] | undefined;
  onAnnotationOptionsChange: (annotationTypes: AnnotationOptions[] | null) => void;
  getCurrentSupportedAnnotations: (
    metrics: NonEmptyArray<TRAQIV2NumericUIMetric>,
    isSupportedOverride?: (annotationType: AnnotationType) => boolean | undefined,
    targetingDimensions?: readonly TRAQIV2Dimension[],
  ) => TimeSeriesAnnotation[] | undefined;
  updateTimeSeriesAnnotationsGivenChartContext: (context: RAQIV2ChartContext) => void;
};

export const DefaultCreatorAnalyticsCurrentAnnotationsBundleContext: AnalyticsCurrentAnnotationsBundleContextType =
  {
    selectedAnnotationOptions: [],
    supportedAnnotationTypes: [],
    defaultAnnotationTypes: [],
    timeSeriesAnnotations: [],
    onAnnotationOptionsChange: () => {
      throw new Error('not implemented');
    },
    getCurrentSupportedAnnotations: () => {
      throw new Error('not implemented');
    },
    updateTimeSeriesAnnotationsGivenChartContext: () => {
      throw new Error('not implemented');
    },
  };
