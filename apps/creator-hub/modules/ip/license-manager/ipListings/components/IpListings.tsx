import { Fragment } from 'react';
import { useTranslation } from '@rbx/intl';
import { EmptyState, EmptyStateBorder } from '@modules/miscellaneous/common/components';
import { Button, Grid, CircularProgress } from '@rbx/ui';
import Link from 'next/link';

import IpListingDisplayItem from './IpListingDisplayItem';
import { IP_LISTING_CREATE_HREF } from '../../urls';
import { useIpListingsQuery } from '../hooks/ipListings';
import { useIpFamiliesQuery } from '../../../ipFamilies/hooks/ipFamily';
import IpLoadError from '../../../components/error/IpLoadError';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
  useLicenseManagerLoggerLogOnce,
} from '../../utils/logger';
import { IP_FAMILY_CREATE_HREF } from '../../../ipFamilies/urls';

enum State {
  HasListings,
  NoIpListings,
  /** IP family is a pre-requisite for ip listings */
  NoIpFamilies,
}

const getState = ({
  hasIpListings,
  hasIpFamilies,
}: {
  hasIpListings: boolean;
  hasIpFamilies: boolean;
}) => {
  if (hasIpListings) {
    return State.HasListings;
  }
  if (!hasIpFamilies) {
    return State.NoIpFamilies;
  }
  return State.NoIpListings;
};

/**
 * List all the IP Listings available to the user
 */
const IpListings = () => {
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();
  const { logOnce } = useLicenseManagerLoggerLogOnce();

  const ipListingsReq = useIpListingsQuery();
  const ipFamiliesReq = useIpFamiliesQuery();

  if (ipListingsReq.isPending || ipFamiliesReq.isPending) {
    return <CircularProgress />;
  }

  if (ipListingsReq.error || ipFamiliesReq.error) {
    return <IpLoadError error={ipListingsReq.error || ipFamiliesReq.error} />;
  }

  const ipListings = ipListingsReq.data.listings ?? [];
  const hasIpFamilies = ipFamiliesReq.data.ipFamilies.length > 0;
  const hasIpListings = ipListings.length > 0;
  const state = getState({ hasIpListings, hasIpFamilies });

  if (state === State.NoIpListings) {
    logOnce(LicenseManagerImpressionEvent.EmptyStateIphListingsGridCreateListingImpressionEvent);
  } else if (state === State.NoIpFamilies) {
    logOnce(LicenseManagerImpressionEvent.EmptyStateIphListingsGridCreateIpFamilyImpressionEvent);
  }

  return (
    <Fragment>
      {state === State.NoIpListings && (
        <EmptyStateBorder>
          <EmptyState
            size='small'
            title={translate('Heading.NoListingsMade')}
            description={translate('Description.NoListingsMade')}>
            <Button
              component={Link}
              href={IP_LISTING_CREATE_HREF}
              color='primaryBrand'
              variant='contained'>
              {translate('Action.CreateLicenseListing')}
            </Button>
          </EmptyState>
        </EmptyStateBorder>
      )}
      {state === State.NoIpFamilies && (
        <EmptyStateBorder>
          <EmptyState
            title={translate('Heading.NoLicenseListings')}
            size='small'
            description={translate('Description.NoLicenseListingsNoIpFamilies')}>
            <Button
              component={Link}
              href={IP_FAMILY_CREATE_HREF}
              color='primaryBrand'
              variant='contained'>
              {translate('Action.CreateIpFamily')}
            </Button>
          </EmptyState>
        </EmptyStateBorder>
      )}
      {state === State.HasListings && (
        <Fragment>
          <Button
            component={Link}
            href={IP_LISTING_CREATE_HREF}
            color='primaryBrand'
            variant='contained'
            sx={{ mb: 3 }}
            onClick={() =>
              logEvent(LicenseManagerClickEvent.IphListingsGridCreateListingClickEvent)
            }>
            {translate('Action.CreateLicenseListing')}
          </Button>
          <Grid container spacing={2}>
            {ipListings.map((listing) => (
              <Grid item key={listing.id}>
                <IpListingDisplayItem listing={listing} />
              </Grid>
            ))}
          </Grid>
        </Fragment>
      )}
    </Fragment>
  );
};

export default IpListings;
