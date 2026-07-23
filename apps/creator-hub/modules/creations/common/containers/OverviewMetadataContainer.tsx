import type { FunctionComponent, ReactNode } from 'react';
import React from 'react';
import { Grid } from '@rbx/ui';
import useOverviewContainerStyles from './OverviewContainer.styles';

export interface OverviewMetadataContainerProps {
  headerMetadata: ReactNode; // react component to display across the top of the metadata container
  statistics?: ReactNode; // react component to display across the bottom of the metadata container (can use OverviewStats components)
  actions?: ReactNode; // react component to display buttons that can be acted on
}

const OverviewMetadataContainer: FunctionComponent<
  React.PropsWithChildren<OverviewMetadataContainerProps>
> = ({ headerMetadata, statistics, actions }) => {
  const {
    classes: { overviewHeaderContainer, overviewHeaderMetaData, overviewActionsContainer },
  } = useOverviewContainerStyles();

  return (
    <Grid item XSmall={12} Large={8}>
      <Grid className={overviewHeaderContainer} container direction='column'>
        <Grid className={overviewHeaderMetaData} item>
          {headerMetadata}
        </Grid>
        {statistics && (
          <Grid item container wrap='wrap'>
            {statistics}
          </Grid>
        )}
        {actions && (
          <Grid item container className={overviewActionsContainer}>
            {actions}
          </Grid>
        )}
      </Grid>
    </Grid>
  );
};

export default OverviewMetadataContainer;
