import React from 'react';
import type { NextLayoutPage } from 'next';
import getMatchmakingPageLayout from '@modules/matchmaking/getMatchmakingPageLayout';
import MatchmakingAttributesProvider from '@modules/matchmaking/providers/MatchmakingAttributesProvider';
import MatchmakingCreateAttributesContainer from '@modules/matchmaking/container/MatchmakingCreateAttributesContainer';

const CreateAttribute: NextLayoutPage = () => {
  return (
    <MatchmakingAttributesProvider>
      <MatchmakingCreateAttributesContainer />
    </MatchmakingAttributesProvider>
  );
};
CreateAttribute.getPageLayout = getMatchmakingPageLayout;

export default CreateAttribute;
