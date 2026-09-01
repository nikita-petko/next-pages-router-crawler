import type { FunctionComponent } from 'react';
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, Tooltip } from '@rbx/ui';
import type { TGroup } from '@modules/authentication/types';
import { AccountSettingsClient } from '@modules/clients/accountSettings';
import developClient from '@modules/clients/develop';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import type { User } from '@modules/clients/users';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';
import InitiateTransferDialog from './InitiateTransferDialog';
import type { InitiateTransferDialogStage } from './types';

export type InitiateTransferButtonProps = {
  universeId: number;
  experienceCreator?: User | TGroup;
  onSubmit: () => void;
};

const InitiateTransferButton: FunctionComponent<
  React.PropsWithChildren<InitiateTransferButtonProps>
> = ({ universeId, experienceCreator, onSubmit }) => {
  const { translate } = useTranslation();

  // States are controlled here so the button will properly reset states without flashing
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [transferDialogStage, setTransferDialogStage] =
    useState<InitiateTransferDialogStage>('Disclaimer');
  // checkbox - disclaimer stage
  const [isImplicationsAcknowledged, setIsImplicationsAcknowledged] = useState<boolean>(false);
  // select group dropdown - owner selection stage
  const [targetGroupId, setTargetGroupId] = useState<number>();
  // input experience name textfield - owner selection stage
  const [nameVerificationText, setNameVerificationText] = useState<string>('');

  const {
    params: { enableAudiencesReplacement },
  } = useIXPParameters(IXPLayers.CreatorHubCreationsPermission);

  const [isUserEmailVerified, setIsUserEmailVerified] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    const fetchEmailStatus = async () => {
      const emailResponse = await AccountSettingsClient.emailApi.v1EmailGet();
      setIsUserEmailVerified(emailResponse?.verified);
    };
    void fetchEmailStatus();
  }, []);

  const [isFriendsOnly, setIsFriendsOnly] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    if (enableAudiencesReplacement) {
      return;
    }
    const fetchIsFriendsOnly = async () => {
      const universeAccessResponse = await developClient.getUniverseConfigurationV2(universeId);
      setIsFriendsOnly(universeAccessResponse?.isFriendsOnly);
    };
    void fetchIsFriendsOnly();
  }, [universeId, enableAudiencesReplacement]);

  const tooltipTitle = useMemo(() => {
    if (isUserEmailVerified === false) {
      return translate('Description.EmailVerifiedEnableTransfer');
    }

    if (!enableAudiencesReplacement && isFriendsOnly === true) {
      return translate('Description.FriendsOnlyEnableTransfer');
    }

    // Tooltip will not be displayed if title length is 0
    return '';
  }, [isUserEmailVerified, isFriendsOnly, translate, enableAudiencesReplacement]);

  const transferDisabled = useMemo(() => {
    if (enableAudiencesReplacement) {
      return isUserEmailVerified === false;
    }
    return isUserEmailVerified === false || isFriendsOnly === true;
  }, [isUserEmailVerified, isFriendsOnly, enableAudiencesReplacement]);

  return (
    <>
      <Tooltip data-testid='tooltip' title={tooltipTitle} arrow placement='right'>
        <span>
          <Button
            data-testid='initiate-transfer-button'
            variant='contained'
            size='small'
            color='secondary'
            loading={
              isUserEmailVerified === undefined ||
              (!enableAudiencesReplacement && isFriendsOnly === undefined)
            }
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
    </>
  );
};

export default InitiateTransferButton;
