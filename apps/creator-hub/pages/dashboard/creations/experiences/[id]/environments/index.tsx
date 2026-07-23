import type { NextLayoutPage } from 'next';
import { getEnvironmentPageLayout, EnvironmentsList } from '@modules/creations';
import GameProvider from '@modules/providers/game/GameProvider';
import Authenticated from '@modules/authentication/Authenticated';

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

export default EnvironmentsPage;
