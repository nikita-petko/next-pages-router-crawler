import type { ReactNode } from 'react';
import { StatusCodes } from '@rbx/core';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import { ErrorPage } from '@modules/miscellaneous/error';
import GameProvider from '@modules/providers/game/GameProvider';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import GameLeftNavigation from '../../common/components/GameLeftNavigation';
import EnvironmentProvider from '../EnvironmentProvider';

type EnvironmentPageLayoutProps = {
  children: ReactNode;
};

function EnvironmentPageLayout({ children }: EnvironmentPageLayoutProps) {
  const { settings } = useSettings();

  if (!settings.enableEnvironments) {
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }

  return (
    <GameProvider>
      <EnvironmentProvider>
        <CreatorHubLayout leftNavigationContents={<GameLeftNavigation />}>
          {children}
        </CreatorHubLayout>
      </EnvironmentProvider>
    </GameProvider>
  );
}

export default function getEnvironmentPageLayout(page: ReactNode): ReactNode {
  return <EnvironmentPageLayout>{page}</EnvironmentPageLayout>;
}
