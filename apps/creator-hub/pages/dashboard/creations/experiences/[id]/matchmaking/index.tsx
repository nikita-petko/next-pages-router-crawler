import type { NextLayoutPage } from 'next';
import { client as universeExperimentationApi } from '@modules/clients/analytics/universeExperimentation';
import MatchmakingMetadataContainer from '@modules/matchmaking/container/MatchmakingMetadataContainer';
import getMatchmakingPageLayout from '@modules/matchmaking/getMatchmakingPageLayout';
import MatchmakingAttributesProvider from '@modules/matchmaking/providers/MatchmakingAttributesProvider';
import MatchmakingConfigurationProvider from '@modules/matchmaking/providers/MatchmakingConfigurationProvider';
import MatchmakingExperimentsProvider from '@modules/matchmaking/providers/MatchmakingExperimentsProvider';
import makeValidatedExperimentationAPI from '@modules/remote-configs/api/makeValidatedExperimentationAPI';
import { CreatorExperimentationClientProvider } from '@modules/remote-configs/CreatorExperimentationClientProvider';

const experimentClient = makeValidatedExperimentationAPI(universeExperimentationApi);

const Matchmaking: NextLayoutPage = () => {
  return (
    <MatchmakingAttributesProvider>
      <MatchmakingConfigurationProvider>
        <CreatorExperimentationClientProvider client={experimentClient}>
          <MatchmakingExperimentsProvider>
            <MatchmakingMetadataContainer />
          </MatchmakingExperimentsProvider>
        </CreatorExperimentationClientProvider>
      </MatchmakingConfigurationProvider>
    </MatchmakingAttributesProvider>
  );
};

Matchmaking.getPageLayout = getMatchmakingPageLayout;
Matchmaking.loggerConfig = { rosId: RosTeams.Matchmaking };

export default Matchmaking;
