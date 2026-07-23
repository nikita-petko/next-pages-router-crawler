import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Alert, makeStyles, Typography } from '@rbx/ui';
import useGroupOwnershipTransfer from '../../hooks/useGroupOwnershipTransfer';
import { GroupConfiguration } from '../../ConfigureGroupTypes';

const useStyles = makeStyles()(() => ({
  alertRoot: {
    width: '100%',
  },
}));

type TPostTransferAcceptedDisclaimerProps = {
  groupConfiguration: GroupConfiguration;
};

const PostTransferAcceptedOwnerDisclaimer = ({
  groupConfiguration,
}: TPostTransferAcceptedDisclaimerProps) => {
  const {
    classes: { alertRoot },
  } = useStyles();
  const { groupOwnerMightBeStale } = useGroupOwnershipTransfer(groupConfiguration);

  const { translate } = useTranslation();

  if (!groupOwnerMightBeStale) return null;

  return (
    <Alert variant='standard' severity='info' className={alertRoot}>
      <Typography>{translate('Label.OutdatedGroupOwner')}</Typography>
    </Alert>
  );
};
export default PostTransferAcceptedOwnerDisclaimer;
