import type { FunctionComponent } from 'react';
import React, { useState, useEffect } from 'react';
import type { Money } from '@rbx/client-developer-subscriptions-api/v1';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography, Skeleton } from '@rbx/ui';

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
