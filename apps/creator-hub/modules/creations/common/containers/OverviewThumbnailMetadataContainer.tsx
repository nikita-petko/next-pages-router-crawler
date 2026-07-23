import type { FunctionComponent, ReactNode } from 'react';
import React from 'react';
import { Grid, Paper } from '@rbx/ui';
import useOverviewContainerStyles from './OverviewContainer.styles';

export interface OverviewThumbnailMetadataContainerProps {
  children: ReactNode;
}

const OverviewThumbnailMetadataContainer: FunctionComponent<
  React.PropsWithChildren<OverviewThumbnailMetadataContainerProps>
> = ({ children }) => {
  const {
    classes: { background },
  } = useOverviewContainerStyles();

  return (
    <Grid item XSmall={12}>
      <Paper className={background}>
        <Grid container spacing={2}>
          {children}
        </Grid>
      </Paper>
    </Grid>
  );
};

export default OverviewThumbnailMetadataContainer;
