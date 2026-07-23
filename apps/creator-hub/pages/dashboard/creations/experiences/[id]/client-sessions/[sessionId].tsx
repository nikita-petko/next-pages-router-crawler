import type { NextLayoutPage } from 'next';
import { useFlag } from '@rbx/flags';
import { isClientSessionsEnabled as isClientSessionsEnabledFlag } from '@generated/flags/creatorAnalytics';
import Authenticated from '@modules/authentication/Authenticated';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import { PageLoading } from '@modules/miscellaneous/components';
import { PageNotFound } from '@modules/miscellaneous/error';
import ClientSessionsPageTitle from '@modules/universe-observability/components/ClientSessionsPageTitle';
import useUniverseRelatedSession from '@modules/universe-observability/hooks/useUniverseRelatedSession';

const ClientSession: NextLayoutPage = () => {
  const { isErrorLoadingUniverse, isLoadingUniverse, universeId } = useUniverseRelatedSession();
  const { ready, value: isClientSessionsEnabled } = useFlag(isClientSessionsEnabledFlag, {
    universeId,
  });

  if (isLoadingUniverse || !ready) {
    return <PageLoading />;
  }

  if (isErrorLoadingUniverse || !isClientSessionsEnabled) {
    return <PageNotFound />;
  }

  return <Authenticated />;
};

ClientSession.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: <ClientSessionsPageTitle /> });
ClientSession.loggerConfig = { rosId: RosTeams.Analytics };

export default ClientSession;
