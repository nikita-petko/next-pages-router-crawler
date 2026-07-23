import React from 'react';
import dynamic from 'next/dynamic';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { FeatureFlagsProvider } from '@modules/feature-flags/context/FeatureFlagsProvider';
import StudioViewportWrapper from './components/StudioViewportWrapper';
import ConfigsStudioMessageBusProvider, {
  useConfigsStudioMessageBusProviderContext,
} from './message-bus/ConfigsStudioMessageBusProvider';

const CreatorConfigsStudioUnsavedPageContent = dynamic(
  () => import('./components/CreatorConfigsStudioUnsavedPageContent'),
  {
    ssr: false,
  },
);

const CreatorConfigsStudioUnsavedPageContainer = () => {
  return (
    <FeatureFlagsProvider namespaces={[FeatureFlagNamespace.Analytics]}>
      <ConfigsStudioMessageBusProvider>
        <StudioViewportWrapper useContextHook={useConfigsStudioMessageBusProviderContext}>
          <CreatorConfigsStudioUnsavedPageContent />
        </StudioViewportWrapper>
      </ConfigsStudioMessageBusProvider>
    </FeatureFlagsProvider>
  );
};

export default CreatorConfigsStudioUnsavedPageContainer;
