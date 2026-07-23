import React, { FunctionComponent } from 'react';
import { Skeleton, Card, makeStyles } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';

type TTileSize = { width: number; height: number };

const LoadingTileSize: TTileSize = {
  width: 250,
  height: 200,
};

const useExpertTileStyles = makeStyles()((theme) => ({
  root: {
    width: LoadingTileSize.width,
    height: LoadingTileSize.height,
    backgroundColor: theme.palette.background.paper,
  },
  skeleton: {
    height: '100%',
    width: '100%',
  },
}));

const useCardStyles = makeStyles()((theme) => ({
  root: {
    '&:hover, &:focus-within': {
      border: `1px solid ${theme.palette.action.active}`,
    },
    padding: 0,
  },
}));

const LoadingTile: FunctionComponent<React.PropsWithChildren> = () => {
  const {
    classes: { root: expertTileRoot, skeleton },
    cx,
  } = useExpertTileStyles();
  const {
    classes: { root: cardRoot },
  } = useCardStyles();
  const { translate } = useTranslation();
  return (
    <Card
      classes={{ root: cx(expertTileRoot, cardRoot) }}
      aria-roledescription={translate('Label.Listitem')}
      aria-label={translate('Label.LoadingIndicatorTile')}>
      <Skeleton animate variant='rectangular' classes={{ root: skeleton }} />
    </Card>
  );
};

export default LoadingTile;
