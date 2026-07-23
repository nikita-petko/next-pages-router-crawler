import { ReactNode } from 'react';
import Authenticated from '@modules/authentication/Authenticated';
import GameProvider from '@modules/providers/game/GameProvider';
import ExperienceGuidelinesProvider from '@modules/experience-guidelines/providers/ExperienceGuidelinesProvider';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';
import { ParsedUrlQuery } from 'querystring';
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
            <IALayoutExperiment
              {...context}
              leftNavigationContents={<GameLeftNavigation />}
              useExperienceNavigation
              secondarySize='small'>
              {page}
            </IALayoutExperiment>
          </GameProvider>
        </ExperienceGuidelinesProvider>
      </Authenticated>
    </CreationsCustomSettingsProvider>
  );
}
