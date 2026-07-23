import { NonEmptyArray, TimeSeriesAnnotation } from '@modules/charts-generic';
import { AnnotationType } from '@modules/clients/analytics';
import { type TRAQIV2NumericUIMetric } from '../constants/AnalyticsMetricDisplayConfig';
import { AnnotationOptions } from '../constants/annotationConfig';
import RAQIV2ChartContext from './RAQIV2ChartContext';

export type AnalyticsCurrentAnnotationsBundleContextType = {
  selectedAnnotationOptions: AnnotationOptions[];
  supportedAnnotationTypes: Array<AnnotationType | 'None'>;
  defaultAnnotationTypes: Array<AnnotationType | 'None'>;
  timeSeriesAnnotations: TimeSeriesAnnotation[] | undefined;
  onAnnotationOptionsChange: (annotationTypes: AnnotationOptions[] | null) => void;
  getCurrentSupportedAnnotations: (
    metrics: NonEmptyArray<TRAQIV2NumericUIMetric>,
    isSupportedOverride?: (annotationType: AnnotationType) => boolean | undefined,
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
