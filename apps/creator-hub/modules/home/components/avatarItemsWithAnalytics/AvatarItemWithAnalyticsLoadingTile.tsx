import React, { FunctionComponent } from 'react';
import { makeStyles } from '@rbx/ui';
import { AvatarItemWithAnalyticsTileSize } from '../../constants/tileConstants';
import LoadingCard from '../common/LoadingCard';

const useStyles = makeStyles()({
  root: {
    width: AvatarItemWithAnalyticsTileSize.small.width,
    height: AvatarItemWithAnalyticsTileSize.small.height,
  },
});

const AvatarItemWithAnalyticsLoadingTile: FunctionComponent<
  React.PropsWithChildren<unknown>
> = () => {
  const {
    classes: { root },
  } = useStyles();
  return <LoadingCard classes={{ root }} />;
};

export default AvatarItemWithAnalyticsLoadingTile;
