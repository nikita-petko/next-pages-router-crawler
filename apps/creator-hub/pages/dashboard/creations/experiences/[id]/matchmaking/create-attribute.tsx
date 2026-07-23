import type { NextLayoutPage } from 'next';
import MatchmakingCreateAttributesContainer from '@modules/matchmaking/container/MatchmakingCreateAttributesContainer';
import getMatchmakingPageLayout from '@modules/matchmaking/getMatchmakingPageLayout';
import MatchmakingAttributesProvider from '@modules/matchmaking/providers/MatchmakingAttributesProvider';

const CreateAttribute: NextLayoutPage = () => {
  return (
    <MatchmakingAttributesProvider>
      <MatchmakingCreateAttributesContainer />
    </MatchmakingAttributesProvider>
  );
};
CreateAttribute.getPageLayout = getMatchmakingPageLayout;
CreateAttribute.loggerConfig = { rosId: RosTeams.Matchmaking };

export default CreateAttribute;
