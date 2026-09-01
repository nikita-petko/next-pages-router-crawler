import type { NextLayoutPage } from 'next';
import { useFlag } from '@rbx/flags';
import { isClientSessionsEnabled as isClientSessionsEnabledFlag } from '@generated/flags/creatorAnalytics';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import { PageLoading } from '@modules/miscellaneous/components';
import { PageNotFound } from '@modules/miscellaneous/error';
import ClientSessionBrowserPageContent from '@modules/universe-observability/components/ClientSessionBrowserPageContent';
import ClientSessionsPageTitle from '@modules/universe-observability/components/ClientSessionsPageTitle';
import useUniverseRelatedSession from '@modules/universe-observability/hooks/useUniverseRelatedSession';

const ClientSessions: NextLayoutPage = () => {
  const { isErrorLoadingUniverse, isLoadingUniverse, universeId } = useUniverseRelatedSession();
  const { ready, value: isClientSessionsEnabled } = useFlag(isClientSessionsEnabledFlag, {
    universeId,
  });

  const isLoading = isLoadingUniverse || !ready;

  if (!isLoading && isClientSessionsEnabled && universeId > 0) {
    return <ClientSessionBrowserPageContent universeId={universeId} />;
  }

  if (!isLoading && (isErrorLoadingUniverse || !isClientSessionsEnabled)) {
    return <PageNotFound />;
  }

  return <PageLoading />;
};

ClientSessions.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: <ClientSessionsPageTitle /> });
ClientSessions.loggerConfig = { rosId: RosTeams.Analytics };

export default ClientSessions;
