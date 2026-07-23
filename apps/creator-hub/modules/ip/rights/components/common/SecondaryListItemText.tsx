import type { ReactNode } from 'react';
import React from 'react';
import { Grid, Typography } from '@rbx/ui';

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
