import type { ReactElement } from 'react';
import React from 'react';
import type { IPFamily } from '@rbx/client-rights/v1';
import { IPFamilyStatusEnum } from '@rbx/client-rights/v1';
import { useTranslation } from '@rbx/intl';
import { CheckCircleOutlineIcon, AccessTimeIcon, InfoOutlinedIcon, Label } from '@rbx/ui';
import type { TLabelProps } from '@rbx/ui';

type TLabelSeverity = NonNullable<TLabelProps['severity']>;

const ipFamilyStatusToIcon: { [key in IPFamilyStatusEnum]: ReactElement<{ className?: string }> } =
  {
    [IPFamilyStatusEnum.Approved]: <CheckCircleOutlineIcon color='inherit' fontSize='inherit' />,
    [IPFamilyStatusEnum.Pending]: <AccessTimeIcon color='inherit' fontSize='inherit' />,
    [IPFamilyStatusEnum.Rejected]: <InfoOutlinedIcon color='inherit' fontSize='inherit' />,
  };

const ipFamilyStatusToSeverity: { [key in IPFamilyStatusEnum]: TLabelSeverity } = {
  [IPFamilyStatusEnum.Approved]: 'success',
  [IPFamilyStatusEnum.Pending]: 'warning',
  [IPFamilyStatusEnum.Rejected]: 'error',
};

const ipFamilyStatusToText: { [key in IPFamilyStatusEnum]: string } = {
  [IPFamilyStatusEnum.Approved]: 'Label.Approved',
  [IPFamilyStatusEnum.Pending]: 'Label.PendingReview',
  [IPFamilyStatusEnum.Rejected]: 'Label.Rejected',
};

interface Props {
  ipFamily: IPFamily;
}

/**
 * Displays the moderation status of content within an IP family.
 * If there are rejected contents, it shows the count of rejected contents.
 * If there are pending contents, it shows the count of pending contents.
 * Otherwise, it shows the approved status.
 * If we have enabled IP Onboarding then it displays the status of approval for IP Family.
 */
const IpFamilyStatusChip: React.FC<Props> = ({ ipFamily }) => {
  const { translate } = useTranslation();

  if (!ipFamily.status) {
    return null;
  }

  return (
    <Label
      labelText={translate(ipFamilyStatusToText[ipFamily.status])}
      severity={ipFamilyStatusToSeverity[ipFamily.status]}
      icon={ipFamilyStatusToIcon[ipFamily.status]}
    />
  );
};

export default IpFamilyStatusChip;
