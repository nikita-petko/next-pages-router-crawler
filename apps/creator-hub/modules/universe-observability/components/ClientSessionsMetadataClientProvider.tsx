import type { FunctionComponent, PropsWithChildren } from 'react';
import universeSessionMetadataClient from '@modules/clients/analytics/universeSessionMetadataApi';
import UniverseSessionMetadataClientProvider from './UniverseSessionMetadataClientProvider';

const ClientSessionsMetadataClientProvider: FunctionComponent<PropsWithChildren> = ({
  children,
}) => (
  <UniverseSessionMetadataClientProvider client={universeSessionMetadataClient}>
    {children}
  </UniverseSessionMetadataClientProvider>
);

export default ClientSessionsMetadataClientProvider;
