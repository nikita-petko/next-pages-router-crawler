import type { ParsedUrlQuery } from 'node:querystring';
import type { ReactNode } from 'react';
import Authenticated from '@modules/authentication/Authenticated';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import ExperienceGuidelinesProvider from '@modules/experience-guidelines/providers/ExperienceGuidelinesProvider';
import GameProvider from '@modules/providers/game/GameProvider';
import GameLeftNavigation from '../components/GameLeftNavigation';
import { CreationsCustomSettingsProvider } from './creationsCustomSettings';

export type TGetCreationsPageLayoutContext =
  | { title?: ReactNode; beta?: boolean; omitPageTitle?: boolean }
  | { query: ParsedUrlQuery };

export default function getCreationsPageLayout(
  page: ReactNode,
  // (@dbrunais, 05-27-2025) Remove query once all pages creations pages are migrated. Doing this so we don't have to migrate all pages in one PR.
  context: TGetCreationsPageLayoutContext = {},
) {
  return (
    <CreationsCustomSettingsProvider>
      <Authenticated>
        <ExperienceGuidelinesProvider>
          <GameProvider>
            {/* (@dbrunais, 05-27-2025) The CreatorHub Layout should be above the providers.
            But to support both versions during the A/B test it needs to remain here for the left navigation.
            Being here will cause the app layout to fully rerender when navigating to and from a creations page */}
            <CreatorHubLayout
              {...context}
              leftNavigationContents={<GameLeftNavigation />}
              secondarySize='small'>
              {page}
            </CreatorHubLayout>
          </GameProvider>
        </ExperienceGuidelinesProvider>
      </Authenticated>
    </CreationsCustomSettingsProvider>
  );
}
