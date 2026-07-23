import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import RightsManagementContainer from '@modules/ip/rights/components/landing/RightsManagementContainer';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const getRightsManagementPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout defaultTitle='Heading.RightsManager'>{page}</IpAppNavigationLayout>
);

const queryClient = new QueryClient({
  // some sane defaults from toolbox
  defaultOptions: {
    queries: {
      // by default react-query eagerly fetches when you change focus to the browser window
      // this seems to be causing errors and the page shows an error
      // it seems best to just turn this off by default
      refetchOnWindowFocus: false,
      // retry takes too long when there are errors. we should only opt-in for retry.
      retry: false,
    },
  },
});
const RightsManagement: NextLayoutPage = () => {
  return (
    <Authenticated>
      <QueryClientProvider client={queryClient}>
        <RightsManagementContainer />
      </QueryClientProvider>
    </Authenticated>
  );
};

RightsManagement.getPageLayout = getRightsManagementPageLayout;

export default RightsManagement;
