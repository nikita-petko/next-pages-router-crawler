import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography, Skeleton, RobuxIcon, makeStyles } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const useItemCardPriceStyles = makeStyles()({
  robuxIcon: {
    paddingRight: 4,
  },
});
export interface ItemCardPriceProps {
  pricePrefix?: string;
  isSellable: boolean;
  price: number | null;
  isLoading: boolean;
}

const ItemCardPrice: FunctionComponent<React.PropsWithChildren<ItemCardPriceProps>> = ({
  pricePrefix,
  isSellable,
  price,
  isLoading,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { robuxIcon },
  } = useItemCardPriceStyles();

  if (isLoading) {
    return (
      <Typography variant='body2' color='secondary' noWrap>
        <Skeleton width='88%' />
      </Typography>
    );
  }

  if (!isSellable) {
    return (
      <Typography variant='body2' color='secondary' noWrap>
        {translate('Label.CannotBeSold')}
      </Typography>
    );
  }
  if (price === null) {
    return (
      <Typography variant='body2' color='secondary' noWrap>
        {translate('Label.Offsale')}
      </Typography>
    );
  }

  if (price === 0) {
    return (
      <Typography variant='body2' noWrap>
        {pricePrefix}
        <span>&nbsp;</span>
        {translate('Label.Free')}
      </Typography>
    );
  }

  return (
    <Grid container alignItems='center'>
      <Typography variant='body2' noWrap>
        {pricePrefix}
      </Typography>
      <span>&nbsp;</span>
      <RobuxIcon fontSize='small' className={robuxIcon} />
      <Typography variant='body2' noWrap>
        {price}
      </Typography>
    </Grid>
  );
};

export default withTranslation(ItemCardPrice, [TranslationNamespace.Creations]);
