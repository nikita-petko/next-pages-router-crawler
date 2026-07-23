import React, { FunctionComponent } from 'react';
import { makeStyles } from '@rbx/ui';
import { ExperienceTileSize } from '../../constants/tileConstants';
import LoadingCard from '../common/LoadingCard';

const useStyles = makeStyles()({
  root: {
    width: ExperienceTileSize.small.width,
    height: ExperienceTileSize.small.height,
  },
});

const ExperiencesLoadingTile: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const {
    classes: { root },
  } = useStyles();

  return <LoadingCard classes={{ root }} />;
};

export default ExperiencesLoadingTile;
