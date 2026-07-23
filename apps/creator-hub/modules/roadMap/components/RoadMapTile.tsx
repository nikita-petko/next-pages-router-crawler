import type { FunctionComponent } from 'react';
import React from 'react';
import { Grid, Typography } from '@rbx/ui';
import type { RoadMapSectionDetailsType } from './hooks/useRoadMapTranslation';
import RoadMapAccordion from './RoadMapAccordion';
import RoadMapComingSoon from './RoadMapComingSoon';
import useRoadMapTileStyles from './RoadMapTile.styles';

export type RoadMapTileProps = RoadMapSectionDetailsType;

const RoadMapTile: FunctionComponent<React.PropsWithChildren<RoadMapTileProps>> = ({
  title,
  description,
  accordionDetails,
  comingSoonTime,
}) => {
  const {
    classes: { container, titleSection, title: titleClass, accordions: accordionsClass },
  } = useRoadMapTileStyles();

  return (
    <Grid container direction='row' classes={{ root: container }}>
      <Grid item XSmall={12} Large={5} XXLarge={4} classes={{ root: titleSection }}>
        <Typography component='h3' variant='h3' classes={{ root: titleClass }}>
          {title}
        </Typography>
        <Typography component='p' variant='body1'>
          {description}
        </Typography>
      </Grid>
      <Grid item XSmall={12} Large={7} XXLarge={8} classes={{ root: accordionsClass }}>
        {accordionDetails ? (
          accordionDetails.map((accordionDetail) => (
            <RoadMapAccordion key={accordionDetail.title} {...accordionDetail} />
          ))
        ) : (
          <RoadMapComingSoon comingIn={comingSoonTime} />
        )}
      </Grid>
    </Grid>
  );
};

export default RoadMapTile;
