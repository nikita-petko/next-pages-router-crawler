import { useTranslation } from '@rbx/intl';
import { Grid, Typography, makeStyles } from '@rbx/ui';
import React, { useCallback } from 'react';
import { User, TransferResourceType, TransferCreatorType } from '@modules/clients';
import GroupMemberSelector from '../GroupMemberSelector';
import { ownershipTransferOwnerSelectionContent } from '../constants/contentConstants';
import { useOwnershipTransferDialogInternalState } from '../providers/OwnershipTransferDialogInternalStateProvider';
import { TModalStageComponentProps } from '../transferConfiguration';

const useStyles = makeStyles()(() => ({
  container: {
    marginBottom: 24,
  },
  heading: {
    marginBottom: 4,
  },
  description: {
    marginBottom: 24,
  },
}));

type TTransferOwnerSelectionProps = TModalStageComponentProps;

const TransferOwnerSelection = ({ resource }: TTransferOwnerSelectionProps) => {
  const { translate } = useTranslation();

  const {
    classes: { container, heading, description },
  } = useStyles();

  const { setSelectedRecipient } = useOwnershipTransferDialogInternalState();

  const { description: descriptionText } =
    ownershipTransferOwnerSelectionContent[resource.resourceType];

  const onSelectGroupMember = useCallback(
    (user: User | undefined) => {
      if (!user?.id || !user?.name) {
        setSelectedRecipient(undefined);
        return;
      }
      setSelectedRecipient({
        creatorId: user?.id,
        creatorType: TransferCreatorType.User,
      });
    },
    [setSelectedRecipient],
  );

  return (
    <Grid container className={container}>
      <Grid item XSmall>
        <Grid container>
          <Grid item XSmall={12} className={heading}>
            <Typography variant='h6'>{translate('Heading.NewOwner')}</Typography>
          </Grid>
          <Grid item XSmall={12} className={description}>
            <Typography variant='captionBody' color='secondary'>
              {translate(descriptionText)}
            </Typography>
          </Grid>
        </Grid>
        {resource.resourceType === TransferResourceType.Group && (
          <GroupMemberSelector onSelectUser={onSelectGroupMember} />
        )}
      </Grid>
    </Grid>
  );
};

export default TransferOwnerSelection;
