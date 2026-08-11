import { useCallback, useEffect, useRef, type FunctionComponent } from 'react';
import Link from 'next/link';
import type { ListingResponse } from '@rbx/client-content-licensing-api/v1';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes, AssetThumbnailSize } from '@rbx/thumbnails';
import { Grid, Typography } from '@rbx/ui';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
} from '@modules/ip/license-manager/utils/logger';
import { EXPLORE_LISTING_DETAILS } from '../urls';
import { getFirstListingThumbnailAssetId } from '../utils/listingThumbnails';
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
  const listingName = listing.name ?? '';

  return (
    <Grid container paddingBottom={1}>
      <Grid item className={thumbnailContainer}>
        {thumbnailAssetId ? (
          <Thumbnail2d
            targetId={thumbnailAssetId}
            type={ThumbnailTypes.assetThumbnail}
            alt={listingName}
            returnPolicy={ReturnPolicy.PlaceHolder}
            includeBackground={false}
            // eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
            size={AssetThumbnailSize._768x432}
            containerClass={thumbnail}
            imgClassName={thumbnailImage}
          />
        ) : (
          <img src={thumbnailUrl} alt={listingName} className={plainImageThumbnail} />
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
  tilePosition?: number;
  pageNumber?: number;
  filterTab?: string;
}

/** One tile representing an IP Listing that is displayed within a ListingGrid */
const ListingItem: FunctionComponent<ListingItemProps> = ({
  listing,
  tilePosition = 1,
  pageNumber = 1,
  filterTab = 'all',
}) => {
  const { logEvent } = useLicenseManagerLogger();
  const {
    classes: { listingLink },
  } = useListingItemStyles();
  const thumbnailAssetId = getFirstListingThumbnailAssetId(listing.thumbnailAssetIds);
  const listingId = listing.id ?? '';
  const itemRef = useRef<HTMLAnchorElement>(null);
  const hasLoggedImpressionRef = useRef(false);

  const logCatalogImpression = useCallback(() => {
    if (hasLoggedImpressionRef.current) {
      return;
    }

    hasLoggedImpressionRef.current = true;
    logEvent(LicenseManagerImpressionEvent.CatalogImpressionEvent, {
      requestId: '',
      universeId: '',
      viewMode: 'grid',
      listingId,
      tilePosition,
      pageNumber,
      filterTab,
    });
  }, [filterTab, listingId, logEvent, pageNumber, tilePosition]);

  useEffect(() => {
    const item = itemRef.current;
    if (!item || typeof IntersectionObserver === 'undefined') {
      logCatalogImpression();
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        logCatalogImpression();
        observer.disconnect();
      }
    });

    observer.observe(item);

    return () => {
      observer.disconnect();
    };
  }, [logCatalogImpression]);

  const handleClickListing = useCallback(() => {
    logEvent(LicenseManagerClickEvent.ViewListingDetailsClickEvent, {
      listingId,
      viewMode: 'grid',
      tilePosition,
      pageNumber,
      filterTab,
    });
  }, [filterTab, listingId, logEvent, pageNumber, tilePosition]);

  return (
    <Link
      ref={itemRef}
      href={EXPLORE_LISTING_DETAILS(listingId)}
      className={listingLink}
      data-testid={`explore-licenses-listing-item-${listingId}`}
      onClick={handleClickListing}>
      <ListingItemBase listing={listing} thumbnailAssetId={thumbnailAssetId} />
    </Link>
  );
};

export default ListingItem;
