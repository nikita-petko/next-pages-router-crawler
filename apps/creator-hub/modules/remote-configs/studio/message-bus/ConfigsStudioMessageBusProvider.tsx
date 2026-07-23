import React, { createContext } from 'react';
import { useSearchParams } from 'next/navigation';
import type {
  EmptyParams,
  RequestResponseParams,
  StudioWebViewMessageBusContextType,
  StudioWebViewMessageBusEventTypesWithDefaults,
} from '@rbx/studio-webview';
import {
  makeStudioWebViewMessageBusContextProvider,
  StudioWebViewMessageBusConnector,
} from '@rbx/studio-webview';
import type { DeploymentStrategy } from '../../api/universeConfigsClientEnums';
import StubMessageBus from './StubMessageBus';

export const CreatorConfigStudioMessageBusEvent = {
  OpenPublishModal: 'OpenPublishModal',
  OpenPublishAsModal: 'OpenPublishAsModal',
  StartPublishWorkflow: 'StartPublishWorkflow',
  StartPublishAsWorkflow: 'StartPublishAsWorkflow',
  CancelPublishModal: 'CancelPublishModal',
  CancelPublishWorkflow: 'CancelPublishWorkflow',
  PublishCompleted: 'PublishCompleted',
} as const;

type OpenPublishModalRequestParams = {
  strategy: Exclude<DeploymentStrategy, typeof DeploymentStrategy.Invalid>;
  changeCount: number;
};

type OpenPublishAsModalRequestParams = {
  strategy: Exclude<DeploymentStrategy, typeof DeploymentStrategy.Invalid>;
  configsCount: number;
};

export type StartPublishWorkflowRequestParams = {
  strategy: DeploymentStrategy;
  message: string;
};

export type StartPublishAsWorkflowRequestParams = {
  // uuid generated in Studio, returned in response so Studio can match the request with the response
  publishSessionUuid: string;
  strategy: DeploymentStrategy;
  message: string;
  universeId: number;
};

export type PublishFailureReason =
  | 'invalidStrategy'
  | 'missingUniverseId'
  | 'publishFailed'
  | 'ongoingPublish'
  | 'emptyDraft'
  | 'unknown';
export type PublishCompletedRequestParams = {
  publishSessionUuid: string;
  universeId: number;
  success: boolean;
  error?: PublishFailureReason;
};

export type ConfigsMessageBusEventTypes = StudioWebViewMessageBusEventTypesWithDefaults & {
  [CreatorConfigStudioMessageBusEvent.OpenPublishModal]: RequestResponseParams<
    OpenPublishModalRequestParams,
    EmptyParams
  >;
  [CreatorConfigStudioMessageBusEvent.OpenPublishAsModal]: RequestResponseParams<
    OpenPublishAsModalRequestParams,
    EmptyParams
  >;
  [CreatorConfigStudioMessageBusEvent.StartPublishWorkflow]: RequestResponseParams<
    StartPublishWorkflowRequestParams,
    EmptyParams
  >;
  [CreatorConfigStudioMessageBusEvent.CancelPublishModal]: RequestResponseParams<
    EmptyParams,
    EmptyParams
  >;
  [CreatorConfigStudioMessageBusEvent.CancelPublishWorkflow]: RequestResponseParams<
    EmptyParams,
    EmptyParams
  >;
  [CreatorConfigStudioMessageBusEvent.StartPublishAsWorkflow]: RequestResponseParams<
    StartPublishAsWorkflowRequestParams,
    EmptyParams
  >;
  [CreatorConfigStudioMessageBusEvent.PublishCompleted]: RequestResponseParams<
    PublishCompletedRequestParams,
    EmptyParams
  >;
};
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
} = makeStudioWebViewMessageBusContextProvider<ConfigsMessageBusEventTypes>({
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
