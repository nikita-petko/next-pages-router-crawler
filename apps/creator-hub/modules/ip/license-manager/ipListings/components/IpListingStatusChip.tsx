import React from 'react';
import { AccessTimeIcon, ErrorOutlineOutlinedIcon, Tooltip } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { ListingStatus } from '@rbx/clients/contentLicensingApi/v1';

import StatusLabel from '../../../components/StatusLabel';

interface Props {
  status: ListingStatus | undefined;
  isPublic?: boolean;
}

/**
 * Chip showing the status of a IP listing
 */
const IpListingStatusChip: React.FC<Props> = ({ status, isPublic }) => {
  const { translate } = useTranslation();

  if (!status) {
    return null;
  }

  if (status === ListingStatus.Rejected) {
    return (
      <StatusLabel
        icon={<ErrorOutlineOutlinedIcon color='error' fontSize='inherit' />}
        text={translate('Label.Rejected')}
        variant='error'
      />
    );
  }

  if (status === ListingStatus.Pending) {
    const pendingText = isPublic
      ? translate('Label.PublicPendingReview')
      : translate('Label.PrivatePendingReview');

    return (
      <Tooltip title={translate('Description.PendingReview')} arrow>
        <span>
          <StatusLabel
            icon={<AccessTimeIcon color='warning' fontSize='inherit' />}
            text={pendingText}
            variant='default'
          />
        </span>
      </Tooltip>
    );
  }

  if (status === ListingStatus.Approved) {
    const approvedText = isPublic ? translate('Label.Public') : translate('Label.Private');
    const approvedTooltipText = isPublic
      ? translate('Description.LicenseListingPublic')
      : translate('Description.LicenseListingPrivate');

    const variant = isPublic ? 'success' : 'default';

    return (
      <Tooltip title={approvedTooltipText} arrow>
        <span>
          <StatusLabel icon={undefined} text={approvedText} variant={variant} />
        </span>
      </Tooltip>
    );
  }

  return <StatusLabel icon={undefined} text={translate('Label.Unknown')} variant='default' />;
};

export default IpListingStatusChip;
