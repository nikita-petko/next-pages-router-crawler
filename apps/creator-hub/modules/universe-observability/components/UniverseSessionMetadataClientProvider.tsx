import React, { type FunctionComponent, useContext } from 'react';
import type { UniverseSessionMetadataApiClient } from '@modules/clients/analytics/universeSessionMetadataApi';

export const UniverseSessionMetadataClientContext =
  React.createContext<UniverseSessionMetadataApiClient | null>(null);

export const useUniverseSessionMetadataClientOrNull = (): UniverseSessionMetadataApiClient | null =>
  useContext(UniverseSessionMetadataClientContext);

export const useUniverseSessionMetadataClient = (): UniverseSessionMetadataApiClient => {
  const client = useUniverseSessionMetadataClientOrNull();
  if (client === null) {
    throw new Error(
      'useUniverseSessionMetadataClient must be used within a UniverseSessionMetadataClientProvider',
    );
  }
  return client;
};

export type UniverseSessionMetadataClientProviderProps = React.PropsWithChildren<{
  readonly client: UniverseSessionMetadataApiClient;
}>;

const UniverseSessionMetadataClientProvider: FunctionComponent<
  UniverseSessionMetadataClientProviderProps
> = ({ children, client }) => (
  <UniverseSessionMetadataClientContext.Provider value={client}>
    {children}
  </UniverseSessionMetadataClientContext.Provider>
);

export default UniverseSessionMetadataClientProvider;
