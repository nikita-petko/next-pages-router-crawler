/* oxlint-disable react/react-compiler -- Existing transfer-state effect/dependency patterns are outside this permissions migration. */
import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CreatorType, HoldState, ResourceType } from '@rbx/client-ownership-transfer-api/v1';
import { StatusCodes } from '@rbx/core';
import { withTranslation } from '@rbx/intl';
import { useAuthentication } from '@modules/authentication/providers';
import groupsClient from '@modules/clients/groups';
import type { TransferHold } from '@modules/clients/ownershipTransferApi';
import ownershipTransferClient from '@modules/clients/ownershipTransferApi';
import InProgressTransferPage from '@modules/creations/basicSettings/components/Ownership/InProgressTransferPage';
import ReceiveTransferBanner from '@modules/creations/basicSettings/components/Ownership/ReceiveTransferBanner';
import { AnalyticsContextLayerInnerProvider } from '@modules/experience-analytics-shared/context/AnalyticsContextLayerProvider';
import { useAnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import { defaultAnalyticsPageSurfaceConfig } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import ExperienceOverviewPage from '@modules/experience-analytics/pages/ExperienceOverviewPage/ExperienceOverviewPage';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';
import { PageLoading } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import OverviewHeader from '../components/OverviewHeader';
import useOverviewVariant from '../hooks/useOverviewVariant';

/**
 * Container and entry point for the experience overview page.
 */
const OverviewPageContainer: FC = () => {
  const { canConfigure, isLoadingGame, isErrorLoadingGame, gameDetails } = useCurrentGame();
  const { userCanViewAnalyticsForUniverse, isPending: isPendingAnalyticsExperiencePermissions } =
    useAnalyticsExperiencePermissions(gameDetails?.id ?? uninitializedUniverseId);
  const { variant, isLoading: isVariantLoading } = useOverviewVariant(
    gameDetails?.id ?? uninitializedUniverseId,
  );
  const { user } = useAuthentication();
  const { settings } = useSettings();

  const router = useRouter();

  const [targetGroupOwnerId, setTargetGroupOwnerId] = useState<number>();
  const [transferDetails, setTransferDetails] = useState<TransferHold>();

  const loadTransfer = useCallback(async () => {
    if (gameDetails?.id) {
      try {
        const getTransferResponse = await ownershipTransferClient.getLatestTransfer({
          resourceType: ResourceType.Universe,
          resourceId: gameDetails?.id ?? 0,
        });

        setTransferDetails((prevDetails: TransferHold | undefined) => {
          // If when polling, we have an accepted state transition into a
          // completed state, we should reload in case permissions change.
          if (
            prevDetails?.holdState === HoldState.Accepted &&
            getTransferResponse.holdState === HoldState.Completed
          ) {
            router.reload();
          }
          return getTransferResponse;
        });

        if (
          getTransferResponse.targetCreator.creatorType === CreatorType.Group &&
          (getTransferResponse.holdState === HoldState.Pending ||
            getTransferResponse.holdState === HoldState.Accepted)
        ) {
          const groupInfo = await groupsClient.getGroupInfo(
            getTransferResponse.targetCreator.creatorId,
          );
          setTargetGroupOwnerId(groupInfo?.owner?.userId);
        }
      } catch {
        // Any error means no valid pending hold
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- NOTE (andrewwan, 11/01/2024): Router should not be part of the dependency list
  }, [gameDetails, settings, user]);

  useEffect(() => {
    void loadTransfer();
  }, [loadTransfer]);

  if (isPendingAnalyticsExperiencePermissions || isLoadingGame || isVariantLoading) {
    return <PageLoading />;
  }

  const isTargetGroupOwner = targetGroupOwnerId !== undefined && user?.id === targetGroupOwnerId;

  // TODO (future): support checking for group ownership when the creator is a group.
  // That way, group owners can still see ExperienceOverviewPage for group-owned games.
  const isCurrentOwner =
    gameDetails?.creator?.type === CreatorType.User && user?.id === gameDetails?.creator?.id;

  if (isTargetGroupOwner && !isCurrentOwner) {
    if (transferDetails?.holdState === HoldState.Accepted) {
      return <InProgressTransferPage loadTransfer={loadTransfer} />;
    }
    if (transferDetails?.holdState === HoldState.Pending) {
      return <ReceiveTransferBanner onSubmit={loadTransfer} />;
    }
  }

  if (!isErrorLoadingGame && gameDetails === null) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} isAgeOrRegionRestricted />;
  }

  if (!canConfigure && !userCanViewAnalyticsForUniverse) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  return (
    // TODO: overview page should have a config
    // https://roblox.atlassian.net/browse/DSA-5206
    <AnalyticsContextLayerInnerProvider config={defaultAnalyticsPageSurfaceConfig}>
      {isTargetGroupOwner && (
        <>
          {transferDetails?.holdState === HoldState.Accepted && (
            <InProgressTransferPage loadTransfer={loadTransfer} compact />
          )}
          {transferDetails?.holdState === HoldState.Pending && (
            <ReceiveTransferBanner onSubmit={loadTransfer} />
          )}
        </>
      )}
      <ExperienceOverviewPage
        variant={variant}
        heroElement={gameDetails ? <OverviewHeader universeDetails={gameDetails} /> : undefined}
      />
    </AnalyticsContextLayerInnerProvider>
  );
};

export default withTranslation(OverviewPageContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Analytics,
]);
