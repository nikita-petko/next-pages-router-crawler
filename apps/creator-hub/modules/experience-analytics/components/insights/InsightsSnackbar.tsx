import React, { ReactNode } from 'react';
import { Grid, Typography, CheckCircleOutlineIcon, ErrorOutlineOutlinedIcon } from '@rbx/ui';

type InsightsSnackbarProps = {
  isSuccess: boolean;
  children: ReactNode;
};

const InsightsSnackbar = ({ isSuccess, children }: InsightsSnackbarProps) => {
  return (
    <Grid container spacing={1} alignItems='center'>
      <Grid item>{isSuccess ? <CheckCircleOutlineIcon /> : <ErrorOutlineOutlinedIcon />}</Grid>
      <Grid item>
        <Typography>{children}</Typography>
      </Grid>
    </Grid>
  );
};

export default InsightsSnackbar;
