import { FC, useEffect, useState, Fragment, useCallback } from 'react';
import { withTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import ExperienceOverviewPage from '@modules/experience-analytics/pages/ExperienceOverviewPage/ExperienceOverviewPage';
import { ReceiveTransferBanner, InProgressTransferPage } from '@modules/creations';
import { PageLoading } from '@modules/miscellaneous/common';
import { ErrorPage } from '@modules/miscellaneous/error';
import { StatusCodes } from '@rbx/core';
import { groupsClient, ownershipTransferClient, TransferHold } from '@modules/clients';
import { CreatorType, HoldState, ResourceType } from '@rbx/clients/ownershipTransferApi';
import {
  AnalyticsContextLayerInnerProvider,
  UnratedExperienceBanner,
  useGetExperienceUnratedBannerTypeOrNull,
  defaultAnalyticsPageSurfaceConfig,
} from '@modules/experience-analytics-shared';

import { useAuthentication } from '@modules/authentication/providers';
import { useSettings } from '@modules/settings';
import { useRouter } from 'next/router';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import OverviewHeader from '../components/OverviewHeader';

/**
 * Container and entry point for the experience overview page.
 */
const OverviewPageContainer: FC = () => {
  const {
    userCanViewAnalyticsForUniverse,
    isOverviewUnifiedAlertBannerEnabled,
    isFetched: isAnalyticsFlagsFetched,
  } = useFeatureFlagsForNamespace(
    ['userCanViewAnalyticsForUniverse', 'isOverviewUnifiedAlertBannerEnabled'] as const,
    FeatureFlagNamespace.Analytics,
  );
  const { canConfigure, isLoadingGame, isErrorLoadingGame, gameDetails } = useCurrentGame();
  const { user } = useAuthentication();
  const { settings } = useSettings();

  const unratedBannerType = useGetExperienceUnratedBannerTypeOrNull();

  const router = useRouter();

  const [targetGroupOwnerId, setTargetGroupOwnerId] = useState<number>();
  const [transferDetails, setTransferDetails] = useState<TransferHold>();

  const loadTransfer = useCallback(async () => {
    if (gameDetails?.id)
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Error
      } catch (error) {
        // Any error means no valid pending hold
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- NOTE (andrewwan, 11/01/2024): Router should not be part of the dependency list
  }, [gameDetails, settings, user]);

  useEffect(() => {
    loadTransfer();
  }, [loadTransfer]);

  if (!isAnalyticsFlagsFetched || isLoadingGame) {
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
        <Fragment>
          {transferDetails?.holdState === HoldState.Accepted && (
            <InProgressTransferPage loadTransfer={loadTransfer} compact />
          )}
          {transferDetails?.holdState === HoldState.Pending && (
            <ReceiveTransferBanner onSubmit={loadTransfer} />
          )}
        </Fragment>
      )}
      {!isOverviewUnifiedAlertBannerEnabled && unratedBannerType && (
        <Grid item XSmall={12} mb={3}>
          <UnratedExperienceBanner bannerType={unratedBannerType} />
        </Grid>
      )}
      <ExperienceOverviewPage
        heroElement={gameDetails ? <OverviewHeader universeDetails={gameDetails} /> : undefined}
      />
    </AnalyticsContextLayerInnerProvider>
  );
};

export default withTranslation(OverviewPageContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Analytics,
]);
