import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import ViewClaimsAgainstContent from '@modules/ip/rights/components/claimsAgainstContent/ViewClaimsAgainstContent';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';

const getClaimAgainstContentLayout = (page: ReactNode) => (
  <IpAppNavigationLayout requireRightsAccount>{page}</IpAppNavigationLayout>
);

const RightsPortalClaimAgainstContentItem: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ViewClaimsAgainstContent />
    </Authenticated>
  );
};

RightsPortalClaimAgainstContentItem.getPageLayout = getClaimAgainstContentLayout;

export default RightsPortalClaimAgainstContentItem;
