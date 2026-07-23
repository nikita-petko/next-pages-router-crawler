import React from 'react';
import { LicenseModerationStatus, LicenseVisibility } from '@rbx/client-content-licensing-api/v1';
import { useTranslation } from '@rbx/intl';
import { AccessTimeIcon, ErrorOutlineOutlinedIcon, Tooltip } from '@rbx/ui';
import StatusLabel from '../../../components/StatusLabel';

export type LicenseDisplayStatus =
  | 'Public'
  | 'Private'
  | 'PublicPendingReview'
  | 'PrivatePendingReview'
  | 'Rejected';

export const getLicenseDisplayStatus = (
  visibility: LicenseVisibility | undefined,
  moderationStatus?: LicenseModerationStatus | null,
  hasPendingEdits?: boolean,
): LicenseDisplayStatus => {
  if (moderationStatus === LicenseModerationStatus.Rejected) {
    return 'Rejected';
  }

  const isPublic = visibility === LicenseVisibility.Public;
  const hasPendingChanges = hasPendingEdits || moderationStatus === LicenseModerationStatus.Pending;

  if (hasPendingChanges) {
    return isPublic ? 'PublicPendingReview' : 'PrivatePendingReview';
  }

  return isPublic ? 'Public' : 'Private';
};

export interface LicenseStatusValueProps {
  visibility: LicenseVisibility | undefined;
  moderationStatus?: LicenseModerationStatus | null;
  hasPendingEdits?: boolean;
}

/**
 * Display the combined license status (visibility + moderation status)
 */
const LicenseStatusValue: React.FC<LicenseStatusValueProps> = ({
  visibility,
  moderationStatus,
  hasPendingEdits,
}) => {
  const { translate } = useTranslation();

  const displayStatus = getLicenseDisplayStatus(visibility, moderationStatus, hasPendingEdits);

  switch (displayStatus) {
    case 'Rejected':
      return (
        <StatusLabel
          icon={<ErrorOutlineOutlinedIcon color='error' fontSize='inherit' />}
          text={translate('Label.Rejected')}
          variant='error'
        />
      );

    case 'PublicPendingReview':
      return (
        <Tooltip title={translate('Description.PendingReview')} arrow>
          <span>
            <StatusLabel
              icon={<AccessTimeIcon color='warning' fontSize='inherit' />}
              text={translate('Label.PublicPendingReview')}
              variant='default'
            />
          </span>
        </Tooltip>
      );

    case 'PrivatePendingReview':
      return (
        <Tooltip title={translate('Description.PendingReview')} arrow>
          <span>
            <StatusLabel
              icon={<AccessTimeIcon color='warning' fontSize='inherit' />}
              text={translate('Label.PrivatePendingReview')}
              variant='default'
            />
          </span>
        </Tooltip>
      );

    case 'Public':
      return <StatusLabel icon={undefined} text={translate('Label.Public')} variant='success' />;

    case 'Private':
    default:
      return <StatusLabel icon={undefined} text={translate('Label.Private')} variant='default' />;
  }
};

export default LicenseStatusValue;
