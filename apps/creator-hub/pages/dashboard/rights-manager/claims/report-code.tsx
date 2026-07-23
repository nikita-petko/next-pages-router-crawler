import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import ReportCodeContainer from '@modules/ip/rights/components/reportCodes/ReportCodeContainer';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const UseReportCodePage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <QueryClientProvider client={queryClient}>
        <ReportCodeContainer enableClaimsAndDisputes />
      </QueryClientProvider>
    </Authenticated>
  );
};

UseReportCodePage.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout
    defaultTitle={
      <Translate
        namespace='CreatorDashboard.RightsPortal'
        translationKey='Heading.NewClaimWithReportCode'
      />
    }
    requireRightsAccount>
    {page}
  </IpAppNavigationLayout>
);
UseReportCodePage.loggerConfig = { rosId: RosTeams.IntellectualProperty };

export default UseReportCodePage;
