import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Skeleton, Card, makeStyles } from '@rbx/ui';
import { TileSize } from '../../constants/feedConstants';

// Matches FeedTile's rendered height (thumbnail + title + description)
// so the loading→loaded transition doesn't shift surrounding content.
const LOADING_TILE_HEIGHT = 268;

const useStyles = makeStyles()((theme) => ({
  root: {
    width: TileSize.width,
    height: LOADING_TILE_HEIGHT,
    backgroundColor: theme.palette.surface[200],
    padding: 0,
  },
  skeleton: {
    height: '100%',
    width: '100%',
  },
}));

const LoadingTile: FunctionComponent<React.PropsWithChildren> = () => {
  const {
    classes: { root, skeleton },
  } = useStyles();
  const { translate } = useTranslation();
  return (
    <Card
      classes={{ root }}
      aria-roledescription={translate('Label.Listitem')}
      aria-label={translate('Label.LoadingIndicatorTile')}>
      <Skeleton animate variant='rectangular' classes={{ root: skeleton }} />
    </Card>
  );
};

export default LoadingTile;
