import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import ClaimsContainer from '@modules/ip/rights/components/claims/ClaimsContainer';

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
  <IpAppNavigationLayout
    defaultTitle={
      <Translate namespace='CreatorDashboard.RightsPortal' translationKey='Heading.Claims' />
    }
    requireRightsAccount>
    {page}
  </IpAppNavigationLayout>
);
RemovalRequestsPage.loggerConfig = { rosId: RosTeams.IntellectualProperty };

export default RemovalRequestsPage;
