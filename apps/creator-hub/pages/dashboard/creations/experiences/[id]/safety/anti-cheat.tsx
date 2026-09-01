import type { FC, ReactNode } from 'react';
import { useCallback } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { StatusCodes } from '@rbx/core';
import { useFlag } from '@rbx/flags';
import { Translate } from '@rbx/intl';
import { enhancedAntiCheatAccess } from '@generated/flags/antiCheat';
import Authenticated from '@modules/authentication/Authenticated';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import { PageLoading } from '@modules/miscellaneous/components';
import { ErrorPage, PageNotFound } from '@modules/miscellaneous/error';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { AntiCheatConfigProvider } from '@modules/safety-controls/antiCheat/AntiCheatConfigProvider';
import AntiCheatSettings from '@modules/safety-controls/antiCheat/AntiCheatSettings';
import useCanManageAntiCheat from '@modules/safety-controls/antiCheat/useCanManageAntiCheat';

type AntiCheatEnabledPageProps = {
  universeId: number;
};

const AntiCheatEnabledPage: FC<AntiCheatEnabledPageProps> = ({ universeId }) => {
  const router = useRouter();
  const { gameDetails } = useCurrentGame();
  const permissionsQuery = useCanManageAntiCheat(universeId);
  const { refetch: refetchPermissions } = permissionsQuery;

  // The config is scoped per place. The selected place is carried in the `placeId` query
  // param (set by the place selector) so it survives refresh / deep-links; absent that,
  // default to the experience's root place.
  const placeIdParam = Number(router.query.placeId);
  const selectedPlaceId =
    Number.isFinite(placeIdParam) && placeIdParam > 0 ? placeIdParam : gameDetails?.rootPlaceId;

  const handleReloadPermissions = useCallback(() => {
    void refetchPermissions();
  }, [refetchPermissions]);

  if (permissionsQuery.isLoading) {
    return <PageLoading />;
  }

  if (permissionsQuery.isError) {
    return <LoadError onReload={handleReloadPermissions} />;
  }

  if (!permissionsQuery.canManageAntiCheat) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (selectedPlaceId === undefined) {
    return <PageLoading />;
  }

  return (
    <Authenticated>
      <AntiCheatConfigProvider universeId={universeId}>
        <AntiCheatSettings universeId={universeId} placeId={selectedPlaceId} />
      </AntiCheatConfigProvider>
    </Authenticated>
  );
};

const AntiCheatPage: NextLayoutPage = () => {
  const { gameDetails } = useCurrentGame();
  const universeId = gameDetails?.id;
  const { ready: isFlagReady, value: isAntiCheatEnabled } = useFlag(enhancedAntiCheatAccess, {
    universeId: universeId ?? 0,
  });

  if (!isFlagReady || universeId === undefined) {
    return <PageLoading />;
  }

  if (!isAntiCheatEnabled) {
    return <PageNotFound />;
  }

  return <AntiCheatEnabledPage universeId={universeId} />;
};

AntiCheatPage.getPageLayout = (page: ReactNode) =>
  getCreationsPageLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Moderation' />
    ),
  });
AntiCheatPage.loggerConfig = { rosId: RosTeams.AntiCheat };

export default AntiCheatPage;
