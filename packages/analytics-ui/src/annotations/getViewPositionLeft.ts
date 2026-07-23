import type { AnnotationPosition } from '../types/Annotation';

const getViewPositionLeft = ({
  annotationPosition,
  upperBound,
}: {
  annotationPosition: AnnotationPosition;
  upperBound: number;
}) => {
  const { startLeft, endLeft } = annotationPosition;
  if (endLeft === undefined) {
    return startLeft;
  }

  return Math.max(Math.min((startLeft + endLeft) / 2, upperBound), 0);
};

export default getViewPositionLeft;
