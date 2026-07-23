import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import MatchmakingCreateConfigurationContainer from '@modules/matchmaking/container/MatchmakingCreateConfigurationContainer';
import getMatchmakingPageLayout from '@modules/matchmaking/getMatchmakingPageLayout';
import MatchmakingAttributesProvider from '@modules/matchmaking/providers/MatchmakingAttributesProvider';
import MatchmakingConfigurationProvider from '@modules/matchmaking/providers/MatchmakingConfigurationProvider';

const CreateConfiguration: NextLayoutPage = () => {
  const router = useRouter();
  const { configurationId } = router.query;
  const configurationIdString = Array.isArray(configurationId)
    ? configurationId[0]
    : configurationId;

  return (
    <MatchmakingAttributesProvider>
      <MatchmakingConfigurationProvider configurationId={configurationIdString}>
        <MatchmakingCreateConfigurationContainer />
      </MatchmakingConfigurationProvider>
    </MatchmakingAttributesProvider>
  );
};

CreateConfiguration.getPageLayout = getMatchmakingPageLayout;
CreateConfiguration.loggerConfig = { rosId: RosTeams.Matchmaking };

export default CreateConfiguration;
