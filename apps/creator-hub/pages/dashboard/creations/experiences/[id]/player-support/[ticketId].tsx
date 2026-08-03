import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import { PageLoading } from '@modules/miscellaneous/components';
import { PageNotFound } from '@modules/miscellaneous/error';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import TicketDetailsPage from '@modules/player-support/components/TicketDetailsPage';
import { useCreatorGameopsFlags } from '@modules/player-support/flags/useCreatorGameopsFlags';

const TicketDetails: NextLayoutPage = () => {
  const universeIdResult = useUniverseId();
  const universeId =
    !universeIdResult.isLoading && !universeIdResult.isError ? universeIdResult.universeId : 0;

  const { enablePlayerSupport, ready } = useCreatorGameopsFlags('enablePlayerSupport', {
    universeId,
  });

  if (universeIdResult.isLoading || !ready) {
    return <PageLoading />;
  }

  if (universeIdResult.isError || !enablePlayerSupport) {
    return <PageNotFound />;
  }

  return (
    <Authenticated>
      <TicketDetailsPage />
    </Authenticated>
  );
};

TicketDetails.getPageLayout = (page: ReactNode) =>
  getCreationsPageLayout(page, { omitPageTitle: true });
TicketDetails.loggerConfig = { rosId: RosTeams.GameOperations };

export default TicketDetails;
