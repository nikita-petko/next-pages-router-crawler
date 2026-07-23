import React from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import getMatchmakingPageLayout from '@modules/matchmaking/getMatchmakingPageLayout';
import MatchmakingAttributesProvider from '@modules/matchmaking/providers/MatchmakingAttributesProvider';
import MatchmakingConfigurationProvider from '@modules/matchmaking/providers/MatchmakingConfigurationProvider';
import MatchmakingEditConfigurationContainer from '@modules/matchmaking/container/MatchmakingEditConfigurationContainer';
import MatchmakingExperimentsProvider from '@modules/matchmaking/providers/MatchmakingExperimentsProvider';
import { client as universeExperimentationApi } from '@modules/clients/analytics/universeExperimentation';
import { CreatorExperimentationClientProvider } from '@modules/remote-configs/CreatorExperimentationClientProvider';
import makeValidatedExperimentationAPI from '@modules/remote-configs/api/makeValidatedExperimentationAPI';

const EditConfiguration: NextLayoutPage = () => {
  const router = useRouter();
  const configurationId = router.query.configurationId as string;

  const experimentClient = makeValidatedExperimentationAPI(universeExperimentationApi);

  return (
    <MatchmakingAttributesProvider>
      <MatchmakingConfigurationProvider configurationId={configurationId}>
        <CreatorExperimentationClientProvider client={experimentClient}>
          <MatchmakingExperimentsProvider>
            <MatchmakingEditConfigurationContainer />
          </MatchmakingExperimentsProvider>
        </CreatorExperimentationClientProvider>
      </MatchmakingConfigurationProvider>
    </MatchmakingAttributesProvider>
  );
};

EditConfiguration.getPageLayout = getMatchmakingPageLayout;

export default EditConfiguration;
