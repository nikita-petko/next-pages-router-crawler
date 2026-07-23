import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { getCreationsPageLayout, ReferralRewardDetailsContainer } from '@modules/creations';

const ListReferralRewardDetails: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ReferralRewardDetailsContainer.ListDetailsContainer />
    </Authenticated>
  );
};

ListReferralRewardDetails.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: 'Heading.ReferralRewards' });

export default ListReferralRewardDetails;
