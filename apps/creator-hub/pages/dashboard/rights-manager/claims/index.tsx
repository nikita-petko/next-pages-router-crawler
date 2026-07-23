import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ClaimsContainer from '@modules/ip/rights/components/claims/ClaimsContainer';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const RemovalRequestsPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <QueryClientProvider client={queryClient}>
        <ClaimsContainer />
      </QueryClientProvider>
    </Authenticated>
  );
};

RemovalRequestsPage.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout defaultTitle='Heading.Claims' requireRightsAccount>
    {page}
  </IpAppNavigationLayout>
);

export default RemovalRequestsPage;
