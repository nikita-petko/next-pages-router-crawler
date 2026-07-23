import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import CreateClaimsContainer from '@modules/ip/rights/components/createClaims/CreateClaimsContainer';

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

const CreateClaimsPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <QueryClientProvider client={queryClient}>
        <CreateClaimsContainer />
      </QueryClientProvider>
    </Authenticated>
  );
};

CreateClaimsPage.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout
    defaultTitle={
      <Translate namespace='CreatorDashboard.RightsPortal' translationKey='Label.NewClaim' />
    }
    requireRightsAccount>
    {page}
  </IpAppNavigationLayout>
);
CreateClaimsPage.loggerConfig = { rosId: RosTeams.IntellectualProperty };

export default CreateClaimsPage;
