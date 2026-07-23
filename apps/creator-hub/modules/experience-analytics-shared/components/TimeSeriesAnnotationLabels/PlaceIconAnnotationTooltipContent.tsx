import React, { FC } from 'react';
import { AnnotationType } from '@modules/clients/analytics';
import { makeStyles } from '@rbx/ui';
import { TimeSeriesAnnotation } from '@modules/charts-generic';

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
