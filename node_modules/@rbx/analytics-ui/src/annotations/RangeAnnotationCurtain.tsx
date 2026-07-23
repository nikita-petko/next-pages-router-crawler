import type { FC, CSSProperties } from 'react';
import React, { useMemo } from 'react';
import { useTheme } from '@rbx/ui';
import { getChartColorHexString, getChartThemedColors } from '../color';
import { useActivatedAnnotation } from '../context/ActivatedAnnotationContext';
import type { ChartPlotPosition } from '../highchart-options/annotationsOptions';
import type { AnnotationWithPosition } from '../types/Annotation';

type TRangeAnnotation = AnnotationWithPosition & {
  end: number;
  endLeft: number;
};

type RangeAnnotationCurtainProps = {
  chartPlotPosition: ChartPlotPosition;
  annotation: TRangeAnnotation;
};

export const isRangeAnnotation = (
  annotation: AnnotationWithPosition,
): annotation is TRangeAnnotation => {
  return annotation.end !== undefined && annotation.endLeft !== undefined;
};

const RangeAnnotationCurtain: FC<RangeAnnotationCurtainProps> = ({
  annotation,
  chartPlotPosition,
}) => {
  const { activeAnnotationId } = useActivatedAnnotation();
  const theme = useTheme();
  const {
    left: chartPlotLeft,
    top: chartPlotTop,
    height: chartPlotHeight,
    width: chartPlotWidth,
  } = chartPlotPosition;

  const { rangeAnnotationConfig, startLeft, endLeft } = annotation;

  const style: CSSProperties = useMemo(() => {
    const color = rangeAnnotationConfig?.curtainColor
      ? getChartColorHexString(rangeAnnotationConfig.curtainColor, theme)
      : getChartThemedColors(theme).annotationVerticalRange;
    const borderStyle = `1px dashed ${color}`;
    const left = Math.max(chartPlotLeft + startLeft, chartPlotLeft);

    const opacity = activeAnnotationId === annotation.id ? 0.25 : 0.2;
    return {
      position: 'absolute',
      height: chartPlotHeight,
      top: chartPlotTop + 1,
      left,
      width: Math.min(endLeft + chartPlotLeft, chartPlotWidth + chartPlotLeft) - left,
      borderLeft: startLeft >= 0 ? borderStyle : undefined, // only render left border if start is within chart plot area
      borderRight: endLeft <= chartPlotWidth ? borderStyle : undefined, // only render right border if end is within chart plot area
      backgroundColor: `${color}${Math.round(opacity * 255).toString(16)}`,
    };
  }, [
    rangeAnnotationConfig?.curtainColor,
    theme,
    chartPlotLeft,
    startLeft,
    activeAnnotationId,
    annotation.id,
    chartPlotHeight,
    chartPlotTop,
    endLeft,
    chartPlotWidth,
  ]);

  return <div style={style} />;
};

export default RangeAnnotationCurtain;
