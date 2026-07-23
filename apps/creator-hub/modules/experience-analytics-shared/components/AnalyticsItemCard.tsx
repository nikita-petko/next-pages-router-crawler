import type { ReactNode } from 'react';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Card, Typography, Grid, Link, Avatar, CardActionArea } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import GenericCardContentWrapper from '@modules/charts-generic/cards/GenericCardContentWrapper';
import type { GenericChartState } from '@modules/charts-generic/charts/types/ChartTypes';
import type { Item } from '@modules/miscellaneous/common';
import { itemTypeToThumbnailType } from '@modules/miscellaneous/common';
import type { TCardStyleConfig } from '../constants/cardConstants';
import useAnalyticsItemCardStyles from './AnalyticsItemCard.styles';

export type ItemCardSpec = {
  itemId: number;
  href?: string;
  itemType: Item;
  label: FormattedText;
  itemName: FormattedText;
  styleConfig: TCardStyleConfig;
  value: ReactNode;
  showNoDataMessage?: boolean;
  iconImageAssetId?: number;
} & GenericChartState;

const AnalyticsItemCard = ({
  itemId,
  iconImageAssetId,
  href,
  itemType,
  label,
  itemName,
  styleConfig,
  value,
  isDataLoading,
  isResponseFailed,
  isUserForbidden,
  showNoDataMessage,
}: ItemCardSpec) => {
  const {
    classes: {
      link,
      card,
      cardActionArea,
      cardContent,
      cardContentFullHeightContainer,
      itemAvatarContainer,
      cardTitle,
    },
  } = useAnalyticsItemCardStyles(styleConfig);

  return (
    <Link className={link} href={href}>
      <Card className={card}>
        <CardActionArea disableRipple className={cardActionArea}>
          <GenericCardContentWrapper
            cardContentClass={cardContent}
            isDataLoading={isDataLoading}
            isResponseFailed={isResponseFailed}
            isUserForbidden={isUserForbidden}
            showNoDataMessage={showNoDataMessage}
            styleConfig={styleConfig}>
            <Grid
              container
              spacing={2}
              className={cardContentFullHeightContainer}
              direction={styleConfig.contentDirection}
              alignItems='center'
              wrap='nowrap'>
              <Grid item>
                <Avatar variant='rounded' alt='avatar' className={itemAvatarContainer}>
                  <Thumbnail2d
                    targetId={iconImageAssetId ?? itemId}
                    type={
                      iconImageAssetId
                        ? ThumbnailTypes.assetThumbnail
                        : itemTypeToThumbnailType[itemType]
                    }
                    alt={itemName}
                    returnPolicy={ReturnPolicy.PlaceHolder}
                    includeBackground={false}
                  />
                </Avatar>
              </Grid>
              <Grid item XSmall zeroMinWidth>
                <Grid
                  container
                  direction='column'
                  justifyContent='space-between'
                  className={cardContentFullHeightContainer}>
                  <Grid item XSmall zeroMinWidth>
                    <Grid container direction='column'>
                      <Grid item>
                        <Typography variant='body2' color='secondary'>
                          {label}
                        </Typography>
                      </Grid>
                      <Grid item XSmall zeroMinWidth>
                        <Typography
                          variant={styleConfig.titleTypographyVariant}
                          color='primary'
                          noWrap
                          className={cardTitle}>
                          {itemName}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid item>{value}</Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </GenericCardContentWrapper>
        </CardActionArea>
      </Card>
    </Link>
  );
};

export default AnalyticsItemCard;
