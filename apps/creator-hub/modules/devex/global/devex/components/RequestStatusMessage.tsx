import type { FunctionComponent } from 'react';
import React from 'react';
import { getFormattedDate } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import {
  Grid,
  Typography,
  Link,
  ScheduleIcon,
  HighlightOffIcon,
  CheckCircleOutlineIcon,
  makeStyles,
} from '@rbx/ui';
import { MESSAGES_URL, TRANSACTIONS_URL } from '../../constants/externalLinkConstants';

const useRequestStatusMessageStyles = makeStyles()((theme) => ({
  icon: {
    marginRight: 4,
  },

  successIcon: {
    color: theme.palette.success.main,
  },
}));

interface RequestStatusMessageProps {
  lastImbursementStatus?: string;
  lastImbursementSubmissionDate?: Date;
}

const RequestStatusMessage: FunctionComponent<
  React.PropsWithChildren<RequestStatusMessageProps>
> = ({ lastImbursementStatus, lastImbursementSubmissionDate }) => {
  const {
    classes: { icon, successIcon },
  } = useRequestStatusMessageStyles();
  const { translate, translateHTML } = useTranslation();

  if (!lastImbursementStatus || !lastImbursementSubmissionDate) {
    return null;
  }

  if (lastImbursementStatus === 'Pending') {
    return (
      <Grid item container alignItems='center'>
        <ScheduleIcon fontSize='small' color='secondary' className={icon} />
        <Typography variant='body1' color='secondary'>
          {translate('Message.StatusPendingV2', {
            submissionDate: getFormattedDate(lastImbursementSubmissionDate),
          })}
        </Typography>
      </Grid>
    );
  }

  if (lastImbursementStatus === 'Completed') {
    return (
      <Grid item container alignItems='center'>
        <CheckCircleOutlineIcon fontSize='small' className={[icon, successIcon].join(' ')} />
        <Typography variant='body1' color='secondary'>
          {translateHTML(
            'Message.StatusCompleteV2',
            [
              {
                opening: 'transactionsLinkStart',
                closing: 'transactionsLinkEnd',
                content(chunks) {
                  return (
                    <Link href={TRANSACTIONS_URL} target='_blank'>
                      {chunks}
                    </Link>
                  );
                },
              },
            ],
            { submissionDate: getFormattedDate(lastImbursementSubmissionDate) },
          )}
        </Typography>
      </Grid>
    );
  }

  if (lastImbursementStatus === 'Rejected') {
    return (
      <Grid item container alignItems='center'>
        <HighlightOffIcon fontSize='small' color='error' className={icon} />
        <Typography variant='body1' color='secondary'>
          {translateHTML(
            'Message.StatusRejectedV2',
            [
              {
                opening: 'messagesLinkStart',
                closing: 'messagesLinkEnd',
                content(chunks) {
                  return (
                    <Link href={MESSAGES_URL} target='_blank'>
                      {chunks}
                    </Link>
                  );
                },
              },
            ],
            { submissionDate: getFormattedDate(lastImbursementSubmissionDate) },
          )}
        </Typography>
      </Grid>
    );
  }

  return null;
};

export default RequestStatusMessage;
