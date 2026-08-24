import type { FunctionComponent, PropsWithChildren } from 'react';
import { useFlag } from '@rbx/flags';
import { isClientSessionsRealDataEnabled as isClientSessionsRealDataEnabledFlag } from '@generated/flags/creatorAnalytics';
import universeSessionMetadataClient from '@modules/clients/analytics/universeSessionMetadataApi';
import { mockUniverseSessionMetadataClient } from '../mockData/clientSessionMetadata';
import UniverseSessionMetadataClientProvider from './UniverseSessionMetadataClientProvider';

type ClientSessionsMetadataClientProviderProps = PropsWithChildren<{
  readonly universeId: number;
}>;

const ClientSessionsMetadataClientProvider: FunctionComponent<
  ClientSessionsMetadataClientProviderProps
> = ({ children, universeId }) => {
  const { ready, value: isClientSessionsRealDataEnabled } = useFlag(
    isClientSessionsRealDataEnabledFlag,
    { universeId },
  );

  if (!ready) {
    return null;
  }

  const client = isClientSessionsRealDataEnabled
    ? universeSessionMetadataClient
    : mockUniverseSessionMetadataClient;

  return (
    <UniverseSessionMetadataClientProvider client={client}>
      {children}
    </UniverseSessionMetadataClientProvider>
  );
};

export default ClientSessionsMetadataClientProvider;
