import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography, Skeleton, RobuxIcon, makeStyles } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const useItemCardPriceStyles = makeStyles()({
  robuxIcon: {
    paddingRight: 4,
  },
  dot: {
    padding: '0 6px',
  },
});
export interface LookItemCardPriceProps {
  pricePrefix?: string;
  price: number | null;
  isLoading: boolean;
  itemCount?: number;
}

const LookItemCardPrice: FunctionComponent<React.PropsWithChildren<LookItemCardPriceProps>> = ({
  pricePrefix,
  price,
  isLoading,
  itemCount,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { robuxIcon, dot },
  } = useItemCardPriceStyles();

  if (isLoading) {
    return (
      <Typography variant='body2' color='secondary' noWrap>
        <Skeleton width='88%' />
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
        {translate('Label.Free')}
      </Typography>
    );
  }

  return (
    <Grid container alignItems='center'>
      <Typography variant='body2' noWrap>
        {pricePrefix}
      </Typography>
      <RobuxIcon fontSize='small' className={robuxIcon} />
      <Typography variant='body2' noWrap>
        {price}
      </Typography>
      {itemCount !== undefined && itemCount > 0 && (
        <>
          <Typography variant='body2' color='secondary' className={dot}>
            •
          </Typography>
          <Typography variant='body2' color='secondary' noWrap>
            {translate('Label.Items', {
              numOfItems: itemCount.toString(),
            })}
          </Typography>
        </>
      )}
    </Grid>
  );
};

export default withTranslation(LookItemCardPrice, [TranslationNamespace.Creations]);
