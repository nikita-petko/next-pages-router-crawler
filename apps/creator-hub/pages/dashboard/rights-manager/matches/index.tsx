import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import type { NextLayoutPage } from 'next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Translate } from '@rbx/intl';
import { UnifiedLogger } from '@rbx/unified-logger';
import Authenticated from '@modules/authentication/Authenticated';
import { eventStreamBaseUrl } from '@modules/eventStream/tracker';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import MatchesContainer from '@modules/ip/rights/components/matches/MatchesContainer';

const getRightsPortalPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout
    defaultTitle={
      <Translate namespace='CreatorDashboard.RightsPortal' translationKey='Heading.Matches' />
    }
    requireRightsAccount>
    {page}
  </IpAppNavigationLayout>
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

const MatchesPage: NextLayoutPage = () => {
  const unifiedLogger = useMemo(
    () =>
      new UnifiedLogger({
        product: 'CreatorDashboard',
        eventBaseUrl: eventStreamBaseUrl,
      }),
    [],
  );

  useEffect(() => {
    unifiedLogger.trackPageLoad();
  }, [unifiedLogger]);

  return (
    <Authenticated>
      <QueryClientProvider client={queryClient}>
        <MatchesContainer />
      </QueryClientProvider>
    </Authenticated>
  );
};

MatchesPage.getPageLayout = getRightsPortalPageLayout;
MatchesPage.loggerConfig = { rosId: RosTeams.IntellectualProperty };

export default MatchesPage;
