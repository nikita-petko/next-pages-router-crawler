import type { ReactElement } from 'react';
import React from 'react';
import { IPContentStatusEnum } from '@rbx/client-rights/v1';
import { useTranslation } from '@rbx/intl';
import {
  AccessTimeIcon,
  CheckCircleOutlineIcon,
  ErrorOutlineOutlinedIcon,
  InfoOutlinedIcon,
  Label,
} from '@rbx/ui';
import type { TLabelProps } from '@rbx/ui';

type TLabelSeverity = NonNullable<TLabelProps['severity']>;

const statusToIcon: { [key in IPContentStatusEnum]: ReactElement<{ className?: string }> } = {
  [IPContentStatusEnum.Approved]: <CheckCircleOutlineIcon color='success' fontSize='inherit' />,
  [IPContentStatusEnum.Pending]: <AccessTimeIcon color='warning' fontSize='inherit' />,
  [IPContentStatusEnum.Rejected]: <InfoOutlinedIcon color='error' fontSize='inherit' />,
  [IPContentStatusEnum.Blocked]: <AccessTimeIcon color='warning' fontSize='inherit' />,
  [IPContentStatusEnum.Archived]: <ErrorOutlineOutlinedIcon color='secondary' fontSize='inherit' />,
};

const statusToText: { [key in IPContentStatusEnum]: string } = {
  [IPContentStatusEnum.Approved]: 'Label.Approved',
  [IPContentStatusEnum.Pending]: 'Label.Pending',
  [IPContentStatusEnum.Rejected]: 'Label.Rejected',
  [IPContentStatusEnum.Blocked]: 'Label.Pending',
  [IPContentStatusEnum.Archived]: 'Label.Archived',
};

const statusToSeverity: { [key in IPContentStatusEnum]: TLabelSeverity | undefined } = {
  [IPContentStatusEnum.Approved]: 'success',
  [IPContentStatusEnum.Pending]: 'warning',
  [IPContentStatusEnum.Rejected]: 'error',
  [IPContentStatusEnum.Blocked]: 'warning',
  [IPContentStatusEnum.Archived]: undefined,
};

interface Props {
  status: IPContentStatusEnum | undefined;
}

const IpContentStatusChip: React.FC<Props> = ({ status }) => {
  const { translate } = useTranslation();

  if (!status) {
    return null;
  }

  return (
    <Label
      labelText={translate(statusToText[status])}
      severity={statusToSeverity[status]}
      icon={statusToIcon[status]}
    />
  );
};

export default IpContentStatusChip;
