import { Grid, Typography } from '@rbx/ui';
import React, { ReactNode } from 'react';

export interface SecondaryListItemProps {
  primary: ReactNode;
  secondary: ReactNode;
}
const SecondaryListItemText = ({ primary, secondary }: SecondaryListItemProps) => {
  return (
    <Grid direction='column'>
      <Grid item>
        <Typography color='secondary'>{secondary}</Typography>
      </Grid>
      <Grid item>
        <Typography>{primary}</Typography>
      </Grid>
    </Grid>
  );
};

export default SecondaryListItemText;
