import { Fragment } from 'react';
import { CloudAuthBadStatus } from '@rbx/client-cloud-authentication-service/v1';
import { useTranslation } from '@rbx/intl';
import { Chip, Divider, Grid, Typography, Tooltip } from '@rbx/ui';
import useApiKeyStatusFormStyles from './ApiKeyStatusForm.styles';

interface ApiKeyStatusFormProps {
  statuses: CloudAuthBadStatus[];
}

export const statusKeys: {
  [key in CloudAuthBadStatus]: {
    label: string;
    tooltipMsg: string;
  };
} = {
  [CloudAuthBadStatus.Disabled]: {
    label: 'Label.Disabled',
    tooltipMsg: 'Message.Disabled',
  },
  [CloudAuthBadStatus.Expired]: {
    label: 'Label.Expired',
    tooltipMsg: 'Message.Expired',
  },
  [CloudAuthBadStatus.ExpiredAuto]: {
    label: 'Label.ExpiredAuto',
    tooltipMsg: 'Message.ExpiredAuto',
  },
  [CloudAuthBadStatus.Moderated]: {
    label: 'Label.ModeratedKey',
    tooltipMsg: 'Message.Moderated',
  },
  [CloudAuthBadStatus.Revoked]: {
    label: 'Label.Revoked',
    tooltipMsg: 'Message.Revoked',
  },
  [CloudAuthBadStatus.UserModerated]: {
    label: 'Label.ModeratedUser',
    tooltipMsg: 'Message.UserModerated',
  },
  [CloudAuthBadStatus.Invalid]: {
    label: 'Label.InvalidStatus',
    tooltipMsg: 'Message.InvalidStatus',
  },
};

const ApiKeyStatusForm = ({ statuses }: ApiKeyStatusFormProps) => {
  const { translate } = useTranslation();
  const {
    classes: { chip, label, active, inactive },
  } = useApiKeyStatusFormStyles();

  return (
    <>
      <Grid>
        <Typography classes={{ root: label }} variant='h6' component='h6'>
          {translate('Label.Status')}
        </Typography>
        {statuses.map((status) => {
          const chipClasses = [chip];
          if (status !== CloudAuthBadStatus.Disabled) {
            chipClasses.push(inactive);
          }
          return (
            <Tooltip
              key={status}
              title={translate(statusKeys[status].tooltipMsg)}
              data-testid='status-toolTip'
              placement='top'
              arrow>
              <span>
                <Chip
                  classes={{
                    root: chipClasses.join(' '),
                  }}
                  label={translate(statusKeys[status].label)}
                  color={status === CloudAuthBadStatus.Disabled ? 'secondary' : undefined}
                  variant='outlined'
                />
              </span>
            </Tooltip>
          );
        })}
        {statuses.length === 0 && (
          <Chip
            classes={{ root: [active, chip].join(' ') }}
            variant='outlined'
            label={translate('Label.Active')}
          />
        )}
      </Grid>
      <Divider />
    </>
  );
};

export default ApiKeyStatusForm;
