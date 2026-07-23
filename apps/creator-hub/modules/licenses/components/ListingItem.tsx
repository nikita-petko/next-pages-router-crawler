import { FunctionComponent } from 'react';
import { Grid, Typography } from '@rbx/ui';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes, AssetThumbnailSize } from '@rbx/thumbnails';
import Link from 'next/link';
import {
  LicenseManagerClickEvent,
  useLicenseManagerLogger,
} from '@modules/ip/license-manager/utils/logger';
import { ListingResponse } from '@rbx/clients/contentLicensingApi/v1';
import { EXPLORE_LISTING_DETAILS } from '../urls';
import useListingItemStyles from './ListingItem.styles';

interface ListingItemBaseProps {
  listing: ListingResponse;
  thumbnailAssetId?: number;
  thumbnailUrl?: string;
}

/**
 * This component serves as the base to
 * 1. display an IP Listing in a grid for creators
 * 2. display an IP Listing in the Create License Listing wizard
 *
 * For option #2 we'll support a non-asset primary thumbnail image (e.g. not an asset yet).
 */
export const ListingItemBase: FunctionComponent<ListingItemBaseProps> = ({
  listing,
  thumbnailAssetId,
  thumbnailUrl,
}) => {
  const {
    classes: { thumbnailContainer, thumbnail, plainImageThumbnail, thumbnailImage },
  } = useListingItemStyles();

  return (
    <Grid container paddingBottom={1}>
      <Grid item className={thumbnailContainer}>
        {thumbnailAssetId ? (
          <Thumbnail2d
            targetId={thumbnailAssetId}
            type={ThumbnailTypes.assetThumbnail}
            alt={listing.name!}
            returnPolicy={ReturnPolicy.PlaceHolder}
            includeBackground={false}
            // eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
            size={AssetThumbnailSize._768x432}
            containerClass={thumbnail}
            imgClassName={thumbnailImage}
          />
        ) : (
          <img src={thumbnailUrl} alt={listing.name!} className={plainImageThumbnail} />
        )}
      </Grid>
      <Grid item zeroMinWidth paddingTop={1.5}>
        <Typography
          display='block'
          variant='h6'
          color='primary'
          noWrap
          data-testid='explore-licenses-listing-name'>
          {listing.name}
        </Typography>
      </Grid>
    </Grid>
  );
};

interface ListingItemProps {
  listing: ListingResponse;
}

/** One tile representing an IP Listing that is displayed within a ListingGrid */
const ListingItem: FunctionComponent<ListingItemProps> = ({ listing }) => {
  const { logEvent } = useLicenseManagerLogger();

  return (
    <Link
      href={EXPLORE_LISTING_DETAILS(listing.id!)}
      style={{ textDecoration: 'none' }}
      data-testid={`explore-licenses-listing-item-${listing.id!}`}
      onClick={() =>
        logEvent(LicenseManagerClickEvent.ViewListingDetailsClickEvent, { listingId: listing.id! })
      }>
      <ListingItemBase listing={listing} thumbnailAssetId={listing.thumbnailAssetIds![0]} />
    </Link>
  );
};

export default ListingItem;
