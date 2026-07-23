import React from 'react';
import type { NextLayoutPage } from 'next';
import MatchmakingCreateConfigurationContainer from '@modules/matchmaking/container/MatchmakingCreateConfigurationContainer';
import MatchmakingConfigurationProvider from '@modules/matchmaking/providers/MatchmakingConfigurationProvider';
import MatchmakingAttributesProvider from '@modules/matchmaking/providers/MatchmakingAttributesProvider';
import getMatchmakingPageLayout from '@modules/matchmaking/getMatchmakingPageLayout';
import { useRouter } from 'next/router';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { QueryBasedFeatureFlagsProvider } from '@modules/feature-flags/context/FeatureFlagsProvider';

const CreateConfiguration: NextLayoutPage = () => {
  const router = useRouter();
  const configurationId = router.query.configurationId as string;

  return (
    <QueryBasedFeatureFlagsProvider
      namespaces={[FeatureFlagNamespace.Matchmaking]}
      idType='universeId'>
      <MatchmakingAttributesProvider>
        <MatchmakingConfigurationProvider configurationId={configurationId}>
          <MatchmakingCreateConfigurationContainer />
        </MatchmakingConfigurationProvider>
      </MatchmakingAttributesProvider>
    </QueryBasedFeatureFlagsProvider>
  );
};

CreateConfiguration.getPageLayout = getMatchmakingPageLayout;

export default CreateConfiguration;
