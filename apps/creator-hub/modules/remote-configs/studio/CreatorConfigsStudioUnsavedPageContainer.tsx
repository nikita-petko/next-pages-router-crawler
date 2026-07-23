import React from 'react';
/* oxlint-disable react/react-compiler -- StudioViewportWrapper accepts a context hook callback. */
import dynamic from 'next/dynamic';
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
    <ConfigsStudioMessageBusProvider>
      <StudioViewportWrapper useContextHook={useConfigsStudioMessageBusProviderContext}>
        <CreatorConfigsStudioUnsavedPageContent />
      </StudioViewportWrapper>
    </ConfigsStudioMessageBusProvider>
  );
};

export default CreatorConfigsStudioUnsavedPageContainer;
