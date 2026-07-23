import { Fragment, FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Typography,
  Grid,
  Chip,
  makeStyles,
  RobuxIcon,
  Skeleton,
  Alert,
  AlertTitle,
} from '@rbx/ui';
import { economyClient } from '@modules/clients';
import { Organization, OrganizationPermissions } from '@modules/clients/organizationApi';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import PayoutType from '../interface/PayoutType';
import { SupportedPayoutTypes } from '../constants/payoutsConstants';
import GroupPayoutsView from './GroupPayoutsView';
import ExperiencePayoutsView from './ExperiencePayoutsView';
import OneTimePayoutButton from './OneTimePayoutButton';
import GroupPayoutsCard from './GroupPayoutsCard';
import GroupFundsDetailsDialog from './GroupFundsDetailsDialog';

const useGroupPayoutsStyles = makeStyles()((theme) => ({
  container: {
    width: '100%',
    height: '100%',
    '& > *:not(:last-child)': {
      marginBottom: 24,
    },
  },
  cardsContainer: {
    display: 'flex',
    overflowX: 'auto',
    flexWrap: 'nowrap',
    '& > *:not(:first-child)': {
      marginLeft: 24,
    },
    [theme.breakpoints.down('Medium')]: {
      flexWrap: 'wrap',
      '& > *:not(:first-child)': {
        marginLeft: 0,
        paddingTop: 24,
      },
    },
  },
  chipsContainer: {
    '& > *:not(:first-child)': {
      marginLeft: 12,
    },
  },
  robuxIcon: {
    width: 24,
    height: 24,
    verticalAlign: 'sub',
    fontSize: '1rem',
    marginRight: 4,
  },

  alertContainer: {
    width: '100%',
    '& > *:not(:last-child)': {
      paddingBottom: 24,
    },
    [theme.breakpoints.down('Large')]: {
      paddingLeft: 12,
      paddingRight: 12,
    },
  },
  alertTitle: {
    marginBottom: 4,
  },
  breakdownLink: {
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    padding: 0,
    marginLeft: 8,
    '&:hover': {
      textDecoration: 'underline',
    },
    color: theme.palette.content.action,
  },
}));

export type GroupPayoutsProps = {
  organization: Organization;
  permissions: OrganizationPermissions;
  canUseOneTimePayout: boolean;
  canUseRecurringPayout: boolean;
  disabled?: boolean;
};

const GroupPayouts: FunctionComponent<GroupPayoutsProps> = ({
  organization,
  permissions,
  canUseOneTimePayout,
  canUseRecurringPayout,
  disabled = false,
}) => {
  const {
    classes: {
      container,
      cardsContainer,
      chipsContainer,
      robuxIcon,
      alertContainer,
      alertTitle,
      breakdownLink,
    },
  } = useGroupPayoutsStyles();

  const { translate } = useTranslation();
  const currentGroup = useCurrentGroup();

  const [groupFunds, setGroupFunds] = useState<null | undefined | number>(null);
  const [rate35Robux, setRate35Robux] = useState<null | undefined | number>(null);
  const [payoutType, setPayoutType] = useState<PayoutType>(PayoutType.Group);
  const [isGroupFundsDetailsDialogOpen, setIsGroupFundsDetailsDialogOpen] =
    useState<boolean>(false);

  const fetchGroupFunds = useCallback(async () => {
    if (!organization?.groupId) {
      return;
    }

    const result = await economyClient.getGroupCurrency(Number(organization.groupId));
    setGroupFunds(result.robux);
  }, [organization]);

  const fetchRate35Robux = useCallback(async () => {
    if (!organization?.groupId) {
      return;
    }

    try {
      const result = await economyClient.getGroupSnapshotRobux(Number(organization.groupId));
      setRate35Robux(result.robuxAt35);
    } catch {
      setRate35Robux(0); // 0 will not render the "View Breakdown" button which will hide the breakdown.
    }
  }, [organization]);

  useEffect(() => {
    fetchGroupFunds();
    fetchRate35Robux();
  }, [fetchGroupFunds, fetchRate35Robux]);

  return (
    <Grid container className={container} wrap='wrap' alignContent='flex-start'>
      {/* Alert if group is ineligible for payouts */}
      {(!canUseOneTimePayout || !canUseRecurringPayout) && (
        <Grid container item XSmall={12} wrap='wrap'>
          <Alert severity='error' variant='standard' className={alertContainer}>
            <AlertTitle className={alertTitle}>
              {translate('Title.GroupPayoutsRestricted')}
            </AlertTitle>
            {!canUseOneTimePayout && !canUseRecurringPayout ? (
              translate('Message.AllPayoutRestrictions', {
                groupName: currentGroup?.name ?? translate('Label.TheGroup'),
              })
            ) : (
              <Fragment>
                {!canUseOneTimePayout &&
                  translate('Message.OneTimePayoutRestriction', {
                    groupName: currentGroup?.name ?? translate('Label.TheGroup'),
                  })}
                {!canUseRecurringPayout &&
                  translate('Message.RecurringPayoutRestriction', {
                    groupName: currentGroup?.name ?? translate('Label.TheGroup'),
                  })}
              </Fragment>
            )}
          </Alert>
        </Grid>
      )}
      {/* Description of the intended use of the payout feature */}
      <Grid item>
        <Grid container direction='column'>
          <Grid item>
            <Typography variant='h2'>{translate('Heading.Payouts')}</Typography>
          </Grid>
          <Grid item>
            <Typography variant='body1'>{translate('Description.PayoutsPageBlurb')}</Typography>
          </Grid>
        </Grid>
      </Grid>
      {/* Cards */}
      <Grid className={cardsContainer} item XSmall={12}>
        <Grid item>
          <GroupPayoutsCard
            title={translate('Title.GroupFunds')}
            description={translate('Label.GroupFundsDescription')}
            action={
              rate35Robux != null &&
              rate35Robux > 0 && (
                <Typography
                  variant='body2'
                  className={breakdownLink}
                  onClick={() => setIsGroupFundsDetailsDialogOpen(true)}>
                  {translate('Label.ViewDetails')}
                </Typography>
              )
            }>
            <Grid container alignItems='center'>
              <RobuxIcon className={robuxIcon} />
              {Number.isInteger(groupFunds) ? (
                <Typography variant='h2'>{(groupFunds ?? 0).toLocaleString()}</Typography>
              ) : (
                <Skeleton animate variant='text' width={24} height={24} />
              )}
            </Grid>
          </GroupPayoutsCard>
        </Grid>

        <Grid item>
          <GroupPayoutsCard
            title={translate('Title.SendOneTimePayment')}
            description={translate('Label.PayRobuxToCollaborators')}>
            <OneTimePayoutButton
              organization={organization}
              disabled={
                disabled ||
                groupFunds === 0 ||
                !canUseOneTimePayout ||
                !permissions.canConfigureRevenueDetails
              }
              loading={!Number.isInteger(groupFunds)}
              groupFunds={groupFunds}
              fetchGroupFunds={fetchGroupFunds}
            />
          </GroupPayoutsCard>
        </Grid>
      </Grid>
      {/* Chips */}
      <Grid container className={chipsContainer}>
        {SupportedPayoutTypes.map((supportedPayoutType: PayoutType) => (
          <Chip
            key={supportedPayoutType}
            clickable
            variant='filled'
            label={translate(`Title.${supportedPayoutType}`)}
            color={supportedPayoutType === payoutType ? 'primary' : 'secondary'}
            onClick={() => setPayoutType(supportedPayoutType)}
          />
        ))}
      </Grid>
      {/* Payout contents */}
      <Grid container>
        {payoutType === PayoutType.Group && (
          <GroupPayoutsView
            organization={organization}
            disabled={disabled || !canUseRecurringPayout}
          />
        )}

        {payoutType === PayoutType.Experiences && (
          <ExperiencePayoutsView
            organization={organization}
            disabled={disabled || !canUseRecurringPayout}
          />
        )}
      </Grid>
      <GroupFundsDetailsDialog
        open={isGroupFundsDetailsDialogOpen}
        onClose={() => setIsGroupFundsDetailsDialogOpen(false)}
        groupFunds={groupFunds}
        rate35Robux={rate35Robux}
      />
    </Grid>
  );
};

export default GroupPayouts;
