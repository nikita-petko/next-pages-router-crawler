import React, { createContext } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  makeStudioWebViewMessageBusContextProvider,
  StudioWebViewMessageBusConnector,
  StudioWebViewMessageBusContextType,
  StudioWebViewMessageBusEventTypesWithDefaults,
} from '@rbx/studio-webview';
import StubMessageBus from './StubMessageBus';

type ConfigsMessageBusEventTypes = StudioWebViewMessageBusEventTypesWithDefaults;
type ConfigsStudioMessageBusProviderContextType =
  StudioWebViewMessageBusContextType<ConfigsMessageBusEventTypes>;

export const ConfigsStudioMessageBusProviderContext =
  createContext<ConfigsStudioMessageBusProviderContextType | null>(null);

export type ConfigsStudioMessageBusProviderProps = React.PropsWithChildren;

// NOTE(gperkins@20250926): This namespace needs to match the namespace in our Lua widget
// https://github.com/Roblox/StudioPlugins/blob/1ce8498e78f39af5fa92ca287500b03c2eaf7198/Standalone/CreatorConfig/src/MainPlugin.lua#L67
export const namespace = 'creatorConfig';

class MockConfigsMessageBus extends StubMessageBus<ConfigsMessageBusEventTypes> {
  constructor() {
    super(namespace);
  }
}

const {
  provider: ConfigsStudioMessageBusBaseProvider,
  useContextHook: useConfigsStudioMessageBusProviderContext,
} = makeStudioWebViewMessageBusContextProvider<ConfigsMessageBusEventTypes, MockConfigsMessageBus>({
  MockMessageBus: MockConfigsMessageBus,
  namespace,
  useSearchParams,
});

const ConfigsStudioMessageBusProvider = ({ children }: ConfigsStudioMessageBusProviderProps) => {
  return (
    <ConfigsStudioMessageBusBaseProvider>
      <StudioWebViewMessageBusConnector useContextHook={useConfigsStudioMessageBusProviderContext}>
        {children}
      </StudioWebViewMessageBusConnector>
    </ConfigsStudioMessageBusBaseProvider>
  );
};

export default ConfigsStudioMessageBusProvider;
export { useConfigsStudioMessageBusProviderContext };
