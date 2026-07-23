import React, { FunctionComponent, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { makeStyles, Tooltip } from '@rbx/ui';
import { User } from '@modules/clients';
import { CreatorType } from '@modules/miscellaneous/common';
import { ThumbnailWithNames } from '@modules/miscellaneous/common/components';
import useCurrentOrganization from '../../hooks/useCurrentOrganization';
import OwnershipTransferButton from './OwnershipTransferButton';

const useStyles = makeStyles()(() => {
  return {
    container: {
      paddingTop: 12,
      display: 'flex',
      justifyContent: 'space-between',
    },
  };
});

export interface OwnershipRowProps {
  currentGroupOwner: User;
  userToDisplay: User;
  hasPendingTransfer?: boolean;
  isGroupTransferOnCooldown?: boolean;
  onClick: () => void;
}

const OwnershipRow: FunctionComponent<React.PropsWithChildren<OwnershipRowProps>> = ({
  currentGroupOwner,
  userToDisplay,
  hasPendingTransfer,
  isGroupTransferOnCooldown,
  onClick,
}) => {
  const { classes } = useStyles();

  const { translate } = useTranslation();
  const { permissions } = useCurrentOrganization();

  const isDisplayingGroupOwner = currentGroupOwner.id === userToDisplay.id;
  const canUpdateOwnership = permissions?.isOwner ?? false;

  const transferButton = useMemo(() => {
    if (!canUpdateOwnership) return undefined;

    if (isDisplayingGroupOwner && !hasPendingTransfer) {
      if (isGroupTransferOnCooldown) {
        return (
          <Tooltip
            placement='top'
            title={translate('Label.GroupTransferOnCooldown')}
            data-testid='ownership-transfer-cooldown-tooltip'>
            <div>
              <OwnershipTransferButton disabled variant='Initiate' onClick={onClick} />
            </div>
          </Tooltip>
        );
      }

      return <OwnershipTransferButton variant='Initiate' onClick={onClick} />;
    }

    if (!isDisplayingGroupOwner && hasPendingTransfer) {
      return <OwnershipTransferButton variant='Cancel' onClick={onClick} />;
    }

    return undefined;
  }, [
    translate,
    canUpdateOwnership,
    hasPendingTransfer,
    isDisplayingGroupOwner,
    isGroupTransferOnCooldown,
    onClick,
  ]);

  return (
    <div className={classes.container} data-testid='ownership-row-v2'>
      <ThumbnailWithNames
        disabled={!isDisplayingGroupOwner}
        target={userToDisplay}
        targetType={CreatorType.User}
        label={isDisplayingGroupOwner ? undefined : translate('Label.PendingTransfer')}
      />
      {transferButton}
    </div>
  );
};

export default OwnershipRow;
