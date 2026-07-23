import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import ViewClaimItemContainer from '@modules/ip/rights/components/claimItem/ViewClaimItemContainer';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import useCurrentAccount from '@modules/ip/rights/hooks/useCurrentAccount';
import { PageNotFound } from '@modules/miscellaneous/error';
import { CircularProgress, Grid } from '@rbx/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const getClaimItemPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout requireRightsAccount>{page}</IpAppNavigationLayout>
);

const ShowRightsPortalClaimItem: NextLayoutPage = () => {
  const { account, features } = useCurrentAccount();

  if (!account) {
    return (
      <Grid justifyContent='center' alignItems='center' height='100%' container>
        <CircularProgress />
      </Grid>
    );
  }

  if (!features?.enableClaimsAndDisputes) {
    return (
      <Authenticated>
        <PageNotFound />
      </Authenticated>
    );
  }

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
  return (
    <Authenticated>
      <QueryClientProvider client={queryClient}>
        <ViewClaimItemContainer />
      </QueryClientProvider>
    </Authenticated>
  );
};

ShowRightsPortalClaimItem.getPageLayout = getClaimItemPageLayout;

export default ShowRightsPortalClaimItem;
