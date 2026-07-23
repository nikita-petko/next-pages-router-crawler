import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { getCreationsPageLayout, ReferralRewardDetailsContainer } from '@modules/creations';

const CreateReferralRewardDetails: NextLayoutPage = () => {
  return (
    <Authenticated>
      <ReferralRewardDetailsContainer.ReferralRewardSubmissionContainer />
    </Authenticated>
  );
};

CreateReferralRewardDetails.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: 'Heading.ReferralRewards' });

export default CreateReferralRewardDetails;
