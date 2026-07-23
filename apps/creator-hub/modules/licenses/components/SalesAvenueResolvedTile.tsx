import type { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { Thumbnail2d, AssetThumbnailSize } from '@rbx/thumbnails';
import { RobuxIcon, Typography } from '@rbx/ui';
import {
  getSalesAvenueThumbnailTarget,
  type SalesAvenueProductType,
  type SalesAvenueSelection,
} from '../utils/salesAvenue';
import useSalesAvenueResolvedTileStyles from './SalesAvenueResolvedTile.styles';

// eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
const ASSET_THUMBNAIL_SIZE = AssetThumbnailSize._50x50;

interface SalesAvenueResolvedTileProps {
  entry: SalesAvenueSelection;
  productType: SalesAvenueProductType;
}

/** Read-only sales-avenue summary tile for the submit-application review step. */
const SalesAvenueResolvedTile: FunctionComponent<SalesAvenueResolvedTileProps> = ({
  entry,
  productType,
}) => {
  const { translate } = useTranslation();
  const { classes } = useSalesAvenueResolvedTileStyles();

  const productTypeLabel =
    productType === 'GamePass' ? translate('Label.GamePass') : translate('Label.DeveloperProduct');
  const idLabel = translate('Label.IdWithInput', { assetId: String(entry.id) });
  const thumbnail = getSalesAvenueThumbnailTarget(entry);

  return (
    <div className={classes.tileRoot} data-testid='sales-avenue-resolved-tile'>
      <div className={classes.thumbnailContainer}>
        <Thumbnail2d
          key={`${thumbnail.type}-${thumbnail.targetId}`}
          alt={entry.name}
          targetId={thumbnail.targetId}
          size={ASSET_THUMBNAIL_SIZE}
          skeletonVariant='square'
          containerClass={classes.thumbnailContainer}
          type={thumbnail.type}
        />
      </div>
      <div className='flex min-width-0 grow flex-col justify-center gap-y-xxsmall clip'>
        <Typography variant='body2' noWrap className='margin-y-none'>
          {entry.name}
        </Typography>
        <Typography
          variant='caption'
          component='div'
          noWrap
          className='margin-y-none flex items-center gap-x-xsmall content-muted'>
          <span>{productTypeLabel}</span>
          <span aria-hidden='true'>·</span>
          <span className='inline-flex items-center gap-x-xsmall'>
            <RobuxIcon fontSize='small' className='shrink-0' />
            <span>{entry.priceInRobux.toLocaleString()}</span>
          </span>
          <span aria-hidden='true'>·</span>
          <span>{idLabel}</span>
        </Typography>
      </div>
    </div>
  );
};

export default SalesAvenueResolvedTile;
