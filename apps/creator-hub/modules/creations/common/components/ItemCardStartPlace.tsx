import React, { FunctionComponent } from 'react';
import { Typography, StarIcon, Skeleton } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useItemCarStartPlaceStyles from './ItemCardStartPlace.styles';

export interface ItemCardStartPlaceProps {
  isStartPlace: boolean;
  isLoading: boolean;
}

const ItemCardStartPlace: FunctionComponent<React.PropsWithChildren<ItemCardStartPlaceProps>> = ({
  isStartPlace,
  isLoading,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { divStyle, typographyStyle },
  } = useItemCarStartPlaceStyles();
  if (isLoading) {
    <Skeleton />;
  }
  if (isStartPlace) {
    return (
      <div className={divStyle}>
        <StarIcon fontSize='small' />
        <Typography variant='body2' className={typographyStyle} noWrap>
          {translate('Label.startPlace')}
        </Typography>
      </div>
    );
  }
  return null;
};

export default ItemCardStartPlace;
