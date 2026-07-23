import type { FC } from 'react';
import { makeStyles } from '@rbx/ui';
import type { TimeSeriesAnnotation } from '@modules/charts-generic/charts/types/Annotations';
import type { AnnotationType } from '@modules/clients/analytics';

const useStyles = makeStyles()(() => ({
  iconContainer: {
    display: 'flex',
    width: '64px',
    height: '64px',
  },
}));

type PlaceIconAnnotationTooltipContentProps = {
  annotation: TimeSeriesAnnotation & {
    type: AnnotationType.PlaceIcon;
  };
};

const PlaceIconAnnotationTooltipContent: FC<PlaceIconAnnotationTooltipContentProps> = ({
  annotation,
}) => {
  const {
    classes: { iconContainer },
  } = useStyles();
  const { imageUrl } = annotation;
  return <img src={imageUrl} alt={imageUrl} className={iconContainer} />;
};

export default PlaceIconAnnotationTooltipContent;
