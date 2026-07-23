import React, { FunctionComponent } from 'react';
import { LuobuDevexRequestStatusEnum as RequestStatus } from '@modules/clients/billing';
import { getFormattedDate } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';

type ExistingRequestStatus =
  | typeof RequestStatus.Pending
  | typeof RequestStatus.Completed
  | typeof RequestStatus.Rejected;

interface RequestStatusMessageProps {
  status: ExistingRequestStatus;
  date: Date;
}

const RESPONSE_STATUS: Record<ExistingRequestStatus, string> = {
  [RequestStatus.Pending]: 'Message.StatusPending',
  [RequestStatus.Completed]: 'Message.StatusComplete',
  [RequestStatus.Rejected]: 'Message.StatusRejected',
};

const RequestStatusMessage: FunctionComponent<
  React.PropsWithChildren<RequestStatusMessageProps>
> = ({ status, date }) => {
  const { translate } = useTranslation();
  return (
    <Grid container spacing={1} direction='column'>
      <Grid item>
        <Typography variant='h3' color='secondary'>
          {translate('Message.LastRequestDate', { submissionDate: getFormattedDate(date) })}
        </Typography>
      </Grid>
      <Grid item>
        <Typography variant='h3' color='secondary'>
          {translate(RESPONSE_STATUS[status])}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default RequestStatusMessage;
