import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import { useAuthentication } from '@modules/authentication/providers';
import { useCreationsCustomSettings } from '@modules/creations/common/implementations/creationsCustomSettings';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import ExperienceWebhooksMetadataContainer from '@modules/creator-settings/container/webhooks/ExperienceWebhooksMetadataContainer';
import PageLoading from '@modules/miscellaneous/components/PageLoading';
import { PageNotFound } from '@modules/miscellaneous/error';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useUniversePermissions } from '@modules/react-query/organizations';

const Webhooks: NextLayoutPage = () => {
  const { isFetched, isExperienceWebhooksEnabled } = useCreationsCustomSettings();
  const { user } = useAuthentication();
  const { gameDetails } = useCurrentGame();
  const { data: universePermissions } = useUniversePermissions(gameDetails?.id);
  const router = useRouter();
  const universeId = parseInt(String(router.query.id), 10);

  const isOwnedByUser =
    gameDetails?.creator?.type === 'User' && gameDetails?.creator?.id === user?.id;
  const canManageWebhooks = isOwnedByUser || universePermissions?.manageWebhooks === true;

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
  getCreationsPageLayout(page, {
    title: <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Webhooks' />,
  });
Webhooks.loggerConfig = { rosId: RosTeams.Knowledge };

export default Webhooks;
