import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import EnvironmentsList from '@modules/creations/environment/components/EnvironmentsList';
import getEnvironmentPageLayout from '@modules/creations/environment/layout/getEnvironmentPageLayout';
import GameProvider from '@modules/providers/game/GameProvider';

const EnvironmentsPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <GameProvider>
        <EnvironmentsList />
      </GameProvider>
    </Authenticated>
  );
};

EnvironmentsPage.getPageLayout = (page) => getEnvironmentPageLayout(page);
EnvironmentsPage.loggerConfig = { rosId: RosTeams.CollaborativeTools };

export default EnvironmentsPage;
