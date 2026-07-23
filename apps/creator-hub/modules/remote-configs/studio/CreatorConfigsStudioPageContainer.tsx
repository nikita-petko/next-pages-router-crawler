/* oxlint-disable react/react-compiler -- StudioViewportWrapper accepts a context hook callback. */
import type { ReactNode } from 'react';
import Authenticated from '@modules/authentication/Authenticated';
import { client as creatorConfigsApi } from '@modules/clients/analytics/universeConfigs';
import { UniverseResourceProvider } from '@modules/experience-analytics-shared/context/resourceContexts/UniverseResourceProvider';
import GameProvider from '@modules/providers/game/GameProvider';
import makeValidatedApi from '../api/makeValidatedAPI';
import CreatorConfigsClientProvider from '../CreatorConfigsClientProvider';
import StudioViewportWrapper from './components/StudioViewportWrapper';
import CreatorConfigsStudioPageContent from './CreatorConfigsStudioPageContent';
import ConfigsStudioMessageBusProvider, {
  useConfigsStudioMessageBusProviderContext,
} from './message-bus/ConfigsStudioMessageBusProvider';

// All we need from getCreationsPageLayout is authentication and the game provider
const CreationsPageProviders = ({ children }: { children: ReactNode }) => {
  return (
    <Authenticated>
      <GameProvider>
        <UniverseResourceProvider>{children}</UniverseResourceProvider>
      </GameProvider>
    </Authenticated>
  );
};

const client = makeValidatedApi(creatorConfigsApi);
const CreatorConfigsStudioPageContainer = () => {
  return (
    <CreationsPageProviders>
      <ConfigsStudioMessageBusProvider>
        <CreatorConfigsClientProvider client={client}>
          <StudioViewportWrapper useContextHook={useConfigsStudioMessageBusProviderContext}>
            <CreatorConfigsStudioPageContent />
          </StudioViewportWrapper>
        </CreatorConfigsClientProvider>
      </ConfigsStudioMessageBusProvider>
    </CreationsPageProviders>
  );
};

export default CreatorConfigsStudioPageContainer;
