import React, { FunctionComponent } from 'react';
import { Typography, Grid, Paper } from '@rbx/ui';
import useOverviewDescriptionStyles from './OverviewDescription.styles';

export interface OverviewDescriptionProps {
  descriptionText: string;
  heading: string;
}

const OverviewDescription: FunctionComponent<React.PropsWithChildren<OverviewDescriptionProps>> = ({
  descriptionText,
  heading,
}) => {
  const {
    classes: { background, description },
  } = useOverviewDescriptionStyles();

  return (
    <Grid item XSmall={12}>
      <Paper className={background}>
        <Typography color='secondary' variant='h6'>
          {heading}
        </Typography>
        <br />
        <Typography className={description} variant='body1'>
          {descriptionText}
        </Typography>
      </Paper>
    </Grid>
  );
};

export default OverviewDescription;
