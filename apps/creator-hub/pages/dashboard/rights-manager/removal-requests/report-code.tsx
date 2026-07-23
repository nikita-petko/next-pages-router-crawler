import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import ReportCodeContainer from '@modules/ip/rights/components/reportCodes/ReportCodeContainer';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
        <ReportCodeContainer enableClaimsAndDisputes={false} />
      </QueryClientProvider>
    </Authenticated>
  );
};

UseReportCodePage.getPageLayout = (page: ReactNode) => (
  <IpAppNavigationLayout
    defaultTitle='Heading.NewRemovalRequestWithReportCode'
    requireRightsAccount>
    {page}
  </IpAppNavigationLayout>
);

export default UseReportCodePage;
