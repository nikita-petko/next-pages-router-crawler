import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { numberFormatter } from '@rbx/core';
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
  ExpandMoreIcon,
  ExpandLessIcon,
} from '@rbx/ui';
import economyClient from '@modules/clients/economy';
import type { Organization, OrganizationPermissions } from '@modules/clients/organizationApi';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { SupportedPayoutTypes } from '../constants/payoutsConstants';
import useGroupDevExWatermarks from '../hooks/useGroupDevExWatermarks';
import PayoutType from '../interface/PayoutType';
import { allocatePayoutWatermarkBuckets } from '../utils/groupWatermarkUtils';
import ExperiencePayoutsView from './ExperiencePayoutsView';
import GroupFundsWatermarkBreakdown from './GroupFundsWatermarkBreakdown';
import GroupPayoutsCard from './GroupPayoutsCard';
import GroupPayoutsView from './GroupPayoutsView';
import OneTimePayoutButton from './OneTimePayoutButton';

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
    classes: { container, cardsContainer, chipsContainer, robuxIcon, alertContainer, alertTitle },
  } = useGroupPayoutsStyles();

  const { translate } = useTranslation();
  const currentGroup = useCurrentGroup();

  const [groupFunds, setGroupFunds] = useState<null | undefined | number>(null);
  const [payoutType, setPayoutType] = useState<PayoutType>(PayoutType.Group);
  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState<boolean>(false);

  const { normalizedWatermarks } = useGroupDevExWatermarks(organization?.groupId);

  const fetchGroupFunds = useCallback(async () => {
    if (!organization?.groupId) {
      return;
    }

    const result = await economyClient.getGroupCurrency(Number(organization.groupId));
    setGroupFunds(result.robux);
  }, [organization]);

  useEffect(() => {
    void fetchGroupFunds();
  }, [fetchGroupFunds]);

  const toggleBreakdown = useCallback(() => {
    setIsBreakdownExpanded((prev) => !prev);
  }, []);

  const allocation =
    normalizedWatermarks && groupFunds != null && Number.isInteger(groupFunds) && groupFunds > 0
      ? allocatePayoutWatermarkBuckets(groupFunds, normalizedWatermarks)
      : undefined;

  const fiatEstimateUsd = allocation?.totalUsd;

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
              <>
                {!canUseOneTimePayout &&
                  translate('Message.OneTimePayoutRestriction', {
                    groupName: currentGroup?.name ?? translate('Label.TheGroup'),
                  })}
                {!canUseRecurringPayout &&
                  translate('Message.RecurringPayoutRestriction', {
                    groupName: currentGroup?.name ?? translate('Label.TheGroup'),
                  })}
              </>
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
            description={translate('Label.GroupFundsDescription')}>
            <Grid container direction='column'>
              <Grid
                container
                alignItems='center'
                className={allocation ? 'cursor-pointer flex items-center' : undefined}
                onClick={allocation ? toggleBreakdown : undefined}>
                <RobuxIcon className={robuxIcon} />
                {Number.isInteger(groupFunds) ? (
                  <Typography variant='h2'>{(groupFunds ?? 0).toLocaleString()}</Typography>
                ) : (
                  <Skeleton animate variant='text' width={24} height={24} />
                )}
                {allocation &&
                  (isBreakdownExpanded ? (
                    <ExpandLessIcon className='size-500 ml-1 content-muted' />
                  ) : (
                    <ExpandMoreIcon className='size-500 ml-1 content-muted' />
                  ))}
              </Grid>
              {fiatEstimateUsd != null && (
                <Typography variant='subtitle2' className='mt-0.5 padding-left-xxlarge'>
                  {String(numberFormatter(fiatEstimateUsd, 'currency'))}
                </Typography>
              )}
              {isBreakdownExpanded && allocation && (
                <GroupFundsWatermarkBreakdown
                  allocation={allocation}
                  showO18={normalizedWatermarks?.shouldDisplayEffectiveO18Robux ?? false}
                />
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
    </Grid>
  );
};

export default GroupPayouts;
