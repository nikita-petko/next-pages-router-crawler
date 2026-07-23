import React, { ReactNode } from 'react';
import { getCreationsPageLayout } from '@modules/creations';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { QueryBasedFeatureFlagsProvider } from '@modules/feature-flags/context/FeatureFlagsProvider';
import UniversePlacesProvider from './providers/UniversePlacesProvider';

export default function getMatchmakingPageLayout(page: ReactNode) {
  return getCreationsPageLayout(
    <QueryBasedFeatureFlagsProvider
      namespaces={[FeatureFlagNamespace.Matchmaking]}
      idType='universeId'>
      <UniversePlacesProvider>{page}</UniversePlacesProvider>
    </QueryBasedFeatureFlagsProvider>,
    {
      title: 'Heading.CustomMatchmaking',
    },
  );
}
