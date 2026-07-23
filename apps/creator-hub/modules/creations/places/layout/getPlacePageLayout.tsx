import { ReactNode } from 'react';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';
import GameProvider from '@modules/providers/game/GameProvider';
import { CreationsCustomSettingsProvider } from '@modules/creations/common';
import PlaceProvider from '../hooks/PlaceProvider';
import PlaceLeftNavigation from '../components/PlaceLeftNavigation';

export default function getPlacePageLayout(page: ReactNode, context: { title?: string } = {}) {
  const title = 'title' in context ? context.title : undefined;
  return (
    <GameProvider>
      <PlaceProvider>
        {/* (@dbrunais, 05-27-2025) The CreatorHub Layout should be above the providers.
          But to support both versions during the A/B test it needs to remain here for the left navigation.
          Being here will cause the app layout to fully rerender when navigating to and from a places page */}
        <IALayoutExperiment
          useExperienceNavigation
          title={title}
          leftNavigationContents={<PlaceLeftNavigation />}>
          <CreationsCustomSettingsProvider>{page}</CreationsCustomSettingsProvider>
        </IALayoutExperiment>
      </PlaceProvider>
    </GameProvider>
  );
}
