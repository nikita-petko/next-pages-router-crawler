import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import getOrganizationLayout from '@modules/group/layout/getOrganizationLayout';
import PayoutsContainer from '@modules/payouts/containers/PayoutsContainer';

const Payouts: NextLayoutPage = () => {
  return (
    <Authenticated>
      <PayoutsContainer />
    </Authenticated>
  );
};

Payouts.getPageLayout = (page) =>
  getOrganizationLayout(page, {
    title: <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Payouts' />,
    financeRail: true,
  });
Payouts.loggerConfig = { rosId: RosTeams.Organizations };

export default Payouts;
