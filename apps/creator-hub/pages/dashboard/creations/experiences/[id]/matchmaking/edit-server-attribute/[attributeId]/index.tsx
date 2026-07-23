import React from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import AttributeType from '@modules/matchmaking/enums/AttributeType';
import getMatchmakingPageLayout from '@modules/matchmaking/getMatchmakingPageLayout';
import MatchmakingAttributesProvider from '@modules/matchmaking/providers/MatchmakingAttributesProvider';
import MatchmakingEditAttributesContainer from '@modules/matchmaking/container/MatchmakingEditAttributesContainer';

const EditAttribute: NextLayoutPage = () => {
  const router = useRouter();
  const attributeId = router.query.attributeId as string;

  return (
    <MatchmakingAttributesProvider serverAttributeId={attributeId}>
      <MatchmakingEditAttributesContainer attributeType={AttributeType.Server} />
    </MatchmakingAttributesProvider>
  );
};

EditAttribute.getPageLayout = getMatchmakingPageLayout;

export default EditAttribute;
