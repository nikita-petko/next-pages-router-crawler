import type { FunctionComponent } from 'react';
import React, { Fragment, useCallback, useState, useEffect } from 'react';
import { ResourceType, HoldState } from '@rbx/client-ownership-transfer-api/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography, useDialog } from '@rbx/ui';
import type { TransferHold } from '@modules/clients/ownershipTransferApi';
import ownershipTransferClient from '@modules/clients/ownershipTransferApi';
import type { User } from '@modules/clients/users';
import { CreatorType } from '@modules/miscellaneous/common';
import ThumbnailWithNames from '@modules/miscellaneous/components/ThumbnailWithNames';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import type { TGroup } from '@modules/providers/groups/constants';
import { useGroups } from '@modules/providers/groups/GroupsProvider';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import OwnershipEvents from '../../constants/OwnershipEvents';
import CancelTransferButton from './CancelTransferButton';
import ExpiredTransferAcknowledgementDialog from './ExpiredTransferAcknowledgementDialog';
import InitiateTransferButton from './InitiateTransferButton';

export type OwnershipContainerProps = {
  universeId: number;
  experienceCreator?: User | TGroup;
};

type TransferActionStatus = 'Ineligible' | 'CanInitiate' | 'CanCancel' | 'Expired';

const OwnershipContainer: FunctionComponent<React.PropsWithChildren<OwnershipContainerProps>> = ({
  universeId,
  experienceCreator,
}) => {
  const { gameDetails } = useCurrentGame();
  const { translate } = useTranslation();
  const { groups } = useGroups();
  const { open: openDialog, close: closeDialog, configure } = useDialog();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { settings } = useSettings();

  const [latestTransferDetails, setLatestTransferDetails] = useState<TransferHold | null>();
  const [transferActionStatus, setTransferActionStatus] =
    useState<TransferActionStatus>('Ineligible');

  const [pendingTargetGroup, setPendingTargetGroup] = useState<TGroup>();

  const getTransfer = useCallback(async () => {
    try {
      const getTransferResponse = await ownershipTransferClient.getLatestTransfer({
        resourceType: ResourceType.Universe,
        resourceId: gameDetails?.id ?? 0,
      });

      setLatestTransferDetails(getTransferResponse);
    } catch (error) {
      if (error instanceof SyntaxError || (error as Error).name === 'SyntaxError') {
        // Syntax error comes from incorrect json deserialization of 204 response
        // empty response - authorized response meaning never transferred before
        // Safari isn't respecting instanceof so we check the name property as well
        setLatestTransferDetails(null);
      } else {
        // Other errors will be undefined
        setLatestTransferDetails(undefined);
      }
    }
  }, [gameDetails?.id]);

  useEffect(() => {
    getTransfer();
  }, [getTransfer]);

  const acknowledgeExpiration = useCallback(async () => {
    if (gameDetails?.id) {
      try {
        await ownershipTransferClient.acknowledgeTransfer({
          resourceType: ResourceType.Universe,
          resourceId: gameDetails?.id,
        });

        unifiedLogger.logClickEvent({
          eventName: OwnershipEvents.AcknowledgeExpiredTransfer,
          parameters: {
            resourceType: ResourceType.Universe,
            resourceId: gameDetails?.id.toString(),
          },
        });
      } catch {
        // swallow error - if this errors, it'll just show again on later page
        // loads and this non-blocking for creating new transfers
      }
    }
  }, [gameDetails?.id, unifiedLogger]);

  useEffect(() => {
    if (latestTransferDetails !== undefined) {
      if (latestTransferDetails === null) {
        setTransferActionStatus('CanInitiate');
      } else if (
        latestTransferDetails?.holdState === HoldState.Timedout &&
        !latestTransferDetails?.expirationAcknowledged
      ) {
        const targetGroup = groups?.find(
          (group) => group.id === latestTransferDetails.targetCreator.creatorId,
        );
        configure(
          <ExpiredTransferAcknowledgementDialog
            targetGameName={gameDetails?.name}
            targetGroupName={targetGroup?.name}
            onClose={closeDialog}
          />,
        );
        openDialog();
        acknowledgeExpiration();
        setTransferActionStatus('CanInitiate');
      } else if (latestTransferDetails?.holdState === HoldState.Pending) {
        setTransferActionStatus('CanCancel');
        const targetGroup = groups?.find(
          (group) => group.id === latestTransferDetails.targetCreator.creatorId,
        );
        setPendingTargetGroup(targetGroup);
      } else if (
        (latestTransferDetails?.holdState === HoldState.Completed &&
          latestTransferDetails.updatedUtcTime >
            new Date(Date.now() - settings.ownershipTransferCompletedTimeout * 1000)) ||
        latestTransferDetails?.holdState === HoldState.Accepted
      ) {
        setTransferActionStatus('Ineligible');
      } else {
        setTransferActionStatus('CanInitiate');
      }
    }
  }, [
    latestTransferDetails,
    gameDetails,
    groups,
    configure,
    openDialog,
    closeDialog,
    acknowledgeExpiration,
    pendingTargetGroup?.name,
    settings.ownershipTransferCompletedTimeout,
  ]);

  return (
    experienceCreator &&
    gameDetails && (
      <>
        <Typography variant='h6' color='secondary'>
          {translate('Heading.Owner')}
        </Typography>
        <Grid container justifyContent='space-between'>
          <Grid item style={{ marginTop: 16 }}>
            {gameDetails?.creator?.id && gameDetails?.creator?.type && (
              <ThumbnailWithNames
                target={experienceCreator}
                targetType={gameDetails?.creator?.type as CreatorType}
              />
            )}
          </Grid>
          <Grid item style={{ marginTop: 16 }}>
            {transferActionStatus === 'CanInitiate' && (
              <InitiateTransferButton
                universeId={universeId}
                experienceCreator={experienceCreator}
                onSubmit={getTransfer}
              />
            )}
          </Grid>
        </Grid>
        {latestTransferDetails?.holdState === HoldState.Pending &&
          pendingTargetGroup !== undefined && (
            <Grid container justifyContent='space-between'>
              <Grid item style={{ marginTop: 16 }}>
                <ThumbnailWithNames
                  target={pendingTargetGroup}
                  targetType={CreatorType.Group}
                  disabled
                  label={translate('Label.WaitingToAccept')}
                />
              </Grid>
              <Grid item style={{ marginTop: 16 }}>
                {transferActionStatus === 'CanCancel' && (
                  <CancelTransferButton
                    targetGroupName={pendingTargetGroup.name}
                    onSubmit={getTransfer}
                  />
                )}
              </Grid>
            </Grid>
          )}
      </>
    )
  );
};

export default withTranslation(OwnershipContainer, [
  TranslationNamespace.OwnershipTransfer,
  TranslationNamespace.Payouts,
]);
