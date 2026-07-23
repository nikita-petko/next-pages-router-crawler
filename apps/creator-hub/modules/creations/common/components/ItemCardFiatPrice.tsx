import React, { FunctionComponent, useState, useEffect } from 'react';
import { Grid, Typography, Skeleton } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { Money } from '@rbx/clients/developerSubscriptionsApi';

export interface ItemCardPriceProps {
  price: Money | undefined;
  isLoading: boolean;
}

const ItemCardFiatPrice: FunctionComponent<React.PropsWithChildren<ItemCardPriceProps>> = ({
  price,
  isLoading,
}) => {
  const { translate } = useTranslation();
  const [displayPrice, setDisplayPrice] = useState<string>('');

  useEffect(() => {
    if (typeof price !== 'undefined' && price !== null) {
      setDisplayPrice(`${price.units}.${price.cents}`);
    }
  }, [price]);

  if (isLoading) {
    return (
      <Typography variant='body2' color='secondary' noWrap>
        <Skeleton width='88%' />
      </Typography>
    );
  }

  if (typeof price === 'undefined' || price === null) {
    return null;
  }

  return (
    <Grid container alignItems='center'>
      <Typography variant='body2' noWrap>
        {`${translate('Label.Price')}: $${displayPrice}`}
      </Typography>
    </Grid>
  );
};

export default ItemCardFiatPrice;
