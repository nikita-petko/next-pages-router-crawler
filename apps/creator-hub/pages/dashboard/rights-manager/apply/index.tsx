import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import RegistrationContainer from '@modules/ip/rights/components/registration/RegistrationContainer';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const getRightsPortalPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout defaultTitle='Heading.Registration'>{page}</IpAppNavigationLayout>
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
const Apply: NextLayoutPage = () => {
  return (
    <Authenticated>
      <QueryClientProvider client={queryClient}>
        <RegistrationContainer />
      </QueryClientProvider>
    </Authenticated>
  );
};

Apply.getPageLayout = getRightsPortalPageLayout;

export default Apply;
