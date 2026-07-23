import { ReactNode } from 'react';
import { StatusCodes } from '@rbx/core';
import { ErrorPage } from '@modules/miscellaneous/error';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';
import GameProvider from '@modules/providers/game/GameProvider';
import { useSettings } from '@modules/settings';
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
        <IALayoutExperiment
          useExperienceNavigation={false}
          leftNavigationContents={<GameLeftNavigation />}>
          {children}
        </IALayoutExperiment>
      </EnvironmentProvider>
    </GameProvider>
  );
}

export default function getEnvironmentPageLayout(page: ReactNode): ReactNode {
  return <EnvironmentPageLayout>{page}</EnvironmentPageLayout>;
}
