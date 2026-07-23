import type {
  AnnotationDraggableValue,
  AnnotationMockPointOptionsObject,
  AnnotationsLabelsOptions,
  AnnotationsOptions,
  ChartRenderCallbackFunction,
  XAxisPlotBandsOptions,
} from 'highcharts';
import { useCallback, useEffect, useMemo } from 'react';
import { rangeAnnotationPlotBandZIndex } from '../annotations/z-index';
import { useActivatedAnnotation } from '../context/ActivatedAnnotationContext';
import type { AnnotationPosition, TAnnotation } from '../types/Annotation';
import throttle from '../utils/throttle';

const DragDisabled: AnnotationDraggableValue = '';

/**
 * Creates Highcharts annotation configurations for time series charts.
 *
 * Instead of using Highcharts' built-in annotation rendering, we:
 * 1. Get annotation positions from the chart's render event
 * 2. Render annotation labels using React components
 * 3. Set 'visible: false' in the Highcharts annotation config
 * 4. For range annotations with 'curtains', set 'color: transparent' in plotBandsOptions
 *    and render the actual curtain via React
 *
 * @see useAnnotationsCallback.ts for position calculation details
 */
export const useAnnotationsOptions = (
  annotations?: TAnnotation[],
): {
  annotationOptions?: AnnotationsOptions[];
  plotBandsOptions?: XAxisPlotBandsOptions[];
} => {
  const { updateActiveAnnotationId } = useActivatedAnnotation();
  const options = useMemo(() => {
    const annotationOptions: Array<AnnotationsOptions> = [];
    const xAxisPlotBands: Array<XAxisPlotBandsOptions> = [];
    annotations?.forEach(({ id, start, end, rangeAnnotationConfig }) => {
      const labelsOptions: AnnotationsLabelsOptions[] = [
        {
          point: {
            x: start,
            y: 0,
            yAxis: 0,
            xAxis: 0,
          },
          allowOverlap: true,
        },
      ];

      // It's a range annotation if 'end' is a valid value.
      // Append an additional label option so end of the range can also be tracked
      if (end !== undefined && end > start) {
        labelsOptions.push({
          point: {
            x: end,
            y: 0,
            yAxis: 0,
            xAxis: 0,
          },
          allowOverlap: true,
        });

        if (rangeAnnotationConfig?.curtainStayOnChart && updateActiveAnnotationId) {
          xAxisPlotBands.push({
            from: start,
            to: end,
            color: 'transparent',
            events: {
              mouseover() {
                updateActiveAnnotationId(id.toString());
              },
              mouseout() {
                updateActiveAnnotationId(null);
              },
            },
            zIndex: rangeAnnotationPlotBandZIndex,
          });
        }
      }

      annotationOptions.push({
        id,
        draggable: DragDisabled,
        labels: labelsOptions,
        visible: false,
      });
    });

    return {
      annotationOptions: annotationOptions.length ? annotationOptions : undefined,
      plotBandsOptions: xAxisPlotBands.length ? xAxisPlotBands : undefined,
    };
  }, [annotations, updateActiveAnnotationId]);

  return options;
};

export type ChartPlotPosition = {
  left: number;
  top: number;
  height: number;
  width: number;
};

export type AnnotationsPositionsUpdatedCallback = ({
  labelsPosition,
  chartPlotPosition,
}: {
  labelsPosition: AnnotationPosition[];
  chartPlotPosition: ChartPlotPosition;
}) => void;

type AnnotationUserOptions = AnnotationsOptions & {
  labels?: Array<
    AnnotationsLabelsOptions & {
      point: AnnotationMockPointOptionsObject;
    }
  >;
};

type AnnotationLabels = Array<{ points?: Array<{ plotX: number; x: number }> }>;

interface ChartWithAnnotations extends Highcharts.Chart {
  annotations?: Array<
    Highcharts.Annotation & {
      labels?: AnnotationLabels;
    }
  >;
  userOptions: {
    annotations?: Array<AnnotationUserOptions>;
  };
}

const getAnnotationPosition = ({
  annotationLabels,
  annotationUserOptions,
  chart,
}: {
  annotationLabels?: AnnotationLabels;
  annotationUserOptions: AnnotationUserOptions;
  chart: ChartWithAnnotations;
}): Omit<AnnotationPosition, 'id'> | undefined => {
  if (annotationUserOptions.labels?.length && annotationUserOptions.labels.length === 2) {
    // It's range annotation if highchart options have two labels
    const [startLabel, endLabel] = annotationUserOptions.labels;
    const startX = startLabel.point.x;
    const endX = endLabel.point.x;
    const xAxis = chart.xAxis?.[0];
    const [minX, maxX] = [xAxis?.min ?? 0, xAxis?.max ?? 0];

    if (endX < minX || startX > maxX) {
      // It's out of range, skip it
      return undefined;
    }

    let startLeft: number;
    let endLeft: number;
    const startPoint = annotationLabels?.find(({ points }) => points?.[0]?.x === startX)
      ?.points?.[0];
    const endPoint = annotationLabels?.find(({ points }) => points?.[0]?.x === endX)?.points?.[0];

    if (startPoint !== undefined && endPoint !== undefined) {
      // Annotation range is within chart area
      startLeft = startPoint.plotX;
      endLeft = endPoint.plotX;
    } else if (startPoint !== undefined) {
      // Annotation end range is out of chart area
      /**
       * startLeft is in pixel. minX, maxX, startX, and endX are in x unit (number)
       * To calculate endLeft from startLeft, we need get pixel per unit: startLeft / maxX-minX.
       * Then multiply it by the number of unit that end point has: endX-minX
       *              startLeft    icon     endLeft
       * |                |         |_|        |
       * |                |                    |
       * |________________|______________      |
       * minX           startX         maxX   endX
       */
      startLeft = startPoint.plotX;
      endLeft = (startLeft / (maxX - minX)) * (endX - minX);
    } else if (endPoint !== undefined) {
      // Annotation start range is out of chart area
      endLeft = endPoint.plotX;
      startLeft = (endLeft / (maxX - minX)) * (startX - minX);
    } else {
      // The entire range is out of chart area
      startLeft = -Number.EPSILON;
      endLeft = chart.plotWidth + Number.EPSILON;
    }
    return { startLeft, endLeft };
  }
  // Otherwise, it's a regular annotation
  const startLeft = annotationLabels?.[0]?.points?.[0].plotX;
  if (startLeft !== undefined && chart.isInsidePlot(startLeft, chart.plotTop)) {
    return { startLeft };
  }

  return undefined;
};

type AnnotationChartRenderCallbackFunction = (this: ChartWithAnnotations, event: Event) => void;
export const useAnnotationsCallback = ({
  annotations,
  onAnnotationsPositionsUpdated,
}: {
  annotations?: TAnnotation[];
  onAnnotationsPositionsUpdated?: AnnotationsPositionsUpdatedCallback;
}): ChartRenderCallbackFunction | undefined => {
  const onChartRender: AnnotationChartRenderCallbackFunction = useCallback(
    function onChartRender(this: ChartWithAnnotations) {
      const chartPlotTop = this.plotTop;
      const chartPlotLeft = this.plotLeft;
      const chartPlotHeight = this.plotHeight;
      const chartPlotWidth = this.plotWidth;

      const positions: AnnotationPosition[] = [];
      this.annotations?.forEach(({ userOptions, labels }) => {
        const annotationId = userOptions.id?.toString();
        if (!annotationId) {
          return;
        }

        const annotationUserOptions = this.userOptions.annotations?.find(
          (a) => a.id === annotationId,
        );
        if (!annotationUserOptions) {
          return;
        }

        const annotationPosition = getAnnotationPosition({
          annotationLabels: labels,
          annotationUserOptions,
          chart: this,
        });
        if (annotationPosition) {
          positions.push({ id: annotationId, ...annotationPosition });
        }
      });

      onAnnotationsPositionsUpdated?.({
        labelsPosition: positions,
        chartPlotPosition: {
          left: chartPlotLeft,
          top: chartPlotTop,
          height: chartPlotHeight,
          width: chartPlotWidth,
        },
      });
    },
    [onAnnotationsPositionsUpdated],
  );

  const [throttledOnChartRender, clearThrottledOnChartRender] = useMemo(
    () => throttle(onChartRender, 400),
    [onChartRender],
  );

  // clean up throttled function
  useEffect(() => clearThrottledOnChartRender, [clearThrottledOnChartRender]);

  return annotations?.length ? throttledOnChartRender : undefined;
};
