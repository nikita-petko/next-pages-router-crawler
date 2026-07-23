import React from 'react';
import type { NextLayoutPage } from 'next';
import getMatchmakingPageLayout from '@modules/matchmaking/getMatchmakingPageLayout';
import MatchmakingAttributesProvider from '@modules/matchmaking/providers/MatchmakingAttributesProvider';
import MatchmakingConfigurationProvider from '@modules/matchmaking/providers/MatchmakingConfigurationProvider';
import MatchmakingMetadataContainer from '@modules/matchmaking/container/MatchmakingMetadataContainer';
import MatchmakingExperimentsProvider from '@modules/matchmaking/providers/MatchmakingExperimentsProvider';
import { CreatorExperimentationClientProvider } from '@modules/remote-configs/CreatorExperimentationClientProvider';
import makeValidatedExperimentationAPI from '@modules/remote-configs/api/makeValidatedExperimentationAPI';
import { client as universeExperimentationApi } from '@modules/clients/analytics/universeExperimentation';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { QueryBasedFeatureFlagsProvider } from '@modules/feature-flags/context/FeatureFlagsProvider';

const experimentClient = makeValidatedExperimentationAPI(universeExperimentationApi);

const Matchmaking: NextLayoutPage = () => {
  return (
    <QueryBasedFeatureFlagsProvider
      namespaces={[FeatureFlagNamespace.Matchmaking]}
      idType='universeId'>
      <MatchmakingAttributesProvider>
        <MatchmakingConfigurationProvider>
          <CreatorExperimentationClientProvider client={experimentClient}>
            <MatchmakingExperimentsProvider>
              <MatchmakingMetadataContainer />
            </MatchmakingExperimentsProvider>
          </CreatorExperimentationClientProvider>
        </MatchmakingConfigurationProvider>
      </MatchmakingAttributesProvider>
    </QueryBasedFeatureFlagsProvider>
  );
};

Matchmaking.getPageLayout = getMatchmakingPageLayout;

export default Matchmaking;
