import React, { Fragment, FunctionComponent, useState, useEffect, useMemo } from 'react';
import { User, AccountSettingsClient, developClient } from '@modules/clients';

import { Button, Tooltip } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import type { TGroup } from '@modules/authentication/types';
import InitiateTransferDialog from './InitiateTransferDialog';

export type InitiateTransferButtonProps = {
  universeId: number;
  experienceCreator?: User | TGroup;
  onSubmit: () => void;
};

export type TransferDialogStage = 'Disclaimer' | 'OwnerSelection';

const InitiateTransferButton: FunctionComponent<
  React.PropsWithChildren<InitiateTransferButtonProps>
> = ({ universeId, experienceCreator, onSubmit }) => {
  const { translate } = useTranslation();

  // States are controlled here so the button will properly reset states without flashing
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [transferDialogStage, setTransferDialogStage] = useState<TransferDialogStage>('Disclaimer');
  // checkbox - disclaimer stage
  const [isImplicationsAcknowledged, setIsImplicationsAcknowledged] = useState<boolean>(false);
  // select group dropdown - owner selection stage
  const [targetGroupId, setTargetGroupId] = useState<number>();
  // input experience name textfield - owner selection stage
  const [nameVerificationText, setNameVerificationText] = useState<string>('');

  const [isUserEmailVerified, setIsUserEmailVerified] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    const fetchEmailStatus = async () => {
      const emailResponse = await AccountSettingsClient.emailApi.v1EmailGet();
      setIsUserEmailVerified(emailResponse?.verified);
    };
    fetchEmailStatus();
  }, []);

  const [isFriendsOnly, setIsFriendsOnly] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    const fetchIsFriendsOnly = async () => {
      const universeAccessResponse = await developClient.getUniverseConfigurationV2(universeId);
      setIsFriendsOnly(universeAccessResponse?.isFriendsOnly);
    };
    fetchIsFriendsOnly();
  }, [universeId]);

  const tooltipTitle = useMemo(() => {
    if (isUserEmailVerified === false) {
      return translate('Description.EmailVerifiedEnableTransfer');
    }

    if (isFriendsOnly === true) {
      return translate('Description.FriendsOnlyEnableTransfer');
    }

    // Tooltip will not be displayed if title length is 0
    return '';
  }, [isUserEmailVerified, isFriendsOnly, translate]);

  const transferDisabled = useMemo(() => {
    return isUserEmailVerified === false || isFriendsOnly === true;
  }, [isUserEmailVerified, isFriendsOnly]);

  return (
    <Fragment>
      <Tooltip data-testid='tooltip' title={tooltipTitle} arrow placement='right'>
        <span>
          <Button
            data-testid='initiate-transfer-button'
            variant='contained'
            size='small'
            color='secondary'
            loading={isUserEmailVerified === undefined || isFriendsOnly === undefined}
            disabled={transferDisabled}
            onClick={() => {
              setIsImplicationsAcknowledged(false);
              setTransferDialogStage('Disclaimer');
              setNameVerificationText('');
              setTargetGroupId(undefined);
              setDialogOpen(true);
            }}>
            {translate('Action.InitiateOwnershipTransfer')}
          </Button>
        </span>
      </Tooltip>

      <InitiateTransferDialog
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        transferDialogStage={transferDialogStage}
        setTransferDialogStage={setTransferDialogStage}
        isImplicationsAcknowledged={isImplicationsAcknowledged}
        setIsImplicationsAcknowledged={setIsImplicationsAcknowledged}
        targetGroupId={targetGroupId}
        setTargetGroupId={setTargetGroupId}
        nameVerificationText={nameVerificationText}
        setNameVerificationText={setNameVerificationText}
        experienceCreator={experienceCreator}
        onSubmit={onSubmit}
      />
    </Fragment>
  );
};

export default InitiateTransferButton;
