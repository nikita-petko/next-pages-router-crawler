import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { client as universeExperimentationApi } from '@modules/clients/analytics/universeExperimentation';
import MatchmakingEditConfigurationContainer from '@modules/matchmaking/container/MatchmakingEditConfigurationContainer';
import getMatchmakingPageLayout from '@modules/matchmaking/getMatchmakingPageLayout';
import MatchmakingAttributesProvider from '@modules/matchmaking/providers/MatchmakingAttributesProvider';
import MatchmakingConfigurationProvider from '@modules/matchmaking/providers/MatchmakingConfigurationProvider';
import MatchmakingExperimentsProvider from '@modules/matchmaking/providers/MatchmakingExperimentsProvider';
import makeValidatedExperimentationAPI from '@modules/remote-configs/api/makeValidatedExperimentationAPI';
import { CreatorExperimentationClientProvider } from '@modules/remote-configs/CreatorExperimentationClientProvider';

const EditConfiguration: NextLayoutPage = () => {
  const router = useRouter();
  const configurationId = String(router.query.configurationId);

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
EditConfiguration.loggerConfig = { rosId: RosTeams.Matchmaking };

export default EditConfiguration;
