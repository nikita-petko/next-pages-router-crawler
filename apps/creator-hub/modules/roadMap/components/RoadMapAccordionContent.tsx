import React, { FunctionComponent, ReactNode, useEffect, useState } from 'react';
import { Grid, Typography } from '@rbx/ui';
import useRoadMapAccordionStyles from './RoadMapAccordion.styles';

export type RoadMapAccordionContentProps = {
  content: string | ReactNode;
  image: string;
  isExpended: boolean;
};

const RoadMapAccordionContent: FunctionComponent<
  React.PropsWithChildren<RoadMapAccordionContentProps>
> = ({ content, image, isExpended }) => {
  const {
    classes: { image: imageStyle, imageWrapper },
  } = useRoadMapAccordionStyles();
  const [loadImage, setLoadImage] = useState(isExpended);

  useEffect(() => {
    if (isExpended) {
      setLoadImage(true);
    }
  }, [isExpended]);

  return (
    <Grid>
      <Grid className={imageWrapper}>
        {loadImage ? <img src={image} className={imageStyle} alt='' /> : null}
      </Grid>
      <Typography>{content}</Typography>
    </Grid>
  );
};

export default RoadMapAccordionContent;
