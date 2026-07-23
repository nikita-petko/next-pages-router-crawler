import { useSettings } from '@modules/settings';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import { Control, Controller, ControllerRenderProps } from 'react-hook-form';
import React, { Fragment, useEffect } from 'react';
import { Flex } from '@modules/miscellaneous/common/components';
import useGetUserById from '@modules/react-query/users/userQueries';
import { User } from '@modules/clients';
import OwnershipRow from './OwnershipRow';
import OwnershipRowV2 from './OwnershipRowV2';
import { ConfigureGroupFormType, GroupConfiguration } from '../../ConfigureGroupTypes';
import useGroupOwnershipTransfer from '../../hooks/useGroupOwnershipTransfer';
import PostTransferAcceptedOwnerDisclaimer from './PostTransferAcceptedOwnerDisclaimer';

type TOwnershipSectionProps = {
  groupConfiguration: GroupConfiguration;
  // NOTE(@rvaughan, 2025-05-28): Props below should be removed after fully releasing new flow
  control: Control<ConfigureGroupFormType, unknown, ConfigureGroupFormType>;
  isDisabled: boolean;
  handleOwnerChange: (
    newOwner: User | null,
    fieldOnChange: ControllerRenderProps['onChange'],
  ) => void;
};

const OwnershipSection: React.FC<TOwnershipSectionProps> = ({
  groupConfiguration,
  control,
  isDisabled,
  handleOwnerChange,
}: TOwnershipSectionProps) => {
  const { translate } = useTranslation();
  const { settings } = useSettings();

  const {
    open,
    dialog,
    targetCreator,
    hasPendingTransfer,
    showCancelledTransfer,
    showExpiredTransfer,
    isGroupTransferOnCooldown,
  } = useGroupOwnershipTransfer(groupConfiguration);

  const { data: targetUser } = useGetUserById(targetCreator?.creatorId);

  useEffect(() => {
    if (showCancelledTransfer) {
      open('Cancelled');
    } else if (showExpiredTransfer) {
      open('Timedout');
    }
  }, [showCancelledTransfer, showExpiredTransfer, open]);

  return (
    <Fragment>
      <Grid item XSmall={12}>
        <Typography variant='h3'>{translate('Label.Owner')}</Typography>
      </Grid>
      <PostTransferAcceptedOwnerDisclaimer groupConfiguration={groupConfiguration} />
      <Grid item XSmall={12}>
        {settings?.enableGroupOwnershipTransferV2 ? (
          <Flex flexDirection='column'>
            <OwnershipRowV2
              currentGroupOwner={groupConfiguration.owner}
              userToDisplay={groupConfiguration.owner}
              hasPendingTransfer={hasPendingTransfer}
              isGroupTransferOnCooldown={isGroupTransferOnCooldown}
              onClick={() => open('Initiate')}
            />
            {hasPendingTransfer && targetUser !== undefined && (
              <OwnershipRowV2
                currentGroupOwner={groupConfiguration.owner}
                userToDisplay={targetUser}
                hasPendingTransfer={hasPendingTransfer}
                onClick={() => open('Cancel')}
                isGroupTransferOnCooldown={isGroupTransferOnCooldown}
              />
            )}
            {dialog}
          </Flex>
        ) : (
          <Controller
            name='owner'
            control={control}
            render={({ field }) => (
              <OwnershipRow
                {...field}
                groupId={groupConfiguration.id}
                onChange={(newOwnerId) => handleOwnerChange(newOwnerId, field.onChange)}
                disabled={isDisabled}
              />
            )}
          />
        )}
      </Grid>
    </Fragment>
  );
};
export default OwnershipSection;
