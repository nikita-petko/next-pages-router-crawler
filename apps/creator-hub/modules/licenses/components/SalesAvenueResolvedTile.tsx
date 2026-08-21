import type { FunctionComponent } from 'react';
import { Thumbnail2d } from '@rbx/thumbnails';
import {
  getSalesAvenueThumbnailSize,
  getSalesAvenueThumbnailTarget,
  type SalesAvenueSelection,
} from '../utils/salesAvenue';
import SalesAvenueResolvedEntry from './SalesAvenueResolvedEntry';
import useSalesAvenueResolvedTileStyles from './SalesAvenueResolvedTile.styles';

interface SalesAvenueResolvedTileProps {
  entry: SalesAvenueSelection;
}

/** Read-only horizontal sales-avenue row for the submit-application review step. */
const SalesAvenueResolvedTile: FunctionComponent<SalesAvenueResolvedTileProps> = ({ entry }) => {
  const { classes } = useSalesAvenueResolvedTileStyles();
  const thumbnail = getSalesAvenueThumbnailTarget(entry);
  const thumbnailSize = getSalesAvenueThumbnailSize(entry);

  return (
    <div className={classes.tileRoot} data-testid='sales-avenue-resolved-tile'>
      <div className={classes.thumbnailContainer}>
        <Thumbnail2d
          key={`${thumbnail.type}-${thumbnail.targetId}`}
          alt={entry.name}
          targetId={thumbnail.targetId}
          size={thumbnailSize}
          skeletonVariant='square'
          containerClass={classes.thumbnailContainer}
          type={thumbnail.type}
        />
      </div>
      <SalesAvenueResolvedEntry entry={entry} />
    </div>
  );
};

export default SalesAvenueResolvedTile;
