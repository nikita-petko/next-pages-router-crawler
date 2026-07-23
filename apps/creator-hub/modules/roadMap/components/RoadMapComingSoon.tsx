import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, LockIcon, Typography } from '@rbx/ui';
import useRoadMapComingSoonStyles from './RoadMapComingSoon.styles';

type RoadMapComingSoonProps = { comingIn?: number };
const RoadMapComingSoon: FunctionComponent<React.PropsWithChildren<RoadMapComingSoonProps>> = ({
  comingIn,
}) => {
  const {
    classes: { root, header, icon },
  } = useRoadMapComingSoonStyles();
  const { translate } = useTranslation();

  return (
    <Grid classes={{ root }}>
      <LockIcon classes={{ root: icon }} />
      <Typography variant='h3' classes={{ root: header }}>
        {translate('Heading.ComingSoon')}
      </Typography>
      {comingIn ? (
        <Typography variant='body1'>
          {translate(`Description.ComingIn${comingIn !== 1 ? 'Plural' : ''}`, {
            comingIn: comingIn.toString(),
          })}
        </Typography>
      ) : null}
    </Grid>
  );
};

export default RoadMapComingSoon;
