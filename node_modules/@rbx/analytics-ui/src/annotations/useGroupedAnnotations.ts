import { useMemo } from 'react';
import type {
  AnnotationPosition,
  AnnotationWithPosition,
  GroupAnnotationWithPosition,
  TAnnotation,
} from '../types/Annotation';
import { iconSize } from './AnnotationIconWithTooltip';
import getViewPositionLeft from './getViewPositionLeft';

const EMPTY_ANNOTATIONS_RESULT: Array<AnnotationWithPosition | GroupAnnotationWithPosition> = [];

// export for test purpose
export const groupThreshold = iconSize + 10;

/**
 * Groups annotations by their horizontal position on the chart. Annotations that are within
 * the groupThreshold distance of each other will be grouped together into an array.
 * Annotations that are further apart will remain as individual items.
 *
 * @param annotationPositions - Array of annotation positions containing id and left coordinate
 * @param annotations - Array of annotation objects containing id, Icon, tooltip and other properties
 * @returns An array where each item is either:
 *          - A single annotation with its position ({...annotation, left})
 *          - An array of annotations that are close enough to be grouped together
 *          Annotations are sorted by their left position from left to right.
 */
const useGroupedAnnotations = ({
  annotationPositions,
  annotations,
  chartPlotWidth,
}: {
  annotationPositions: AnnotationPosition[];
  chartPlotWidth: number;
  annotations?: TAnnotation[];
}) => {
  const sortedAnnotationPositions = useMemo(
    () =>
      [...annotationPositions].sort(
        (a, b) =>
          getViewPositionLeft({ annotationPosition: a, upperBound: chartPlotWidth }) -
          getViewPositionLeft({ annotationPosition: b, upperBound: chartPlotWidth }),
      ),
    [annotationPositions, chartPlotWidth],
  );

  return useMemo(() => {
    if (!annotations?.length) {
      return EMPTY_ANNOTATIONS_RESULT;
    }
    const groups: Array<AnnotationWithPosition | GroupAnnotationWithPosition> = [];

    sortedAnnotationPositions.forEach((annotationPosition) => {
      const annotation = annotations.find((a) => a.id === annotationPosition.id);
      if (!annotation) {
        return;
      }

      const left = getViewPositionLeft({
        annotationPosition,
        upperBound: chartPlotWidth,
      });
      const prevGroup = groups.length > 0 ? groups[groups.length - 1] : null;

      if (!prevGroup) {
        groups.push({ ...annotation, ...annotationPosition });
      } else if (Array.isArray(prevGroup)) {
        // if previous anntotaion is a group
        const prevAnnotation = prevGroup[0];
        if (
          getViewPositionLeft({
            annotationPosition: prevAnnotation,
            upperBound: chartPlotWidth,
          }) +
            groupThreshold >=
          left
        ) {
          prevGroup.push({ ...annotation, ...annotationPosition });
        } else {
          groups.push({ ...annotation, ...annotationPosition });
        }
      } else if (
        getViewPositionLeft({
          annotationPosition: prevGroup,
          upperBound: chartPlotWidth,
        }) +
          groupThreshold >=
        left
      ) {
        // else we need a new group
        const newGroup = [prevGroup, { ...annotation, ...annotationPosition }];
        groups[groups.length - 1] = newGroup;
      } else {
        groups.push({ ...annotation, ...annotationPosition });
      }
    });

    return groups;
  }, [annotations, chartPlotWidth, sortedAnnotationPositions]);
};

export default useGroupedAnnotations;
