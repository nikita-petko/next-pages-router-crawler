import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import MatchmakingEditAttributesContainer from '@modules/matchmaking/container/MatchmakingEditAttributesContainer';
import AttributeType from '@modules/matchmaking/enums/AttributeType';
import getMatchmakingPageLayout from '@modules/matchmaking/getMatchmakingPageLayout';
import MatchmakingAttributesProvider from '@modules/matchmaking/providers/MatchmakingAttributesProvider';

const EditAttribute: NextLayoutPage = () => {
  const router = useRouter();
  const attributeId = String(router.query.attributeId);

  return (
    <MatchmakingAttributesProvider serverAttributeId={attributeId}>
      <MatchmakingEditAttributesContainer attributeType={AttributeType.Server} />
    </MatchmakingAttributesProvider>
  );
};

EditAttribute.getPageLayout = getMatchmakingPageLayout;
EditAttribute.loggerConfig = { rosId: RosTeams.Matchmaking };

export default EditAttribute;
