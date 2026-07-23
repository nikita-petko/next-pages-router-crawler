import React, { useMemo } from 'react';
import { ValidRemoteConfigAPI } from './api/validTypes';
import CreatorConfigsRealtimeClientProvider from './CreatorConfigsRealtimeClientProvider';

const creatorConfigsClientContext = React.createContext<{
  client?: ValidRemoteConfigAPI;
}>({});

const CreatorConfigsClientProvider: React.FC<
  React.PropsWithChildren<{ client: ValidRemoteConfigAPI }>
> = ({ client, children }) => {
  const value = useMemo(() => ({ client }), [client]);
  return (
    <CreatorConfigsRealtimeClientProvider>
      <creatorConfigsClientContext.Provider value={value}>
        {children}
      </creatorConfigsClientContext.Provider>
    </CreatorConfigsRealtimeClientProvider>
  );
};
export default CreatorConfigsClientProvider;

export const useCreatorConfigsClient = (): ValidRemoteConfigAPI => {
  const { client } = React.useContext(creatorConfigsClientContext);
  if (!client) {
    throw new Error('useCreatorConfigsClient must be used within a CreatorConfigsClientProvider');
  }
  return client;
};
