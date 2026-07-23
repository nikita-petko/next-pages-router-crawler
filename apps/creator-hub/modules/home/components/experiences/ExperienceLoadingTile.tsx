import type { FunctionComponent } from 'react';
import React from 'react';
import { makeStyles } from '@rbx/ui';
import { ExperienceWithAnalyticsTileSizeV2 } from '../../constants/tileConstants';
import LoadingCard from '../common/LoadingCard';

const useStyles = makeStyles()({
  root: {
    width: ExperienceWithAnalyticsTileSizeV2.width,
    height: ExperienceWithAnalyticsTileSizeV2.height,
  },
});

const ExperiencesLoadingTile: FunctionComponent<React.PropsWithChildren> = () => {
  const {
    classes: { root },
  } = useStyles();

  return <LoadingCard classes={{ root }} />;
};

export default ExperiencesLoadingTile;
