import type { FC, CSSProperties } from 'react';
import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { makeStyles, Tooltip, Typography } from '@rbx/ui';
import { useActivatedAnnotation } from '../context/ActivatedAnnotationContext';
import type { ChartPlotPosition } from '../highchart-options/annotationsOptions';
import type { FormatXForAnnotationTooltip, GroupAnnotationWithPosition } from '../types/Annotation';
import AnnotationIconWithTooltip, { iconSize } from './AnnotationIconWithTooltip';
import getViewPositionLeft from './getViewPositionLeft';
import getXAxisTooltipProps from './getXAxisTooltipProps';
import RangeAnnotationCurtain, { isRangeAnnotation } from './RangeAnnotationCurtain';
import { annotationZIndex } from './z-index';

const maxNumberOfCollapsedIcons = 4;
const gap = 6; // spacing between un-collapsed icons and group container padding
const maxColumns = 7;
const hitBoxExtensionSize = 8;

enum GroupTransitionStatus {
  InTransition = 'inTransition',
  Ended = 'Ended',
}

const useStyles = makeStyles<void, 'annotationIconContainer'>()((theme, _params, classes) => {
  return {
    annotationIconContainer: {
      display: 'flex',
      transformOrigin: `bottom left`,
      transition: `0.1s ease`,
      transitionProperty: `transform`,
    },
    annotationGroup: {
      position: 'absolute',
      boxSizing: 'border-box',
      display: 'grid',
      zIndex: annotationZIndex,
      borderRadius: theme.border.radius.xsmall.borderRadius,
      maxWidth: iconSize,
      transition: '0.1s ease',
      transform: `translateX(-${iconSize / 2}px)`,
      transitionProperty:
        'z-index, border-radius, padding, background-color, transform, opacity, max-height, max-width',
      // before pseudo element is used for extending group hit box on left
      [`&:before`]: {
        content: `''`,
        position: 'absolute',
        height: iconSize,
        width: hitBoxExtensionSize,
        left: -hitBoxExtensionSize,
      },
      // after pseudo element is used for extending group hit box on top
      [`&:after`]: {
        content: `''`,
        position: 'absolute',
        height: hitBoxExtensionSize,
        width: iconSize,
        top: -hitBoxExtensionSize,
      },
    },
    annotationGroupActive: {
      maxWidth: `unset`,
      zIndex: theme.zIndex.tooltip,
      padding: `${gap}px`,
      gap: `${gap}px`,
      transform: `translateX(-${iconSize / 2 + gap}px) translateY(-${gap}px)`,
      opacity: 1,
      backgroundColor: theme.palette.surface.outline,
      [`& .${classes.annotationIconContainer}`]: {
        transform: `translateX(0) rotate(0deg)`,
      },
    },
    dimmedAnnotationGroup: {
      opacity: 0.2,
    },
  };
});

type GroupAnnotationProps = {
  group: GroupAnnotationWithPosition;
  chartPlotPosition: ChartPlotPosition;
  formatXForAnnotationTooltip?: FormatXForAnnotationTooltip;
};

const GroupAnnotation: FC<GroupAnnotationProps> = ({
  group,
  chartPlotPosition,
  formatXForAnnotationTooltip,
}) => {
  const {
    classes: {
      annotationGroup,
      dimmedAnnotationGroup,
      annotationIconContainer,
      annotationGroupActive,
    },
    css,
    cx,
    theme,
  } = useStyles();
  const { activeAnnotationId, updateActiveAnnotationId } = useActivatedAnnotation();
  const {
    left: chartPlotLeft,
    top: chartPlotTop,
    height: chartPlotHeight,
    width: chartPlotWidth,
  } = chartPlotPosition;
  const groupContainerRef = useRef<HTMLDivElement>(null);

  const groupId = useMemo(() => group.map(({ id }) => id).join('-'), [group]);
  const active = useMemo(
    () => activeAnnotationId === groupId || group.some(({ id }) => id === activeAnnotationId),
    [activeAnnotationId, groupId, group],
  );

  const groupLeft = getViewPositionLeft({
    annotationPosition: group[0],
    upperBound: chartPlotWidth,
  });
  const numOfColumns = useMemo(() => {
    /**
     *              iconSize
     *                <--->
     * |              |___| --> icon
     * |                |
     * |                |
     * |                |
     * |                |
     * |                |--> groupLeft
     * |________________|_______________
     * <---------chartPlotWidth-------->
     */
    const availableWidth = chartPlotWidth - (groupLeft - iconSize / 2 - gap);
    const availableColumns = Math.floor(availableWidth / (iconSize + gap));
    return Math.min(Math.max(availableColumns, 1), group.length, maxColumns);
  }, [chartPlotWidth, group.length, groupLeft]);

  const groupPositionStyle: CSSProperties = useMemo(() => {
    return {
      left: chartPlotLeft + groupLeft,
      top: chartPlotTop,
      gridTemplateColumns: `repeat(${numOfColumns}, ${iconSize}px)`,
    };
  }, [chartPlotLeft, chartPlotTop, numOfColumns, groupLeft]);

  const onGroupMouseEnter = useCallback(() => {
    updateActiveAnnotationId?.(groupId);
  }, [groupId, updateActiveAnnotationId]);
  const onGroupMouseLeave = useCallback(() => {
    updateActiveAnnotationId?.(null);
  }, [updateActiveAnnotationId]);
  const onMouseEnterIcon = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      updateActiveAnnotationId?.(event.currentTarget.id);
    },
    [updateActiveAnnotationId],
  );

  const stackedAnnotations = useMemo(() => {
    const maxNumberOfRows = Math.floor(chartPlotHeight / (gap + iconSize));
    const maxNumberOfUnCollapsedIcons = numOfColumns * maxNumberOfRows - 1;
    const items = group.slice(0, active ? maxNumberOfUnCollapsedIcons : maxNumberOfCollapsedIcons);

    const annotationIcons = items.map((item, idx) => {
      const columnIndex = idx % numOfColumns;
      const rowIndex = Math.floor(idx / numOfColumns);

      const translateY = -rowIndex * iconSize;
      const translateX = -columnIndex * iconSize;

      // Because we want to override 'transform' when container element is hovered,
      // here we use css`` to generate className instead of applying inline style due to inline-style's higher specificity
      // (We can't put it in useStyles() since we need a different value per index)
      const className = css`
        transform: translateY(${translateY}px) translateX(${translateX}px)
          rotate(${-8 * (items.length - idx - 1)}deg);
      `;

      return (
        <div
          key={item.id}
          id={item.id}
          onMouseEnter={active ? onMouseEnterIcon : undefined}
          className={cx(annotationIconContainer, className)}>
          <AnnotationIconWithTooltip annotation={item} />
        </div>
      );
    });

    if (active && annotationIcons.length < group.length) {
      // add ... at the end
      annotationIcons.push(
        <Typography variant='h3' display='block' textAlign='center' key='ellipsis'>
          ...
        </Typography>,
      );
    }
    return annotationIcons;
  }, [
    chartPlotHeight,
    numOfColumns,
    group,
    active,
    css,
    onMouseEnterIcon,
    cx,
    annotationIconContainer,
  ]);

  // Transition for unfolding collapsed icons takes time, plotLines rely on group container element's
  // position to draw. Have a separate state helps to prevent reading group container's position before
  // transition ends.
  const [groupTransitionStatus, setGroupTransitionStatus] = useState<GroupTransitionStatus>(
    GroupTransitionStatus.Ended,
  );
  const onTransitionEnd: React.TransitionEventHandler<HTMLDivElement> = useCallback((event) => {
    if (event.propertyName === 'transform') {
      setGroupTransitionStatus(GroupTransitionStatus.Ended);
    }
  }, []);
  useEffect(() => {
    if (active) {
      setGroupTransitionStatus(GroupTransitionStatus.InTransition);
    }
  }, [active]);

  /** Curtain is for range annotations */
  const curtain = useMemo(() => {
    const rangeAnnotationCurtains: React.ReactNode[] = [];
    group.forEach((annotation) => {
      if (isRangeAnnotation(annotation) && annotation.rangeAnnotationConfig?.curtainStayOnChart) {
        rangeAnnotationCurtains.push(
          <RangeAnnotationCurtain
            key={annotation.id}
            annotation={annotation}
            chartPlotPosition={chartPlotPosition}
          />,
        );
      }
    });

    const activeAnnotation = group.find(({ id }) => id === activeAnnotationId);
    if (!activeAnnotation) {
      return rangeAnnotationCurtains.length ? rangeAnnotationCurtains : null;
    }

    if (isRangeAnnotation(activeAnnotation)) {
      rangeAnnotationCurtains.push(
        <RangeAnnotationCurtain
          key={activeAnnotation.id}
          annotation={activeAnnotation}
          chartPlotPosition={chartPlotPosition}
        />,
      );
    }
    return rangeAnnotationCurtains;
  }, [activeAnnotationId, chartPlotPosition, group]);

  /** Plot lines are for non-range annotations */
  const plotLines = useMemo(() => {
    const groupContainerElement = groupContainerRef.current;
    if (!groupContainerElement || !active) {
      return null;
    }

    if (groupTransitionStatus !== GroupTransitionStatus.Ended) {
      // If group is still in transition, don't render plot lines
      return null;
    }

    const activeAnnotationIndex = group.findIndex(({ id }) => id === activeAnnotationId);
    if (activeAnnotationIndex === -1) {
      return null;
    }

    const activeAnnotation = group[activeAnnotationIndex];
    if (isRangeAnnotation(activeAnnotation)) {
      // range annotation's curtain is handled separately, no need to draw lines
      return null;
    }

    const annotationLeft = getViewPositionLeft({
      annotationPosition: activeAnnotation,
      upperBound: chartPlotWidth,
    });
    const numOfIconsPerRow = Math.floor(
      (groupContainerElement.offsetWidth - gap) / (gap + iconSize),
    );
    const columnIndex = activeAnnotationIndex % numOfIconsPerRow;

    const commonStyle: CSSProperties = {
      position: 'absolute',
      border: `0.5px dashed ${theme.palette.content.standard}`,
      zIndex: theme.zIndex.tooltip,
    };

    const segmentOneStyle = {
      ...commonStyle,
      height: 4,
      top: groupContainerElement.offsetTop + groupContainerElement.offsetHeight - gap,
      left: chartPlotLeft + groupLeft + (gap + iconSize) * columnIndex,
    };

    const isSegmentTwoOnLeftSide = segmentOneStyle.left < chartPlotLeft + annotationLeft;
    const segmentTwoStyle = {
      ...commonStyle,
      top: segmentOneStyle.top + segmentOneStyle.height + 1,
      left: isSegmentTwoOnLeftSide ? segmentOneStyle.left : chartPlotLeft + annotationLeft,
      width: Math.abs(segmentOneStyle.left - (chartPlotLeft + annotationLeft)),
    };

    const segmentThreeStyle = {
      ...commonStyle,
      top: segmentTwoStyle.top + 1,
      left: chartPlotLeft + annotationLeft,
      height: chartPlotHeight - segmentTwoStyle.top + gap,
    };

    return (
      <>
        <div style={segmentOneStyle} />
        <div style={segmentTwoStyle} />
        <Tooltip
          {...getXAxisTooltipProps({
            annotation: activeAnnotation,
            formatXForAnnotationTooltip,
          })}>
          <div style={segmentThreeStyle} />
        </Tooltip>
      </>
    );
  }, [
    active,
    groupTransitionStatus,
    group,
    chartPlotWidth,
    theme.palette.content.standard,
    theme.zIndex.tooltip,
    chartPlotLeft,
    groupLeft,
    chartPlotHeight,
    formatXForAnnotationTooltip,
    activeAnnotationId,
  ]);

  return (
    <>
      <div
        ref={groupContainerRef}
        className={cx(annotationGroup, {
          [dimmedAnnotationGroup]: !active && activeAnnotationId !== null,
          [annotationGroupActive]: active,
        })}
        style={groupPositionStyle}
        onMouseEnter={onGroupMouseEnter}
        onMouseLeave={onGroupMouseLeave}
        onTransitionEnd={onTransitionEnd}>
        {stackedAnnotations}
      </div>
      {plotLines}
      {curtain}
    </>
  );
};

export default React.memo(GroupAnnotation);
