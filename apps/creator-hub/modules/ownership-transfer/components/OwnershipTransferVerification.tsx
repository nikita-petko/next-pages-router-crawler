import React from 'react';
import { makeStyles, Grid, Typography, Avatar, TextField } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { TransferResourceType } from '@modules/clients';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { TSupportedOwnershipTransferResourceTypes } from '../types';
import { ownershipTransferVerificationContent } from '../constants/contentConstants';
import { useOwnershipTransferDialogInternalState } from '../providers/OwnershipTransferDialogInternalStateProvider';
import { TModalStageComponentProps } from '../transferConfiguration';

const useStyles = makeStyles()(() => ({
  select: {
    marginBottom: 24,
  },
  heading: {
    marginBottom: 4,
  },
  description: {
    marginBottom: 24,
  },
  groupDetail: {
    marginBottom: 24,
  },
  resourceLabel: {
    paddingLeft: 8,
  },
}));

type TOwnershipTransferVerificationProps = TModalStageComponentProps;

const resourceTypeToThumbnailType: Record<
  TSupportedOwnershipTransferResourceTypes,
  ThumbnailTypes
> = {
  [TransferResourceType.Group]: ThumbnailTypes.groupIcon,
};

const OwnershipTransferVerification = ({ resource }: TOwnershipTransferVerificationProps) => {
  const { translate } = useTranslation();

  const { nameVerificationText, setNameVerificationText } =
    useOwnershipTransferDialogInternalState();

  const {
    classes: { heading, description, groupDetail, resourceLabel },
  } = useStyles();

  const { resourceId, resourceType, resourceName } = resource;

  const { description: descriptionText, inputLabel } =
    ownershipTransferVerificationContent[resourceType];

  return (
    <Grid container>
      <Grid item XSmall>
        <Grid container>
          <Grid item XSmall={12} className={heading}>
            <Typography variant='h6'>{translate('Heading.Verification')}</Typography>
          </Grid>
          <Grid item XSmall={12} className={description}>
            <Typography variant='captionBody' color='secondary'>
              {translate(descriptionText)}
            </Typography>
          </Grid>
        </Grid>
        <Grid container alignItems='center' className={groupDetail}>
          <Avatar variant='rounded' alt='icon'>
            <Thumbnail2d
              targetId={resourceId}
              type={resourceTypeToThumbnailType[resourceType]}
              alt={resourceName}
            />
          </Avatar>
          <Typography className={resourceLabel}>{resourceName}</Typography>
        </Grid>
        <TextField
          size='small'
          fullWidth
          id='verification-input'
          label={translate(inputLabel)}
          value={nameVerificationText}
          onChange={(e) => setNameVerificationText(e.target.value)}
        />
      </Grid>
    </Grid>
  );
};

export default OwnershipTransferVerification;
