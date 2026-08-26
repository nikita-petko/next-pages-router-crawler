import type { FC } from 'react';
import ClientSessionBrowserTable from './ClientSessionBrowserTable';
import ClientSessionsMetadataClientProvider from './ClientSessionsMetadataClientProvider';

const ClientSessionBrowserPageContent: FC<{ universeId: number }> = ({ universeId }) => (
  <ClientSessionsMetadataClientProvider>
    <div className='flex flex-col gap-medium padding-top-small'>
      <ClientSessionBrowserTable universeId={universeId} />
    </div>
  </ClientSessionsMetadataClientProvider>
);

export default ClientSessionBrowserPageContent;
