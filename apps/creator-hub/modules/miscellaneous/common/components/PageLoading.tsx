import React, { FunctionComponent } from 'react';
import { Grid as UIGrid, CircularProgress } from '@rbx/ui';
import usePageLoadingStyles from './PageLoading.styles';

const PageLoading: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const {
    classes: { root },
  } = usePageLoadingStyles();

  return (
    <UIGrid classes={{ root }} container justifyContent='center' alignItems='center'>
      <CircularProgress />
    </UIGrid>
  );
};

export default PageLoading;
