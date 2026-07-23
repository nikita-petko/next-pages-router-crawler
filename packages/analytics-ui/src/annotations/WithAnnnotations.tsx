import type { FC } from 'react';
import React, { useState, useCallback, useMemo } from 'react';
import { makeStyles } from '@rbx/ui';
import { ActivatedAnnotationProvider } from '../context/ActivatedAnnotationContext';
import type {
  AnnotationsPositionsUpdatedCallback,
  ChartPlotPosition,
} from '../highchart-options/annotationsOptions';
import type {
  TAnnotation,
  AnnotationPosition,
  FormatXForAnnotationTooltip,
} from '../types/Annotation';
import GroupAnnotation from './GroupAnnotation';
import IndividualAnnotation from './IndividualAnnotation';
import useGroupedAnnotations from './useGroupedAnnotations';
import { chartContainerZIndex } from './z-index';

const useStyles = makeStyles()(() => {
  return {
    chartWithAnnotationsContainer: {
      position: 'relative',
    },
    chartContainer: {
      zIndex: chartContainerZIndex,
    },
  };
});

const arePositionsEqual = (a: ChartPlotPosition, b: ChartPlotPosition): boolean =>
  a.left === b.left && a.top === b.top && a.height === b.height && a.width === b.width;

const areAnnotationPositionsEqual = (a: AnnotationPosition[], b: AnnotationPosition[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i];
    const y = b[i];
    if (x.id !== y.id || x.startLeft !== y.startLeft || x.endLeft !== y.endLeft) {
      return false;
    }
  }
  return true;
};

export type AnnotationProps = {
  annotations?: TAnnotation[];
  onAnnotationsPositionsUpdated?: AnnotationsPositionsUpdatedCallback;
  formatXForAnnotationTooltip?: FormatXForAnnotationTooltip;
};

const WithAnnotations = <ChartComponentProps extends object & AnnotationProps>(
  ChartComponent: FC<ChartComponentProps>,
) => {
  const Wrapper: FC<ChartComponentProps> = (props) => {
    const {
      classes: { chartWithAnnotationsContainer, chartContainer },
    } = useStyles();
    const {
      annotations,
      onAnnotationsPositionsUpdated: givenOnAnnotationsPositionsUpdated,
      formatXForAnnotationTooltip,
    } = props;
    const [{ annotationPositions, chartPlotPosition }, setAnnotationPositions] = useState<{
      annotationPositions: AnnotationPosition[];
      chartPlotPosition: ChartPlotPosition;
    }>({
      annotationPositions: [],
      chartPlotPosition: { left: 0, top: 0, height: 0, width: 0 },
    });

    const onAnnotationsPositionsUpdated: AnnotationsPositionsUpdatedCallback = useCallback(
      ({ labelsPosition, chartPlotPosition: givenChartPlotPosition }) => {
        // Highcharts re-fires `onChartRender` on every paint pass, even when
        // the chart didn't actually move. Without value-equality dedup, every
        // such fire allocates a fresh state object and schedules a re-render —
        // which, in concert with parent state updates upstream, can become a
        // synchronous render cascade. Compare by value and bail out when
        // nothing has changed so React can skip the update.
        setAnnotationPositions((prev) => {
          if (
            arePositionsEqual(prev.chartPlotPosition, givenChartPlotPosition) &&
            areAnnotationPositionsEqual(prev.annotationPositions, labelsPosition)
          ) {
            return prev;
          }
          return {
            annotationPositions: labelsPosition,
            chartPlotPosition: givenChartPlotPosition,
          };
        });
        givenOnAnnotationsPositionsUpdated?.({
          labelsPosition,
          chartPlotPosition: givenChartPlotPosition,
        });
      },
      [givenOnAnnotationsPositionsUpdated],
    );

    const annotationGroups = useGroupedAnnotations({
      annotationPositions,
      annotations,
      chartPlotWidth: chartPlotPosition.width,
    });

    const annotationsLabel = useMemo(() => {
      const labels: React.ReactElement[] = [];
      annotationGroups.forEach((group) => {
        if (Array.isArray(group)) {
          labels.push(
            <GroupAnnotation
              // Using first annotation id as group key is good enough since annotation id is unique
              key={group[0].id}
              group={group}
              chartPlotPosition={chartPlotPosition}
              formatXForAnnotationTooltip={formatXForAnnotationTooltip}
            />,
          );
        } else {
          labels.push(
            <IndividualAnnotation
              key={group.id}
              annotation={group}
              chartPlotPosition={chartPlotPosition}
              formatXForAnnotationTooltip={formatXForAnnotationTooltip}
            />,
          );
        }
      });
      return labels;
    }, [annotationGroups, chartPlotPosition, formatXForAnnotationTooltip]);

    return (
      <ActivatedAnnotationProvider>
        <div className={chartWithAnnotationsContainer}>
          {annotationsLabel}
          <div className={chartContainer}>
            <ChartComponent
              {...props}
              onAnnotationsPositionsUpdated={
                annotations?.length ? onAnnotationsPositionsUpdated : undefined
              }
            />
          </div>
        </div>
      </ActivatedAnnotationProvider>
    );
  };

  return Wrapper;
};

WithAnnotations.displayName = 'WithAnnotations';
export default WithAnnotations;
