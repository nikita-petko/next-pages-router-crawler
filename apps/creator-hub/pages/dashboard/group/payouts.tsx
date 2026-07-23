import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import PayoutsContainer from '@modules/payouts/containers/PayoutsContainer';
import getOrganizationLayout from '@modules/group/layout/getOrganizationLayout';

const Payouts: NextLayoutPage = () => {
  return (
    <Authenticated>
      <PayoutsContainer />
    </Authenticated>
  );
};

Payouts.getPageLayout = (page) =>
  getOrganizationLayout(page, { title: 'Heading.Payouts', financeRail: true });

export default Payouts;
