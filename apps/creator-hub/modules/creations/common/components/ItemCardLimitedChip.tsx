import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Chip, Grid, useTheme } from '@rbx/ui';
import useItemCardStyles from './ItemCard.styles';

const limitedsChipPath = `${process.env.assetPathPrefix}/limiteds`; // TODO have this become a UIBlox icon

export interface ItemCardLimitedChipProps {
  isLoading: boolean;
  isLimited: boolean;
}

const ItemCardLimitedChip: FunctionComponent<React.PropsWithChildren<ItemCardLimitedChipProps>> = ({
  isLoading,
  isLimited,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { itemCardChip, itemCardChipSparkle, itemCardChipHash },
  } = useItemCardStyles();
  const theme = useTheme();

  if (isLoading || !isLimited) {
    return null;
  }

  return (
    <Chip
      icon={
        <Grid item XSmall={12}>
          <img
            src={
              theme.palette.mode === 'dark'
                ? `${limitedsChipPath}/limited_sparkle.svg`
                : `${limitedsChipPath}/limited_sparkle_black.svg`
            }
            alt={translate('Label.Limited')}
            className={itemCardChipSparkle}
          />
          <img
            src={
              theme.palette.mode === 'dark'
                ? `${limitedsChipPath}/limited_hash.svg`
                : `${limitedsChipPath}/limited_hash_black.svg`
            }
            alt={translate('Label.Limited')}
            className={itemCardChipHash}
          />
        </Grid>
      }
      color='primary'
      size='small'
      className={itemCardChip}
    />
  );
};

export default ItemCardLimitedChip;
