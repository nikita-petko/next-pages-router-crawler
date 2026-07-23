import type { FunctionComponent } from 'react';
import React from 'react';
import { withTranslation, useTranslation } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import {
  Divider,
  Typography,
  makeStyles,
  CardActionArea,
  RobuxIcon,
  UIThemeProvider,
  Chip,
  LimitedIcon,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { NumberContext, formatNumber } from '@modules/charts-generic/charts/numberFormatters';
import {
  ChartUnit,
  ChartUnitAggregationType,
} from '@modules/charts-generic/charts/types/ChartTypes';
import useLocale from '@modules/charts-generic/context/useLocale';
import { getComparisonChipSpec } from '@modules/charts-generic/utils/comparisonChipUtils';
import type { AvatarItemDetail } from '@modules/clients/analytics';
import { AvatarItemTargetType, AvatarItemTypeToTargetType } from '@modules/clients/analytics';
import AnalyticsMetricsOverview from '@modules/experience-analytics-shared/components/AnalyticsMetricsOverview/AnalyticsMetricsOverview';
import { ExperienceTileStyles } from '@modules/experience-analytics-shared/constants/tileConstants';
import { Flex } from '@modules/miscellaneous/components';
import { useConversionTracker } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { AvatarItemWithAnalyticsTileSize } from '../../constants/tileConstants';
import { useCreator } from '../../providers/CreatorProvider';
import { captureHomepageEvent, EHomepageSection } from '../../utils/eventUtils';
import Card from '../common/Card';
import CardContent from '../common/CardContent';
import AvatarItemWithAnalyticsHoverMenu from './AvatarItemWithAnalyticsHoverMenu';
import getAvatarItemConfigureUrl from './getAvatarItemConfigureUrl';

const useStyles = makeStyles()((theme) => ({
  card: {
    width: AvatarItemWithAnalyticsTileSize.small.width,
    height: AvatarItemWithAnalyticsTileSize.small.height,
  },
  thumbnail: {
    position: 'relative',
  },
  thumbnailContainer: {
    display: 'block',
    height: 'auto',
    position: 'relative',
    paddingTop: '56%',
  },
  thumbnailImage: {
    padding: 12,
    backgroundColor: theme.palette.components.media.fill,
    objectFit: 'contain',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  textEllipsis: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  divider: {
    margin: '12px 0',
  },
  text: {
    marginBottom: 12,
    '&:last-child': {
      marginBottom: 0,
    },
  },
  robuxIcon: {
    color: theme.palette.content.muted,
    marginRight: 3,
  },
  textDivider: {
    margin: '0 6px',
  },
  limitedChip: {
    position: 'absolute',
    bottom: '12px',
    left: '12px',
    '& .MuiChip-label': {
      paddingLeft: '6px',
      paddingRight: '6px',
    },
  },
  limitedIcon: {
    marginRight: '4px',
  },
}));

export type TAvatarItemCardData = {
  id: string;
  item: AvatarItemDetail;
  comparisonItem: AvatarItemDetail | null;
  datePeriodLength: number;
};

export type TAvatarItemWithAnalyticsDataTileProps = {
  data: TAvatarItemCardData;
};

const AvatarItemTargetTypeToThumbnailType: Record<AvatarItemTargetType, ThumbnailTypes> = {
  [AvatarItemTargetType.AssetItem]: ThumbnailTypes.assetThumbnail,
  [AvatarItemTargetType.Bundle]: ThumbnailTypes.bundleThumbnail,
};

const AvatarItemWithAnalyticsDataTile: FunctionComponent<
  React.PropsWithChildren<TAvatarItemWithAnalyticsDataTileProps>
> = ({ data: { item, comparisonItem, datePeriodLength } }) => {
  const { translate } = useTranslation();
  const { translate: translateFn } = useTranslationWrapper(useTranslation());
  const locale = useLocale();
  const { permissions } = useCreator();
  const { ref: cardRef } = useConversionTracker<HTMLDivElement>('homeAvatarItemTile');
  const {
    classes: {
      card,
      thumbnail,
      thumbnailImage,
      thumbnailContainer,
      cardContent,
      textEllipsis,
      divider,
      robuxIcon,
      textDivider,
      limitedChip,
      limitedIcon,
    },
  } = useStyles();

  const targetType =
    (item.targetType && AvatarItemTypeToTargetType[item.targetType]) ??
    AvatarItemTargetType.AssetItem;
  const thumbnailType = AvatarItemTargetTypeToThumbnailType[targetType];

  const price = item.price ? (
    <>
      <RobuxIcon classes={{ root: robuxIcon }} fontSize='small' />
      <Typography color='secondary' classes={{ root: textEllipsis }} variant='footer'>
        {/* eslint-disable-next-line deprecation/deprecation, @typescript-eslint/no-deprecated -- migration in progress. Will be removed in DSA-4660. */}
        {formatNumber({
          value: item.price,
          unit: ChartUnit.Robux,
          type: ChartUnitAggregationType.Unknown,
          context: NumberContext.CardSummary,
          locale,
          translate: translateFn,
        })}
      </Typography>
    </>
  ) : (
    <Typography color='secondary' classes={{ root: textEllipsis }} variant='footer'>
      {translate('Label.Free')}
    </Typography>
  );

  return (
    <Card ref={cardRef} classes={{ root: card }}>
      <div className={thumbnail}>
        <Thumbnail2d
          imgClassName={thumbnailImage}
          containerClass={thumbnailContainer}
          targetId={item.targetId ?? 0}
          type={thumbnailType}
          skeletonVariant='square'
          alt={item.name ?? ''}
          returnPolicy={ReturnPolicy.PlaceHolder}
          includeBackground={false}
        />
        {item.totalQuantity && (
          <Chip
            className={limitedChip}
            variant='filled'
            color='secondary'
            label={
              <Flex alignItems='center'>
                <LimitedIcon fontSize='small' className={limitedIcon} />
                <span>&nbsp;#</span>
              </Flex>
            }
          />
        )}
        <UIThemeProvider theme='dark' cssBaselineMode='disabled'>
          <AvatarItemWithAnalyticsHoverMenu item={item} />
        </UIThemeProvider>
      </div>
      <CardActionArea
        disableRipple
        onClick={() =>
          captureHomepageEvent('clickTile', EHomepageSection.AvatarItems, {
            tileId: item.targetId?.toString() ?? '',
            type: targetType,
          })
        }
        href={
          permissions?.canManageAvatarItems
            ? getAvatarItemConfigureUrl(targetType, item.targetId ?? 0)
            : ''
        }>
        <CardContent classes={{ root: cardContent }}>
          <Flex alignItems='flex-start' justifyContent='space-between'>
            <div className={textEllipsis}>
              <Typography variant='h6'>{item.name}</Typography>
              <Flex alignItems='center'>
                {item.isOnSale && (
                  <>
                    {price}
                    <Typography color='secondary' variant='footer' className={textDivider}>
                      •
                    </Typography>
                  </>
                )}
                <Typography
                  variant='footer'
                  color={item.price && item.isOnSale ? 'success' : 'secondary'}>
                  {item.price && item.isOnSale
                    ? translate('Label.Public')
                    : translate('Label.OffSale')}
                </Typography>
              </Flex>
            </div>
          </Flex>
          <Divider classes={{ root: divider }} />
          <AnalyticsMetricsOverview
            metricsHeader={translate('Heading.Overview')}
            valuesHeader={translate('Label.NDaySum', { n: datePeriodLength.toString() })}
            metrics={[
              {
                metricKey: 'sales',
                metricTitle: translate('Label.Sales'),
                value: {
                  value: item.salesCount ?? null,
                  formattingSpec: {
                    unit: ChartUnit.Sales,
                    type: ChartUnitAggregationType.Sum,
                    context: NumberContext.CardSummary,
                  },
                  comparisonChipSpec: getComparisonChipSpec({
                    isPositiveGood: true,
                    current: item.salesCount ?? null,
                    previous: comparisonItem?.salesCount ?? null,
                  }),
                },
              },
              {
                metricKey: 'revenue',
                metricTitle: translate('Label.Revenue'),
                value: {
                  value: item.revenue ?? null,
                  formattingSpec: {
                    unit: ChartUnit.Robux,
                    type: ChartUnitAggregationType.Sum,
                    context: NumberContext.CardSummary,
                  },
                  comparisonChipSpec: getComparisonChipSpec({
                    isPositiveGood: true,
                    current: item.revenue ?? null,
                    previous: comparisonItem?.revenue ?? null,
                  }),
                },
              },
            ]}
            styleConfig={ExperienceTileStyles.small}
          />
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default withTranslation(AvatarItemWithAnalyticsDataTile, [
  TranslationNamespace.Home,
  TranslationNamespace.Analytics,
  TranslationNamespace.AvatarAnalytics,
]);
