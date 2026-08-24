import type { FC } from 'react';
import ClientSessionBrowserTable from './ClientSessionBrowserTable';
import ClientSessionsMetadataClientProvider from './ClientSessionsMetadataClientProvider';

const ClientSessionBrowserPageContentInner: FC<{ universeId: number }> = ({ universeId }) => {
  // Date range control and the "Filter by" drawer land in a follow-up pass; the "Request data"
  // button and table search input are still being designed and are intentionally left out too.
  return (
    <div className='flex flex-col gap-medium padding-top-small'>
      <ClientSessionBrowserTable universeId={universeId} />
    </div>
  );
};

const ClientSessionBrowserPageContent: FC<{ universeId: number }> = ({ universeId }) => (
  <ClientSessionsMetadataClientProvider universeId={universeId}>
    <ClientSessionBrowserPageContentInner universeId={universeId} />
  </ClientSessionsMetadataClientProvider>
);

export default ClientSessionBrowserPageContent;
