import React, { useEffect } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import Flex from '@modules/miscellaneous/components/Flex';
import useGetUserById from '@modules/react-query/users/userQueries';
import type { GroupConfiguration } from '../../ConfigureGroupTypes';
import useGroupOwnershipTransfer from '../../hooks/useGroupOwnershipTransfer';
import OwnershipRowV2 from './OwnershipRowV2';
import PostTransferAcceptedOwnerDisclaimer from './PostTransferAcceptedOwnerDisclaimer';

type TOwnershipSectionProps = {
  groupConfiguration: GroupConfiguration;
};

const OwnershipSection: React.FC<TOwnershipSectionProps> = ({
  groupConfiguration,
}: TOwnershipSectionProps) => {
  const { translate } = useTranslation();

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
    <>
      <Grid item XSmall={12}>
        <Typography variant='h3'>{translate('Label.Owner')}</Typography>
      </Grid>
      <PostTransferAcceptedOwnerDisclaimer groupConfiguration={groupConfiguration} />
      <Grid item XSmall={12}>
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
      </Grid>
    </>
  );
};
export default OwnershipSection;
