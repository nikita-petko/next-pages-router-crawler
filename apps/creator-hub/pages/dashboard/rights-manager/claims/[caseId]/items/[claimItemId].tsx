import type { NextGetPageLayout, NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import IpAppNavigationLayout from '@modules/ip/IpAppNavigationLayout';
import ViewClaimItemContainer from '@modules/ip/rights/components/claimItem/ViewClaimItemContainer';

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
RightsPortalClaimItem.loggerConfig = { rosId: RosTeams.IntellectualProperty };

export default RightsPortalClaimItem;
