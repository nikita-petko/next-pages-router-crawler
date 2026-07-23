import type { FunctionComponent } from 'react';
import React from 'react';
import { makeStyles } from '@rbx/ui';
import LoadingCard from '../common/LoadingCard';
import { getCarouselTileBaseStyles } from './Updates.styles';

const useStyles = makeStyles()((theme) => ({
  container: {
    display: 'flex',
    width: 330,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 16,
    alignSelf: 'stretch',
  },
  // Mobile carousel only - inherits from Updates.styles
  carouselContainer: getCarouselTileBaseStyles(theme),
}));

type TUpdatesLoadingTileProps = {
  isCarousel?: boolean;
};

const UpdatesLoadingTile: FunctionComponent<React.PropsWithChildren<TUpdatesLoadingTileProps>> = ({
  isCarousel,
}) => {
  const {
    classes: { container, carouselContainer },
  } = useStyles();
  return (
    <div className={isCarousel ? carouselContainer : container}>
      <LoadingCard />
    </div>
  );
};

export default UpdatesLoadingTile;
