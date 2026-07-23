import React from 'react';
import { makeStyles } from '@rbx/ui';
import Link from 'next/link';
import { ListingItemBase } from '@modules/licenses/components/ListingItem';
import { ListingResponse } from '@rbx/clients/contentLicensingApi/v1';

import { IP_LISTING_DETAILS_HREF } from '../../urls';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../../utils/logger';

const useStyles = makeStyles()(() => ({
  card: {
    // TODO: [future] can/should we migrate this up to ListingItemBase?
    width: 322,
  },
}));

interface Props {
  listing: ListingResponse;
}

/**
 * Displays a IP listing item.
 */
const IpListingDisplayItem: React.FC<Props> = ({ listing }) => {
  const { classes } = useStyles();
  const { logEvent } = useLicenseManagerLogger();

  const primaryThumbnail = listing.thumbnailAssetIds?.[0];

  return (
    <Link
      href={IP_LISTING_DETAILS_HREF(listing.id || '')}
      style={{ textDecoration: 'none' }}
      onClick={() =>
        logEvent(LicenseManagerClickEvent.IphListingsGridViewListingClickEvent, {
          listingId: listing.id ?? '',
        })
      }>
      <div className={classes.card}>
        <ListingItemBase listing={listing} thumbnailAssetId={primaryThumbnail} />
      </div>
    </Link>
  );
};

export default IpListingDisplayItem;
