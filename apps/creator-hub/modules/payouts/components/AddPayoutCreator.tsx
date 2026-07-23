import React, { FunctionComponent, useCallback, useState } from 'react';
import {
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  makeStyles,
  AddCircleOutlineIcon,
  PercentIcon,
} from '@rbx/ui';
import { Organization } from '@modules/clients/organizationApi';
import { User, economyClient } from '@modules/clients';
import { useTranslation } from '@rbx/intl';
// eslint-disable-next-line no-restricted-imports -- needed for searching group members
import { checkGroupMembership } from '@modules/group/utils/groupUtils';
import { PayoutsBase } from '../interface/PayoutsFormType';
import DebouncedUserSearch from './DebouncedUserSearch';
import {
  validateNumberInput,
  validatePayoutAmountsLessThanOrEqualTo100,
} from '../utils/payoutsUtils';
import FilteredUserType from '../interface/FilteredUserType';
import { EconomyEligibilityMaxPageSize } from '../constants/payoutsConstants';

const useAddPayoutCreatorStyles = makeStyles()(() => ({
  container: {
    '& > *:not(:last-child)': {
      marginRight: 16,
    },
  },

  percentageInput: {
    width: 120,
  },
}));

export type AddPayoutCreatorProps = {
  organization: Organization;
  payouts: PayoutsBase[];
  onSubmit: (payout: PayoutsBase, user: User) => void;
  disabled?: boolean;
};

const AddPayoutCreator: FunctionComponent<AddPayoutCreatorProps> = ({
  organization,
  payouts,
  onSubmit,
  disabled = false,
}) => {
  const {
    classes: { container, percentageInput },
  } = useAddPayoutCreatorStyles();

  const { translate } = useTranslation();

  const [creator, setCreator] = useState<User>();
  const [percentage, setPercentage] = useState<string>('');

  const onSelectUser = useCallback(
    (value?: User) => {
      setCreator(value);
    },
    [setCreator],
  );

  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      // Input must be a number and the sum of all payouts must be less than or
      // equal to 100

      const payoutAmounts = payouts.map((po) =>
        po.percentage === '' ? 0 : Number.parseInt(po.percentage, 10),
      );
      payoutAmounts.push(Number(event.target.value));
      if (
        validateNumberInput(event.target.value) &&
        validatePayoutAmountsLessThanOrEqualTo100(payoutAmounts)
      ) {
        setPercentage(event.target.value);
      }
    },
    [payouts],
  );

  const handleAddCreator = useCallback(() => {
    if (!creator?.id) {
      return;
    }

    onSubmit(
      {
        creatorId: creator.id.toString(),
        percentage: percentage === '' ? '0' : percentage,
      },
      creator,
    );

    setCreator(undefined);
    setPercentage('');
  }, [onSubmit, percentage, creator]);

  const filterUsers = useCallback(
    async (results: Array<User>) => {
      if (results.length === 0) {
        return [];
      }

      const groupId = Number.parseInt(organization.groupId, 10);

      // We want to filter out any users who are already included in the payouts
      const excludeIds = new Map(
        payouts.map((payout) => [Number.parseInt(payout.creatorId, 10), true]),
      );
      const filteredResults = results.filter((result) => result.id && !excludeIds.get(result.id));

      // Create an array of promises for checking group membership
      const membershipPromises = filteredResults.map(
        (result) => result.id && checkGroupMembership(groupId, result.id),
      );

      // Wait for all promises to resolve
      const resolvedMembershipPromises = await Promise.all(membershipPromises);

      // Filter the results based on the resolved promises
      const groupMembers = filteredResults.filter(
        (_result, index) => resolvedMembershipPromises[index],
      );

      // Filter the results based on the resolved promises
      const groupMemberUserIds = groupMembers.map((result) => result.id);
      const definedGroupMemberUserIds = groupMemberUserIds.filter(
        (id) => id !== undefined,
      ) as Array<number>;

      // Now that we have the group members, we can filter by who is eligible for payouts
      const totalChunks = Math.ceil(
        definedGroupMemberUserIds.length / EconomyEligibilityMaxPageSize,
      );
      const eligibilityPromises = [];
      for (let i = 0; i < totalChunks; i += 1) {
        const start = i * EconomyEligibilityMaxPageSize;
        const end = start + EconomyEligibilityMaxPageSize;
        const chunk = definedGroupMemberUserIds.slice(start, end);
        const promise = economyClient.getGroupUserPayoutEligibility(groupId, chunk);
        eligibilityPromises.push(promise);
      }

      const resolvedEligibilityPromises = await Promise.all(eligibilityPromises);

      const eligibilityMap: Map<number, string> = new Map();
      resolvedEligibilityPromises.forEach((result) => {
        Object.entries(result.usersGroupPayoutEligibility ?? []).forEach(([key, value]) => {
          eligibilityMap.set(Number.parseInt(key, 10), value);
        });
      });

      // Map the group members to an array of FilteredUserType
      const eligibleGroupMembers: Array<FilteredUserType> = groupMembers.map((member) => {
        const isUserEligible = !member?.id || eligibilityMap.get(member.id) === 'Eligible';

        return {
          user: member,
          label: !isUserEligible ? translate('Label.UserNotEligible') : undefined,
          disabled: !isUserEligible,
        };
      });

      return eligibleGroupMembers;
    },
    [organization.groupId, payouts, translate],
  );

  return (
    <Grid
      container
      alignItems='flex-start'
      justifyContent='flex-start'
      wrap='nowrap'
      className={container}>
      <Grid item XSmall>
        <DebouncedUserSearch
          value={creator}
          onSelect={onSelectUser}
          onFilter={filterUsers}
          textFieldLabel={translate('Label.Member')}
        />
      </Grid>
      <Grid item>
        <Grid container alignItems='center' justifyContent='flex-start' wrap='nowrap'>
          <TextField
            size='small'
            label={translate('Label.Earnings')}
            id='earnings'
            value={percentage}
            onChange={onChange}
            className={percentageInput}
            InputProps={{
              endAdornment: (
                <InputAdornment position='start'>
                  <PercentIcon fontSize='small' />
                </InputAdornment>
              ),
            }}
          />

          <IconButton
            aria-label='add-creator'
            color='secondary'
            disabled={disabled || !creator || percentage === ''}
            onClick={handleAddCreator}
            style={{ marginRight: 8 }}>
            <AddCircleOutlineIcon />
          </IconButton>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default AddPayoutCreator;
