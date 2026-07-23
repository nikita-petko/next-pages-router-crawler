import type { FunctionComponent } from 'react';
import React from 'react';
import { makeStyles } from '@rbx/ui';
import { NextStepsTileSize } from '../../constants/tileConstants';
import LoadingCard from '../common/LoadingCard';

const useStyles = makeStyles()({
  root: {
    width: NextStepsTileSize.small.width,
    height: NextStepsTileSize.small.height,
  },
});

const NextStepsLoadingTile: FunctionComponent<React.PropsWithChildren> = () => {
  const {
    classes: { root },
  } = useStyles();

  return <LoadingCard classes={{ root }} />;
};

export default NextStepsLoadingTile;
