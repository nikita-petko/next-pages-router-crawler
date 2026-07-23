import React, { useCallback } from 'react';
import { Grid, Link, Avatar, TableCell, TableRow, LimitedIcon } from '@rbx/ui';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { useRouter } from 'next/router';
import {
  ChartUnit,
  ChartUnitAggregationType,
  ComparisonChipSpec,
  MetricValue,
  NumberContext,
  formatNumber,
  formatSingleDate,
  useLocale,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { AvatarItemDetail, AvatarItemType } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  AvatarItemTargetType,
  AvatarItemTypeToTargetType,
} from '@modules/clients/analytics/avatarItemTypes';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';
import useAvatarItemsTableRowStyles from './AvatarItemsTableRow.styles';
import { FormatAvatarItemTypeRaw } from './AvatarItemTypeTranslationKeys';
import GetMarketplaceUrl from './GetMarketplaceUrl';

const AvatarItemTargetTypeToThumbnailType: Record<AvatarItemTargetType, ThumbnailTypes> = {
  [AvatarItemTargetType.AssetItem]: ThumbnailTypes.assetThumbnail,
  [AvatarItemTargetType.Bundle]: ThumbnailTypes.bundleThumbnail,
};

export type AvatarItemsTableRowSpec = {
  avatarItemDetail: AvatarItemDetail;
  salesComparisonChipSpec?: ComparisonChipSpec;
  revenueComparisonChipSpec?: ComparisonChipSpec;
};

const AvatarItemsTableRow = ({
  avatarItemDetail,
  salesComparisonChipSpec,
  revenueComparisonChipSpec,
}: AvatarItemsTableRowSpec) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const locale = useLocale();
  const router = useRouter();
  const {
    classes: { avatarContainer, itemText, limitedIcon, thumbnailBackground, rowHoverBackground },
  } = useAvatarItemsTableRowStyles();

  const targetType = avatarItemDetail.targetType
    ? AvatarItemTypeToTargetType[avatarItemDetail.targetType]
    : AvatarItemTargetType.AssetItem;
  const thumbnailType = AvatarItemTargetTypeToThumbnailType[targetType];

  const handleRowClick = useCallback(() => {
    if (avatarItemDetail.targetId) {
      const itemType =
        avatarItemDetail.targetType === AvatarItemType.Heads ||
        avatarItemDetail.targetType === AvatarItemType.Bodies
          ? 'bundle'
          : 'catalog';
      router.push(
        `/dashboard/creations/${itemType}/${avatarItemDetail.targetId}/analytics?rangeType=Last7Days`,
      );
    }
  }, [avatarItemDetail.targetId, avatarItemDetail.targetType, router]);

  const handleNameClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <TableRow className={rowHoverBackground} onClick={handleRowClick} hover>
      <TableCell>
        <Grid container direction='row' alignItems='center' wrap='nowrap'>
          <Grid item>
            <Avatar variant='rounded' alt='avatar' className={avatarContainer}>
              <Thumbnail2d
                targetId={avatarItemDetail.targetId ?? 0}
                type={thumbnailType}
                imgClassName={thumbnailBackground}
                alt=''
                returnPolicy={ReturnPolicy.PlaceHolder}
                includeBackground={false}
              />
            </Avatar>
          </Grid>
          <Grid item>
            <Grid container direction='column'>
              <Grid item>
                <Link
                  href={GetMarketplaceUrl(targetType, avatarItemDetail.targetId ?? 0)}
                  className={itemText}
                  onClick={handleNameClick}>
                  {avatarItemDetail.name}
                </Link>
              </Grid>
              {avatarItemDetail.totalQuantity && (
                <Grid item>
                  <Grid container alignItems='center'>
                    <LimitedIcon fontSize='small' color='inherit' className={limitedIcon} />
                    {translate(
                      translationKey(
                        'Label.LimitedQuantityLeft',
                        TranslationNamespace.AvatarAnalytics,
                      ),
                      {
                        // eslint-disable-next-line deprecation/deprecation -- pre-existing usage
                        quantityRemaining: formatNumber({
                          value: Number(avatarItemDetail.quantityLeft ?? 0),
                          unit: ChartUnit.Items,
                          type: ChartUnitAggregationType.Sum,
                          context: NumberContext.DataPoint,
                          locale,
                          translate,
                        }),
                        // eslint-disable-next-line deprecation/deprecation -- pre-existing usage
                        totalQuantity: formatNumber({
                          value: Number(avatarItemDetail.totalQuantity),
                          unit: ChartUnit.Items,
                          type: ChartUnitAggregationType.Sum,
                          context: NumberContext.DataPoint,
                          locale,
                          translate,
                        }),
                      },
                    )}
                  </Grid>
                </Grid>
              )}
              {!avatarItemDetail.totalQuantity && !avatarItemDetail.isOnSale && (
                <Grid item>
                  {translate(translationKey('Label.Offsale', TranslationNamespace.Creations))}
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </TableCell>
      <TableCell>
        {translate(
          avatarItemDetail.targetType
            ? FormatAvatarItemTypeRaw(avatarItemDetail.targetType)
            : FormatAvatarItemTypeRaw(),
        )}
      </TableCell>
      <TableCell align='right'>
        {avatarItemDetail.createdTime &&
          formatSingleDate(locale, avatarItemDetail.createdTime, 'Local')}
      </TableCell>
      <TableCell align='right'>
        <MetricValue
          value={avatarItemDetail.salesCount ?? 0}
          formattingSpec={{
            unit: ChartUnit.Sales,
            type: ChartUnitAggregationType.Sum,
            context: NumberContext.DataPoint,
          }}
          comparisonChipSpec={salesComparisonChipSpec}
          justifyContent='flex-end'
        />
      </TableCell>
      <TableCell align='right'>
        <MetricValue
          value={avatarItemDetail.revenue ?? 0}
          formattingSpec={{
            unit: ChartUnit.Robux,
            type: ChartUnitAggregationType.Sum,
            context: NumberContext.DataPoint,
          }}
          comparisonChipSpec={revenueComparisonChipSpec}
          justifyContent='flex-end'
        />
      </TableCell>
    </TableRow>
  );
};

export default AvatarItemsTableRow;
