import { ReactNode } from 'react';
import GameProvider from '@modules/providers/game/GameProvider';
import Authenticated from '@modules/authentication/Authenticated';
import {
  AnalyticsFlagGatedContext,
  UniverseResourceProvider,
} from '@modules/experience-analytics-shared';
import { client as creatorConfigsApi } from '@modules/clients/analytics/universeConfigs';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { QueryBasedFeatureFlagsProvider } from '@modules/feature-flags/context/FeatureFlagsProvider';
import CreatorConfigsClientProvider from '../CreatorConfigsClientProvider';
import CreatorConfigsStudioPageContent from './CreatorConfigsStudioPageContent';

import makeValidatedApi from '../api/makeValidatedAPI';
import ConfigsStudioMessageBusProvider, {
  useConfigsStudioMessageBusProviderContext,
} from './message-bus/ConfigsStudioMessageBusProvider';
import StudioViewportWrapper from './components/StudioViewportWrapper';

// All we need from getCreationsPageLayout is authentication and the game provider
const CreationsPageProviders = ({ children }: { children: ReactNode }) => {
  return (
    <Authenticated>
      <GameProvider>
        <UniverseResourceProvider>
          <QueryBasedFeatureFlagsProvider
            namespaces={[FeatureFlagNamespace.Analytics]}
            idType='universeId'>
            {children}
          </QueryBasedFeatureFlagsProvider>
        </UniverseResourceProvider>
      </GameProvider>
    </Authenticated>
  );
};

const client = makeValidatedApi(creatorConfigsApi);
const CreatorConfigsStudioPageContainer = () => {
  return (
    <CreationsPageProviders>
      <ConfigsStudioMessageBusProvider>
        <AnalyticsFlagGatedContext flag='remoteConfigsEnabled'>
          <CreatorConfigsClientProvider client={client}>
            <StudioViewportWrapper useContextHook={useConfigsStudioMessageBusProviderContext}>
              <CreatorConfigsStudioPageContent />
            </StudioViewportWrapper>
          </CreatorConfigsClientProvider>
        </AnalyticsFlagGatedContext>
      </ConfigsStudioMessageBusProvider>
    </CreationsPageProviders>
  );
};

export default CreatorConfigsStudioPageContainer;
