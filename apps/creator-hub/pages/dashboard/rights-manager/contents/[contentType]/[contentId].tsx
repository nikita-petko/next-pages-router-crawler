import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import ViewClaimsAgainstContent from '@modules/ip/rights/components/claimsAgainstContent/ViewClaimsAgainstContent';

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
RightsPortalClaimAgainstContentItem.loggerConfig = { rosId: RosTeams.IntellectualProperty };

export default RightsPortalClaimAgainstContentItem;
