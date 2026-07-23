import React, { FunctionComponent } from 'react';
import { useTheme } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useItemCardStyles from './ItemCard.styles';

const wearTimeChipPath = `${process.env.assetPathPrefix}/unifiedFeeSystem`;

export interface ItemCardWearTimeChipProps {
  isLoading: boolean;
  isRentalOptIn: boolean;
}

const ItemCardWearTimeChip: FunctionComponent<
  React.PropsWithChildren<ItemCardWearTimeChipProps>
> = ({ isLoading, isRentalOptIn }) => {
  const {
    classes: { itemCardChipWearTime, itemCardChipWearTimeImg },
  } = useItemCardStyles();
  const theme = useTheme();
  const { translate } = useTranslation();

  if (isLoading || !isRentalOptIn) {
    return null;
  }

  return (
    <div className={itemCardChipWearTime}>
      <img
        src={
          theme.palette.mode === 'dark'
            ? `${wearTimeChipPath}/weartime.svg`
            : `${wearTimeChipPath}/weartime_black.svg`
        }
        alt={translate('Label.WearTime')}
        className={itemCardChipWearTimeImg}
      />
    </div>
  );
};

export default ItemCardWearTimeChip;
