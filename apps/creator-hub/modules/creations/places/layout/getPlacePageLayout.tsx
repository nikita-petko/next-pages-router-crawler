import type { ReactNode } from 'react';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import GameProvider from '@modules/providers/game/GameProvider';
import { CreationsCustomSettingsProvider } from '../../common/implementations/creationsCustomSettings';
import PlaceLeftNavigation from '../components/PlaceLeftNavigation';
import PlaceProvider from '../hooks/PlaceProvider';

export default function getPlacePageLayout(
  page: ReactNode,
  context: { title?: string | ReactNode } = {},
) {
  const title = 'title' in context ? context.title : undefined;
  return (
    <GameProvider>
      <PlaceProvider>
        {/* (@dbrunais, 05-27-2025) The CreatorHub Layout should be above the providers.
          But to support both versions during the A/B test it needs to remain here for the left navigation.
          Being here will cause the app layout to fully rerender when navigating to and from a places page */}
        <CreatorHubLayout title={title} leftNavigationContents={<PlaceLeftNavigation />}>
          <CreationsCustomSettingsProvider>{page}</CreationsCustomSettingsProvider>
        </CreatorHubLayout>
      </PlaceProvider>
    </GameProvider>
  );
}
