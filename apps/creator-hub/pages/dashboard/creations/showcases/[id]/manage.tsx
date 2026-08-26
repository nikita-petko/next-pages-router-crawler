import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import ManageShowcaseContainer from '@modules/creations/showcase/containers/ManageShowcaseContainer';
import getShowcasePageLayout from '@modules/creations/showcase/layout/getShowcasePageLayout';

const ManageShowcase: NextLayoutPage = () => (
  <Authenticated>
    <ManageShowcaseContainer />
  </Authenticated>
);

ManageShowcase.getPageLayout = getShowcasePageLayout;
ManageShowcase.loggerConfig = { rosId: RosTeams.AvatarMarketplace };

export default ManageShowcase;
