import React, { FC, useState, useCallback, useMemo } from 'react';
import { makeStyles } from '@rbx/ui';
import { TAnnotation, AnnotationPosition, FormatXForAnnotationTooltip } from '../types/Annotation';
import {
  AnnotationsPositionsUpdatedCallback,
  ChartPlotPosition,
} from '../highchart-options/annotationsOptions';
import IndividualAnnotation from './IndividualAnnotation';
import GroupAnnotation from './GroupAnnotation';
import useGroupedAnnotations from './useGroupedAnnotations';
import { ActivatedAnnotationProvider } from '../context/ActivatedAnnotationContext';
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
        setAnnotationPositions({
          annotationPositions: labelsPosition,
          chartPlotPosition: givenChartPlotPosition,
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
