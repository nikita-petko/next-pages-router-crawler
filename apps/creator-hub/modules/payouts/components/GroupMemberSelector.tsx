import { Fragment } from 'react';
import { useTranslation, useLocalization, withTranslation, Locale } from '@rbx/intl';
import { TextField, SearchIcon, RobuxIcon, Typography, Grid } from '@rbx/ui';
import type { User } from '@modules/clients/users';
import type { RenderOptionParams } from '@modules/miscellaneous/components/UserSelect/types';
import UserSelect from '@modules/miscellaneous/components/UserSelect/UserSelect';
import formatDateFromNow from '@modules/miscellaneous/components/UserSelect/utils/dateUtils';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useUserOptionsForGroupMembersEligibleForPayout, {
  type PayoutMetadata,
} from '../hooks/useUserOptionsForGroupMembersEligibleForPayout';
import { isPayoutMetadata } from '../utils/payoutsUtils';

export type UserWithMetadata = {
  user: User;
  metadata?: PayoutMetadata;
};

type TGroupMemberSelectorProps = {
  onSelectUser: (userWithMetadata: UserWithMetadata | undefined) => void;
  groupId: string;
  organizationId: string;
  excludeUserIds?: Set<number>;
  helperText?: string;
  disabled?: boolean;
};

const GroupMemberSelector = ({
  onSelectUser,
  groupId,
  organizationId,
  excludeUserIds,
  helperText,
  disabled,
}: TGroupMemberSelectorProps) => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const userSelectProps = useUserOptionsForGroupMembersEligibleForPayout({
    excludeCurrentUser: false,
    groupId,
    organizationId,
    excludeUserIds,
  });

  const handleSelect = (user: User | undefined) => {
    if (!user || !user.id) {
      onSelectUser(undefined);
      return;
    }

    const userStatus = userSelectProps.userStatus.get(user.id);
    const metadata =
      userStatus?.category === 'PayoutMetadata' && isPayoutMetadata(userStatus.metadata)
        ? userStatus.metadata
        : undefined;

    onSelectUser({ user, metadata });
  };

  const renderOption = ({
    status,
    defaultRender,
    renderUserInfo,
    renderChipLabel,
  }: RenderOptionParams) => {
    // For payout metadata, customize the chip label
    if (status?.category === 'PayoutMetadata' && isPayoutMetadata(status.metadata)) {
      const { amount, createdAt } = status.metadata;
      const formattedAmount = Intl.NumberFormat(locale ?? Locale.English).format(amount);
      const relativeTime = formatDateFromNow(createdAt, translate);

      const customChipLabel = (
        <>
          <Typography variant='body2' component='span'>
            {translate('Label.Sent')}
          </Typography>
          <RobuxIcon fontSize='small' sx={{ verticalAlign: 'middle', mx: 0.5, mb: 0.25 }} />
          <Typography variant='body2' component='span'>
            {formattedAmount}, {relativeTime}
          </Typography>
        </>
      );

      return (
        <Grid container alignItems='center' spacing={1}>
          <Grid item flex='1 1 0' style={{ overflow: 'hidden' }}>
            {renderUserInfo()}
          </Grid>
          {renderChipLabel(customChipLabel)}
        </Grid>
      );
    }

    // Use default rendering for all other cases
    return defaultRender();
  };

  return (
    <UserSelect
      {...userSelectProps}
      onSelect={handleSelect}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          InputProps={{
            ...params.InputProps,
            startAdornment: <SearchIcon />,
            placeholder: translate('Label.SearchByUsernameOrId'),
          }}
          label=''
          helperText={helperText}
        />
      )}
      renderOption={renderOption}
    />
  );
};

export default withTranslation(GroupMemberSelector, [
  TranslationNamespace.Payouts,
  TranslationNamespace.Organization,
]);
