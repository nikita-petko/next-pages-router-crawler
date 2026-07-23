import type { NextGetPageLayout, NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import ViewClaimItemContainer from '@modules/ip/rights/components/claimItem/ViewClaimItemContainer';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';

const getClaimItemPageLayout: NextGetPageLayout = (page) => {
  return <IpAppNavigationLayout requireRightsAccount>{page}</IpAppNavigationLayout>;
};

const RightsPortalClaimItem: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ViewClaimItemContainer />
    </Authenticated>
  );
};

RightsPortalClaimItem.getPageLayout = getClaimItemPageLayout;

export default RightsPortalClaimItem;
