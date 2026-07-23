import React, { createContext, useContext, useMemo } from 'react';
import * as signalR from '@microsoft/signalr';
import { EventEmitter } from 'events';
import useConversationReducer from '../hooks/useConversationReducer';
import { ConvAiConfig, Emitter } from '../types';
import useConvAiSetup from '../hooks/useConvAiSetup';

export const ConversationReducerContext = createContext<ReturnType<
  typeof useConversationReducer
> | null>(null);

type ConversationReducerProviderProps = {
  convAiConfig: ConvAiConfig;
  signalRConfig: {
    signalRConnectionUrl: string;
    signalRLogLevel: signalR.LogLevel;
  };
};

export const ConversationReducerProvider: React.FC<
  React.PropsWithChildren<ConversationReducerProviderProps>
> = ({ children, convAiConfig, signalRConfig }) => {
  const emitter = useMemo(() => new EventEmitter() as Emitter, []);
  const { signalRConnectionUrl, signalRLogLevel } = useMemo(() => signalRConfig, [signalRConfig]);
  const { conversationNamespace } = convAiConfig;
  useConvAiSetup({
    emitter,
    signalRConnectionUrl,
    signalRLogLevel,
    conversationNamespace,
  });

  const { state, actions } = useConversationReducer({
    emitter,
    convAiConfig,
  });
  const contextValue = useMemo(() => {
    return {
      state,
      actions,
    };
  }, [actions, state]);

  return (
    <ConversationReducerContext.Provider value={contextValue}>
      {children}
    </ConversationReducerContext.Provider>
  );
};

export const useProvidedConversationReducer = () => {
  const context = useContext(ConversationReducerContext);
  if (!context) {
    throw new Error(
      'useProvidedConversationReducer must be used within a ConversationReducerProvider',
    );
  }
  return context;
};
