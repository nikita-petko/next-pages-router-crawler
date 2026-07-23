import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { RobloxItemConfigurationApiAssetCreationsDetailsResponseStatusEnum } from '@rbx/client-itemconfiguration/v1';
import { useTranslation } from '@rbx/intl';
import { RobuxIcon, Grid, Skeleton, Typography, makeStyles } from '@rbx/ui';
import useItemCardStyles from '../../common/components/ItemCard.styles';
import ItemCardCreatorName from '../../common/components/ItemCardCreatorName';
import ItemCardTitle from '../../common/components/ItemCardTitle';
import type CreationData from '../../common/interfaces/CreationData';

export interface LookItemCardDescriptionProps {
  item: CreationData;
  isLoading: boolean;
}

const useItemCardPriceStyles = makeStyles()({
  robuxIcon: {
    paddingRight: 4,
  },
});

/**
 * Item card description for items contained in a look on the look item details page.
 */
const LookItemCardDescription: FunctionComponent<
  React.PropsWithChildren<LookItemCardDescriptionProps>
> = ({ item, isLoading }) => {
  const {
    classes: { itemCardInfoContainer },
  } = useItemCardStyles();
  const {
    classes: { robuxIcon },
  } = useItemCardPriceStyles();

  const { translate } = useTranslation();

  const unavailableReason = useMemo(() => {
    if (
      item.status === RobloxItemConfigurationApiAssetCreationsDetailsResponseStatusEnum.Moderated
    ) {
      return 'Moderated';
    }
    if (item.status === RobloxItemConfigurationApiAssetCreationsDetailsResponseStatusEnum.OffSale) {
      return 'Offsale';
    }
    if (item.isDelisted) {
      return 'Archived';
    }
    if (item.isIEC) {
      return 'IECOnly';
    }

    // This would happen if item.isPurchasable is false and no other status is set from look-api
    if (item.status === RobloxItemConfigurationApiAssetCreationsDetailsResponseStatusEnum.Unknown) {
      return 'Unavailable';
    }
    return '';
  }, [item]);

  return (
    <div className={itemCardInfoContainer}>
      {typeof item.name !== 'undefined' && <ItemCardTitle name={item.name} isLoading={isLoading} />}

      <ItemCardCreatorName creatorName={item.creatorName ?? ''} isLoading={isLoading} />

      {item.price && !unavailableReason && (
        <Grid container alignItems='center'>
          <RobuxIcon fontSize='small' className={robuxIcon} />
          <Typography variant='body2' noWrap>
            {item.price}
          </Typography>
        </Grid>
      )}

      <Typography variant='body2' color='warning' noWrap>
        {isLoading ? <Skeleton /> : translate(`Label.${unavailableReason}`)}
      </Typography>
    </div>
  );
};

export default LookItemCardDescription;
