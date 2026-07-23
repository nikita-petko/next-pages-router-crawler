import type { CSSProperties, FC } from 'react';
import React, { useCallback, useMemo } from 'react';
import { makeStyles, Tooltip } from '@rbx/ui';
import { getChartThemedColors } from '../color';
import { useActivatedAnnotation } from '../context/ActivatedAnnotationContext';
import type { ChartPlotPosition } from '../highchart-options/annotationsOptions';
import type { AnnotationWithPosition, FormatXForAnnotationTooltip } from '../types/Annotation';
import AnnotationIconWithTooltip from './AnnotationIconWithTooltip';
import getViewPositionLeft from './getViewPositionLeft';
import getXAxisTooltipProps from './getXAxisTooltipProps';
import RangeAnnotationCurtain, { isRangeAnnotation } from './RangeAnnotationCurtain';
import { annotationZIndex } from './z-index';

const useStyles = makeStyles()(() => {
  return {
    annotationContainer: {
      display: 'flex',
      position: 'absolute',
      transition: '0.2s ease',
      transitionProperty: 'opacity',
      zIndex: annotationZIndex,
    },
    dimmed: {
      opacity: 0.2,
    },
  };
});

type IndividualAnnotationProps = {
  annotation: AnnotationWithPosition;
  chartPlotPosition: ChartPlotPosition;
  formatXForAnnotationTooltip?: FormatXForAnnotationTooltip;
};

const IndividualAnnotation: FC<IndividualAnnotationProps> = ({
  annotation,
  chartPlotPosition,
  formatXForAnnotationTooltip,
}) => {
  const {
    classes: { annotationContainer, dimmed },
    cx,
    theme,
  } = useStyles();
  const { activeAnnotationId, updateActiveAnnotationId } = useActivatedAnnotation();
  const active = annotation.id === activeAnnotationId;

  const {
    left: chartPlotLeft,
    top: chartPlotTop,
    width: chartPlotWidth,
    height: chartPlotHeight,
  } = chartPlotPosition;

  const containerPositionStyle: CSSProperties = useMemo(
    () => ({
      left:
        chartPlotLeft +
        getViewPositionLeft({ annotationPosition: annotation, upperBound: chartPlotWidth }),
      top: chartPlotTop,
      transform: 'translateX(-50%)',
    }),
    [annotation, chartPlotLeft, chartPlotTop, chartPlotWidth],
  );

  const curtain = useMemo(() => {
    if (isRangeAnnotation(annotation) && annotation.rangeAnnotationConfig?.curtainStayOnChart) {
      return (
        <RangeAnnotationCurtain annotation={annotation} chartPlotPosition={chartPlotPosition} />
      );
    }

    if (!active) {
      return null;
    }

    if (isRangeAnnotation(annotation)) {
      return (
        <RangeAnnotationCurtain annotation={annotation} chartPlotPosition={chartPlotPosition} />
      );
    }

    // Render a vertical line for regular annotation
    const style: CSSProperties = {
      position: 'absolute',
      height: chartPlotHeight,
      left: containerPositionStyle.left,
      top: chartPlotTop,
      border: `0.5px dashed ${getChartThemedColors(theme).annotationVerticalLine}`,
    };
    const tooltipProps = getXAxisTooltipProps({
      annotation,
      formatXForAnnotationTooltip,
    });

    return (
      <Tooltip {...tooltipProps}>
        <div style={style} />
      </Tooltip>
    );
  }, [
    active,
    annotation,
    chartPlotHeight,
    chartPlotPosition,
    chartPlotTop,
    containerPositionStyle.left,
    formatXForAnnotationTooltip,
    theme,
  ]);

  const onMouseEnter = useCallback(() => {
    updateActiveAnnotationId?.(annotation.id);
  }, [annotation.id, updateActiveAnnotationId]);

  const onMouseLeave = useCallback(() => {
    updateActiveAnnotationId?.(null);
  }, [updateActiveAnnotationId]);

  return (
    <>
      {curtain}
      <div
        className={cx(annotationContainer, {
          [dimmed]: activeAnnotationId !== null && !active,
        })}
        style={containerPositionStyle}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}>
        <AnnotationIconWithTooltip annotation={annotation} />
      </div>
    </>
  );
};

export default React.memo(IndividualAnnotation);
