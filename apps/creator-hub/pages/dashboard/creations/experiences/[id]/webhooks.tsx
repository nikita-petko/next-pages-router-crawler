import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import Authenticated from '@modules/authentication/Authenticated';
import { useAuthentication } from '@modules/authentication/providers';
import { getCreationsPageLayout, useCreationsCustomSettings } from '@modules/creations';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useUniversePermissions } from '@modules/react-query/organizations';
import ExperienceWebhooksMetadataContainer from '@modules/creator-settings/container/webhooks/ExperienceWebhooksMetadataContainer';
import { PageNotFound } from '@modules/miscellaneous/error';
import PageLoading from '@modules/miscellaneous/common/components/PageLoading';

const Webhooks: NextLayoutPage = () => {
  const { isFetched, isExperienceWebhooksEnabled } = useCreationsCustomSettings();
  const { user } = useAuthentication();
  const { gameDetails } = useCurrentGame();
  const { data: universePermissions } = useUniversePermissions(gameDetails?.id);
  const router = useRouter();
  const universeId = parseInt(router.query.id as string, 10);

  const isOwnedByUser =
    gameDetails?.creator?.type === 'User' && gameDetails?.creator?.id === user?.id;
  const canManageWebhooks =
    isOwnedByUser ||
    (universePermissions as Record<string, boolean> | undefined)?.manageWebhooks === true;

  if (!isFetched) {
    return <PageLoading />;
  }

  if (!isExperienceWebhooksEnabled || !canManageWebhooks) {
    return <PageNotFound />;
  }

  return (
    <Authenticated>
      <ExperienceWebhooksMetadataContainer
        universeId={universeId}
        basePath={`/dashboard/creations/experiences/${universeId}/webhooks`}
      />
    </Authenticated>
  );
};

Webhooks.getPageLayout = (page: ReactNode) =>
  getCreationsPageLayout(page, { title: 'Heading.Webhooks' });

export default Webhooks;
